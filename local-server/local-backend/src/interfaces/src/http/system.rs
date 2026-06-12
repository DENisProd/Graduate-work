use axum::{
    extract::State,
    routing::{get, post},
    Json, Router,
};
use chrono::{DateTime, Utc};
use local_server_application::ports::{
    AuthPollResult, CompleteAuthArgs, UpsertFromCloudCmd, UpsertFromCloudWidgetDashboardCmd,
};
use local_server_application::{
    local_server_mqtt_username, resolve_bridge_house_id, resolve_mqtt_runtime_config,
    resolve_scenario_service_url, DomainError,
};
use local_server_core::entities::scenario::ScenarioStatus;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

use super::error::AppError;
use crate::HttpAppState;

pub fn router(state: HttpAppState) -> Router {
    Router::new()
        .route("/system/health", get(health))
        .route("/system/sync/status", get(sync_status))
        .route("/system/sync", post(trigger_sync))
        .route("/system/settings", get(get_settings).patch(patch_settings))
        .route("/system/auth/start", post(start_auth))
        .route("/system/auth/status", get(auth_status))
        .route("/system/auth/complete", post(complete_auth))
        .route("/system/auth/logout", post(logout_auth))
        .route("/system/auth/callback", post(auth_callback))
        .route("/system/reset", post(reset_local_data_handler))
        .route("/system/mqtt/provision", post(provision_mqtt_credentials_handler))
        .with_state(state)
}

#[derive(Debug, Serialize, ToSchema)]
pub struct HealthResponse {
    status: &'static str,
    version: &'static str,
    db: &'static str,
    mqtt_connected: bool,
}

#[utoipa::path(
    get,
    path = "/api/v1/system/health",
    responses(
        (status = 200, description = "Service is alive", body = HealthResponse)
    ),
    tag = "system"
)]
pub async fn health(State(state): State<HttpAppState>) -> Json<HealthResponse> {
    let db = match state.health.check_db().await {
        Ok(()) => "ok",
        Err(err) => {
            tracing::warn!(error = %err, "db health probe failed");
            "error"
        }
    };

    Json(HealthResponse {
        status: "ok",
        version: state.version,
        db,
        mqtt_connected: state.mqtt.is_connected().await,
    })
}

async fn sync_status(
    State(state): State<HttpAppState>,
) -> Result<Json<SyncStatusResponse>, AppError> {
    let status = state.access_sync.get_status().await?;
    Ok(Json(SyncStatusResponse {
        pending_outbox: status.pending_outbox,
        last_pulled_at: status.last_pulled_at,
        last_pushed_at: status.last_pushed_at,
    }))
}

#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct SyncReport {
    pub houses_upserted: usize,
    pub rooms_upserted: usize,
    pub roles_upserted: usize,
    pub members_upserted: usize,
    pub scenarios_upserted: usize,
    pub dashboards_upserted: usize,
}

async fn trigger_sync(
    State(state): State<HttpAppState>,
) -> Result<Json<SyncReport>, AppError> {
    let settings = state.runtime_settings.load().await?;
    let user_id = settings.auth_external_user_id.ok_or_else(|| {
        DomainError::Validation(
            "Not authorized with cloud. Call /system/auth/start first.".into(),
        )
    })?;
    let runtime_access = settings.access_service_url.clone();
    let access_service_url =
        resolve_access_service_url(runtime_access.clone(), &state.default_access_service_url);

    state.access_sync.upsert_owner(&user_id).await?;

    let houses = state
        .cloud_sync
        .fetch_user_houses(&access_service_url, &user_id)
        .await?;
    let houses_upserted = houses.len();
    state.access_sync.upsert_houses(&houses, &user_id).await?;
    let now = Utc::now().to_rfc3339();
    state.access_sync.mark_pulled("houses", &now).await?;

    let mut rooms_upserted = 0usize;
    let mut roles_upserted = 0usize;
    let mut members_upserted = 0usize;
    for house in &houses {
        match state
            .cloud_sync
            .fetch_house_resources(&access_service_url, &house.id)
            .await
        {
            Ok(resources) => {
                rooms_upserted += resources
                    .iter()
                    .filter(|r| r.r#type.eq_ignore_ascii_case("ROOM"))
                    .count();
                state.access_sync.upsert_resources(&house.id, &resources).await?;
            }
            Err(e) => {
                tracing::warn!(house_id = %house.id, error = %e, "trigger_sync: fetch_house_resources failed");
                if let Ok(rooms) = state
                    .cloud_sync
                    .fetch_house_rooms(&access_service_url, &house.id)
                    .await
                {
                    rooms_upserted += rooms.len();
                    state.access_sync.upsert_rooms(&house.id, &rooms).await?;
                }
            }
        }
        match state
            .cloud_sync
            .fetch_house_roles(&access_service_url, &house.id)
            .await
        {
            Ok(roles) => {
                roles_upserted += roles.len();
                state.access_sync.upsert_rbac_roles(&house.id, &roles).await?;
            }
            Err(e) => {
                tracing::warn!(house_id = %house.id, error = %e, "trigger_sync: fetch_house_roles failed");
            }
        }
        match state
            .cloud_sync
            .fetch_house_members(&access_service_url, &house.id)
            .await
        {
            Ok(members) => {
                members_upserted += members.len();
                state.access_sync.upsert_members(&house.id, &members).await?;
                state.access_sync.upsert_rbac_members(&house.id, &members).await?;
            }
            Err(e) => {
                tracing::warn!(house_id = %house.id, error = %e, "trigger_sync: fetch_house_members failed");
            }
        }
    }
    let now = Utc::now().to_rfc3339();
    state.access_sync.mark_pulled("rooms", &now).await?;
    state.access_sync.mark_pulled("resources", &now).await?;
    state.access_sync.mark_pulled("roles", &now).await?;
    state.access_sync.mark_pulled("members", &now).await?;

    // Issue the default local password ("0000") to freshly synced users and
    // force the cloud linker to change theirs on first login.
    if let Err(e) = state.local_auth.ensure_defaults("0000").await {
        tracing::warn!(error = %e, "trigger_sync: ensure_defaults failed");
    }

    match state
        .cloud_sync
        .fetch_user_access_rights(&access_service_url, &user_id)
        .await
    {
        Ok(rights) => {
            state.access_sync.upsert_access_rights(&user_id, &rights).await?;
            state.access_sync.mark_pulled("access_rights", &now).await?;
        }
        Err(e) => tracing::warn!(error = %e, "trigger_sync: fetch_user_access_rights failed"),
    }

    let scenario_service_url = resolve_scenario_service_url(
        runtime_access.as_deref(),
        &state.default_cloud_sync_url,
        &state.scenario_service_url,
    );
    tracing::info!(scenario_base = %scenario_service_url, "trigger_sync: pulling scenarios");

    let scenarios_upserted = match state.cloud_scenario.list_all(&scenario_service_url).await {
        Ok(remote_scenarios) => {
            let count = remote_scenarios.len();
            for remote in remote_scenarios {
                let status = remote
                    .status
                    .parse::<ScenarioStatus>()
                    .unwrap_or(ScenarioStatus::Offline);
                let cloud_updated_at = DateTime::parse_from_rfc3339(&remote.updated_at)
                    .map(|dt| dt.with_timezone(&Utc))
                    .unwrap_or_else(|_| Utc::now());
                if let Err(e) = state
                    .scenario_repo
                    .upsert_from_cloud(
                        &remote.cloud_id,
                        UpsertFromCloudCmd {
                            name: remote.name,
                            description: remote.description,
                            house_id: remote.house_id,
                            creator_id: remote.creator_id,
                            definition: remote.definition,
                            status,
                            cloud_updated_at,
                        },
                    )
                    .await
                {
                    tracing::warn!(error = %e, cloud_id = %remote.cloud_id, "trigger_sync: scenario upsert failed");
                }
            }
            count
        }
        Err(e) => {
            tracing::warn!(error = %e, "trigger_sync: failed to fetch scenarios");
            0
        }
    };

    let mut dashboards_upserted = 0usize;
    for house in &houses {
        match state
            .cloud_widget_dashboard
            .list_by_house(&scenario_service_url, &house.id)
            .await
        {
            Ok(remotes) => {
                dashboards_upserted += remotes.len();
                for remote in remotes {
                    let cloud_updated_at = DateTime::parse_from_rfc3339(&remote.updated_at)
                        .map(|dt| dt.with_timezone(&Utc))
                        .unwrap_or_else(|_| Utc::now());
                    if let Err(e) = state
                        .widget_dashboard_repo
                        .upsert_from_cloud(
                            &remote.cloud_id,
                            UpsertFromCloudWidgetDashboardCmd {
                                house_id: remote.house_id,
                                user_id: remote.user_id,
                                name: remote.name,
                                is_default: remote.is_default,
                                layouts: remote.layouts,
                                widgets: remote.widgets,
                                cloud_updated_at,
                            },
                        )
                        .await
                    {
                        tracing::warn!(error = %e, cloud_id = %remote.cloud_id, "trigger_sync: dashboard upsert failed");
                    }
                }
            }
            Err(e) => {
                tracing::warn!(house_id = %house.id, error = %e, "trigger_sync: failed to fetch dashboards");
            }
        }
    }

    tracing::info!(
        houses = houses_upserted,
        rooms = rooms_upserted,
        roles = roles_upserted,
        members = members_upserted,
        scenarios = scenarios_upserted,
        dashboards = dashboards_upserted,
        "cloud sync pull complete"
    );

    if let Some(house) = houses.first() {
        ensure_mqtt_credentials(&state, &house.id).await;
    }
    reconfigure_mqtt_from_settings(&state).await;

    Ok(Json(SyncReport {
        houses_upserted,
        rooms_upserted,
        roles_upserted,
        members_upserted,
        scenarios_upserted,
        dashboards_upserted,
    }))
}

#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeSettingsResponse {
    pub mqtt_url: Option<String>,
    pub mqtt_cloud_url: Option<String>,
    pub mqtt_username: Option<String>,
    pub has_mqtt_password: bool,
    pub access_service_url: String,
    pub mqtt_connected: bool,
    pub mqtt_cloud_connected: bool,
    pub auth_session_id: Option<String>,
    pub auth_status: Option<String>,
    pub auth_code: Option<String>,
    pub auth_external_user_id: Option<String>,
    pub auth_display_name: Option<String>,
    pub auth_expires_at: Option<String>,
}

#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct SyncStatusResponse {
    pub pending_outbox: i64,
    pub last_pulled_at: Option<String>,
    pub last_pushed_at: Option<String>,
}

#[derive(Debug, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct UpdateRuntimeSettingsRequest {
    pub access_service_url: Option<String>,
    pub mqtt_username: Option<String>,
    /// Empty or omitted — keep existing password.
    pub mqtt_password: Option<String>,
}

#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct StartAuthResponse {
    pub auth_session_id: String,
    pub user_code: String,
    pub verification_url: String,
    pub expires_in: u64,
    pub poll_interval: u64,
}

#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct AuthStatusResponse {
    pub auth_session_id: String,
    pub status: String,
    pub auth_code: Option<String>,
    pub external_user_id: Option<String>,
    pub display_name: Option<String>,
}

#[derive(Debug, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CompleteAuthRequest {
    pub user_code: String,
    pub external_user_id: String,
    pub display_name: Option<String>,
}

#[derive(Debug, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct AuthCallbackRequest {
    pub auth_session_id: String,
    pub status: String,
    pub auth_code: Option<String>,
    pub external_user_id: Option<String>,
    pub display_name: Option<String>,
    pub expires_at: Option<String>,
}

fn normalize_opt(value: Option<String>) -> Option<String> {
    value.and_then(|s| {
        let trimmed = s.trim();
        if trimmed.is_empty() {
            None
        } else {
            Some(trimmed.to_string())
        }
    })
}

fn resolve_access_service_url(
    settings_url: Option<String>,
    default_url: &str,
) -> String {
    settings_url.unwrap_or_else(|| default_url.to_string())
}

async fn ensure_mqtt_credentials(state: &HttpAppState, house_id: &str) {
    let settings = match state.runtime_settings.load().await {
        Ok(s) => s,
        Err(e) => {
            tracing::warn!(error = %e, "MQTT credentials: failed to load settings");
            return;
        }
    };
    if settings
        .mqtt_username
        .as_ref()
        .is_some_and(|u| !u.trim().is_empty())
        && settings
            .mqtt_password
            .as_ref()
            .is_some_and(|p| !p.trim().is_empty())
    {
        return;
    }

    let scenario_service_url = resolve_scenario_service_url(
        settings.access_service_url.as_deref(),
        &state.default_cloud_sync_url,
        &state.scenario_service_url,
    );

    match state
        .cloud_scenario
        .provision_house_mqtt(&scenario_service_url, house_id)
        .await
    {
        Ok(creds) => {
            if let Err(e) = state
                .runtime_settings
                .set_mqtt_username(Some(&creds.username))
                .await
            {
                tracing::warn!(error = %e, "MQTT credentials: failed to save username");
                return;
            }
            if let Err(e) = state
                .runtime_settings
                .set_mqtt_password(Some(&creds.password))
                .await
            {
                tracing::warn!(error = %e, "MQTT credentials: failed to save password");
                return;
            }
            tracing::info!(
                username = %creds.username,
                house_id,
                "MQTT credentials provisioned from cloud"
            );
        }
        Err(e) => {
            tracing::warn!(
                error = %e,
                house_id,
                expected_username = %local_server_mqtt_username(house_id),
                "MQTT auto-provision failed — set EMQX credentials manually in settings"
            );
        }
    }
}

async fn reconfigure_mqtt_from_settings(state: &HttpAppState) {
    let settings = match state.runtime_settings.load().await {
        Ok(s) => s,
        Err(e) => {
            tracing::warn!(error = %e, "MQTT reconfigure: failed to load settings");
            return;
        }
    };
    let gateway_url = resolve_access_service_url(
        settings.access_service_url.clone(),
        &state.default_access_service_url,
    );
    let bridge_house_id = resolve_bridge_house_id(
        state.access_sync.as_ref(),
        &settings,
        state.configured_bridge_house_id.as_deref(),
    )
    .await;
    let mqtt_config = resolve_mqtt_runtime_config(
        state.configured_mqtt_url.as_deref(),
        &gateway_url,
        &settings,
        state.default_mqtt_username.as_deref(),
        state.default_mqtt_password.as_deref(),
        bridge_house_id,
    );
    if let Err(e) = state.mqtt.reconfigure(mqtt_config).await {
        tracing::warn!(error = %e, "MQTT reconfigure failed");
    }
}

async fn get_settings(
    State(state): State<HttpAppState>,
) -> Result<Json<RuntimeSettingsResponse>, AppError> {
    let settings = state.runtime_settings.load().await?;
    Ok(Json(RuntimeSettingsResponse {
        mqtt_url: state.mqtt.current_url().await,
        mqtt_cloud_url: state.mqtt.cloud_current_url().await,
        mqtt_username: settings.mqtt_username,
        has_mqtt_password: settings.mqtt_password.is_some(),
        access_service_url: resolve_access_service_url(
            settings.access_service_url,
            &state.default_access_service_url,
        ),
        mqtt_connected: state.mqtt.is_connected().await,
        mqtt_cloud_connected: state.mqtt.is_cloud_connected().await,
        auth_session_id: settings.auth_session_id,
        auth_status: settings.auth_status,
        auth_code: settings.auth_code,
        auth_external_user_id: settings.auth_external_user_id,
        auth_display_name: settings.auth_display_name,
        auth_expires_at: settings.auth_expires_at,
    }))
}

async fn patch_settings(
    State(state): State<HttpAppState>,
    Json(body): Json<UpdateRuntimeSettingsRequest>,
) -> Result<Json<RuntimeSettingsResponse>, AppError> {
    let update_access_service_url = body.access_service_url.is_some();
    let access_service_url = normalize_opt(body.access_service_url);
    if let Some(ref url) = access_service_url {
        if !url.starts_with("http://") && !url.starts_with("https://") {
            return Err(DomainError::Validation(
                "accessServiceUrl must start with http:// or https://".into(),
            )
            .into());
        }
    }
    if update_access_service_url {
        state
            .runtime_settings
            .set_access_service_url(access_service_url.as_deref())
            .await?;
    }

    if body.mqtt_username.is_some() {
        state
            .runtime_settings
            .set_mqtt_username(normalize_opt(body.mqtt_username).as_deref())
            .await?;
    }

    if let Some(password) = body.mqtt_password {
        let trimmed = password.trim();
        if !trimmed.is_empty() {
            state
                .runtime_settings
                .set_mqtt_password(Some(trimmed))
                .await?;
        }
    }

    reconfigure_mqtt_from_settings(&state).await;

    get_settings(State(state)).await
}

async fn start_auth(
    State(state): State<HttpAppState>,
) -> Result<Json<StartAuthResponse>, AppError> {
    let settings = state.runtime_settings.load().await?;
    let access_service_url =
        resolve_access_service_url(settings.access_service_url, &state.default_access_service_url);
    let callback_url = state
        .public_base_url
        .as_ref()
        .map(|base| format!("{}/api/v1/system/auth/callback", base.trim_end_matches('/')));
    let started = state
        .cloud_auth
        .start_session(
            &access_service_url,
            callback_url.as_deref(),
            state.serial_number.as_deref(),
        )
        .await?;
    let expires_at = chrono::Utc::now()
        .checked_add_signed(chrono::Duration::seconds(started.expires_in as i64))
        .map(|d| d.to_rfc3339())
        .unwrap_or_else(|| chrono::Utc::now().to_rfc3339());

    state
        .runtime_settings
        .save_auth_session(
            &started.auth_session_id,
            "pending",
            None,
            None,
            None,
            Some(&expires_at),
        )
        .await?;

    Ok(Json(StartAuthResponse {
        auth_session_id: started.auth_session_id,
        user_code: started.user_code,
        verification_url: started.verification_url,
        expires_in: started.expires_in,
        poll_interval: started.poll_interval,
    }))
}

async fn auth_status(
    State(state): State<HttpAppState>,
) -> Result<Json<AuthStatusResponse>, AppError> {
    let settings = state.runtime_settings.load().await?;
    let session_id = settings
        .auth_session_id
        .ok_or_else(|| DomainError::Validation("No active auth session. Call /system/auth/start first".into()))?;

    // Once authorized, serve from SQLite — no need to poll the cloud on every call.
    // Cloud sessions are ephemeral (in-memory on access-service); the SQLite state
    // is the source of truth for long-lived device pairing.
    if settings.auth_status.as_deref() == Some("authorized") {
        return Ok(Json(AuthStatusResponse {
            auth_session_id: session_id,
            status: "authorized".to_string(),
            auth_code: settings.auth_code,
            external_user_id: settings.auth_external_user_id,
            display_name: settings.auth_display_name,
        }));
    }

    let access_service_url =
        resolve_access_service_url(settings.access_service_url, &state.default_access_service_url);
    let polled = state
        .cloud_auth
        .poll_session(&access_service_url, &session_id)
        .await?;

    let (status, auth_code) = match polled {
        AuthPollResult::Pending => ("pending".to_string(), None),
        AuthPollResult::Authorized {
            auth_code,
            external_user_id,
            display_name,
        } => {
            state
                .runtime_settings
                .save_auth_session(
                    &session_id,
                    "authorized",
                    Some(&auth_code),
                    external_user_id.as_deref(),
                    display_name.as_deref(),
                    settings.auth_expires_at.as_deref(),
                )
                .await?;
            reconfigure_mqtt_from_settings(&state).await;
            return Ok(Json(AuthStatusResponse {
                auth_session_id: session_id,
                status: "authorized".to_string(),
                auth_code: Some(auth_code),
                external_user_id,
                display_name,
            }));
        }
        AuthPollResult::Denied => ("denied".to_string(), None),
        AuthPollResult::Expired => ("expired".to_string(), None),
    };

    state
        .runtime_settings
        .save_auth_session(
            &session_id,
            &status,
            auth_code.as_deref(),
            settings.auth_external_user_id.as_deref(),
            settings.auth_display_name.as_deref(),
            settings.auth_expires_at.as_deref(),
        )
        .await?;

    Ok(Json(AuthStatusResponse {
        auth_session_id: session_id,
        status,
        auth_code,
        external_user_id: settings.auth_external_user_id,
        display_name: settings.auth_display_name,
    }))
}

async fn complete_auth(
    State(state): State<HttpAppState>,
    Json(body): Json<CompleteAuthRequest>,
) -> Result<Json<AuthStatusResponse>, AppError> {
    let settings = state.runtime_settings.load().await?;
    let session_id = settings
        .auth_session_id
        .ok_or_else(|| DomainError::Validation("No active auth session. Call /system/auth/start first".into()))?;
    let access_service_url =
        resolve_access_service_url(settings.access_service_url, &state.default_access_service_url);
    state
        .cloud_auth
        .complete_session(
            &access_service_url,
            CompleteAuthArgs {
                user_code: body.user_code,
                external_user_id: body.external_user_id.clone(),
                display_name: body.display_name.clone(),
            },
        )
        .await?;
    let external_user_id = body.external_user_id;
    let display_name = body.display_name;
    state
        .runtime_settings
        .save_auth_session(
            &session_id,
            "pending",
            settings.auth_code.as_deref(),
            Some(&external_user_id),
            display_name.as_deref(),
            settings.auth_expires_at.as_deref(),
        )
        .await?;

    Ok(Json(AuthStatusResponse {
        auth_session_id: session_id,
        status: "pending".to_string(),
        auth_code: settings.auth_code,
        external_user_id: Some(external_user_id),
        display_name,
    }))
}

async fn logout_auth(
    State(state): State<HttpAppState>,
) -> Result<Json<AuthStatusResponse>, AppError> {
    let settings = state.runtime_settings.load().await?;
    if let Some(session_id) = settings.auth_session_id.clone() {
        let access_service_url =
            resolve_access_service_url(settings.access_service_url, &state.default_access_service_url);
        if let Err(error) = state
            .cloud_auth
            .logout_session(&access_service_url, &session_id)
            .await
        {
            tracing::warn!(error = %error, "failed to revoke cloud auth session during logout");
        }
    }

    state.runtime_settings.clear_auth_session().await?;
    Ok(Json(AuthStatusResponse {
        auth_session_id: String::new(),
        status: "logged_out".to_string(),
        auth_code: None,
        external_user_id: None,
        display_name: None,
    }))
}

async fn auth_callback(
    State(state): State<HttpAppState>,
    Json(body): Json<AuthCallbackRequest>,
) -> Result<Json<AuthStatusResponse>, AppError> {
    state
        .runtime_settings
        .save_auth_session(
            &body.auth_session_id,
            &body.status,
            body.auth_code.as_deref(),
            body.external_user_id.as_deref(),
            body.display_name.as_deref(),
            body.expires_at.as_deref(),
        )
        .await?;
    Ok(Json(AuthStatusResponse {
        auth_session_id: body.auth_session_id,
        status: body.status,
        auth_code: body.auth_code,
        external_user_id: body.external_user_id,
        display_name: body.display_name,
    }))
}

#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ResetLocalDataResponse {
    pub ok: bool,
}

async fn reset_local_data_handler(
    State(state): State<HttpAppState>,
) -> Result<Json<ResetLocalDataResponse>, AppError> {
    state
        .health
        .reset_local_data()
        .await
        .map_err(|e| DomainError::Internal(e.to_string()))?;
    Ok(Json(ResetLocalDataResponse { ok: true }))
}

#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ProvisionMqttCredentialsResponse {
    pub username: String,
    pub password: String,
    pub mqtt_cloud_connected: bool,
}

async fn provision_mqtt_credentials_handler(
    State(state): State<HttpAppState>,
) -> Result<Json<ProvisionMqttCredentialsResponse>, AppError> {
    let settings = state.runtime_settings.load().await?;
    let user_id = settings.auth_external_user_id.ok_or_else(|| {
        DomainError::Validation(
            "Not authorized with cloud. Call /system/auth/start first.".into(),
        )
    })?;
    let runtime_access = settings.access_service_url.clone();
    let access_service_url =
        resolve_access_service_url(runtime_access.clone(), &state.default_access_service_url);
    let houses = state
        .cloud_sync
        .fetch_user_houses(&access_service_url, &user_id)
        .await?;
    let house_id = houses
        .first()
        .map(|h| h.id.as_str())
        .or_else(|| {
            state
                .configured_bridge_house_id
                .as_deref()
                .filter(|s| !s.is_empty())
        })
        .ok_or_else(|| {
            DomainError::Validation("No synced house found for MQTT provisioning.".into())
        })?;

    let scenario_service_url = resolve_scenario_service_url(
        runtime_access.as_deref(),
        &state.default_cloud_sync_url,
        &state.scenario_service_url,
    );
    let creds = state
        .cloud_scenario
        .provision_house_mqtt(&scenario_service_url, house_id)
        .await?;
    state
        .runtime_settings
        .set_mqtt_username(Some(&creds.username))
        .await?;
    state
        .runtime_settings
        .set_mqtt_password(Some(&creds.password))
        .await?;
    reconfigure_mqtt_from_settings(&state).await;

    Ok(Json(ProvisionMqttCredentialsResponse {
        username: creds.username,
        password: creds.password,
        mqtt_cloud_connected: state.mqtt.is_cloud_connected().await,
    }))
}