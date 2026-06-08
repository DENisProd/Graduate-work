use std::sync::Arc;

use local_server_application::ports::RuntimeSettingsRepository;

pub async fn resolve_bearer_token(
    settings: Option<&Arc<dyn RuntimeSettingsRepository>>,
    api_key: &str,
) -> Option<String> {
    if let Some(repo) = settings {
        if let Ok(s) = repo.load().await {
            if let Some(code) = s.auth_code.filter(|c| !c.trim().is_empty()) {
                return Some(code);
            }
        }
    }
    if !api_key.trim().is_empty() {
        return Some(api_key.to_string());
    }
    None
}

pub fn apply_bearer(
    req: reqwest::RequestBuilder,
    token: Option<String>,
) -> reqwest::RequestBuilder {
    if let Some(t) = token {
        req.bearer_auth(t)
    } else {
        req
    }
}

pub fn scenario_api_url(base: &str, path: &str) -> String {
    format!("{}/v1{}", base.trim_end_matches('/'), path)
}
