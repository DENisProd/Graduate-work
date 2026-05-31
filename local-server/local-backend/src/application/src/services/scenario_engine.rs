use std::sync::Arc;
use std::time::{Duration, Instant};

use dashmap::DashMap;
use tokio_cron_scheduler::{Job, JobScheduler};
use uuid::Uuid;

use local_server_core::{
    DomainError,
    entities::scenario::{
        ExecutionStatus, Scenario, ScenarioDefinition, ScenarioExecution, ScenarioStatus, Trigger,
        TriggerSource,
    },
};

use crate::ports::{
    MqttClient, PhysicalDeviceRepository, ScenarioExecutionRepository, ScenarioRepository,
    ZigbeeRepository,
};

use super::{exec_context::ExecContext, executor::execute_scenario, ZigbeeRealtimeService};

#[derive(Clone)]
pub struct ScenarioEngine {
    repo: Arc<dyn ScenarioRepository>,
    exec_repo: Arc<dyn ScenarioExecutionRepository>,
    mqtt: Option<Arc<dyn MqttClient>>,
    realtime: Arc<ZigbeeRealtimeService>,
    zigbee_repo: Arc<dyn ZigbeeRepository>,
    phys_repo: Arc<dyn PhysicalDeviceRepository>,
    scheduler: JobScheduler,
    /// token → scenario_id
    webhooks: Arc<DashMap<String, Uuid>>,
    /// scenario_id → last_run instant (debounce)
    debounce: Arc<DashMap<Uuid, Instant>>,
    /// scenario_id → scheduler job uuid
    cron_jobs: Arc<DashMap<Uuid, Uuid>>,
    /// in-memory cache of online scenarios
    scenarios: Arc<DashMap<Uuid, Scenario>>,
    mqtt_prefix: String,
}

impl ScenarioEngine {
    pub async fn new(
        repo: Arc<dyn ScenarioRepository>,
        exec_repo: Arc<dyn ScenarioExecutionRepository>,
        mqtt: Option<Arc<dyn MqttClient>>,
        realtime: Arc<ZigbeeRealtimeService>,
        zigbee_repo: Arc<dyn ZigbeeRepository>,
        phys_repo: Arc<dyn PhysicalDeviceRepository>,
        mqtt_prefix: String,
    ) -> Result<Self, DomainError> {
        let scheduler = JobScheduler::new()
            .await
            .map_err(|e| DomainError::Internal(format!("scheduler init: {e}")))?;
        scheduler
            .start()
            .await
            .map_err(|e| DomainError::Internal(format!("scheduler start: {e}")))?;

        Ok(Self {
            repo,
            exec_repo,
            mqtt,
            realtime,
            zigbee_repo,
            phys_repo,
            scheduler,
            webhooks: Arc::new(DashMap::new()),
            debounce: Arc::new(DashMap::new()),
            cron_jobs: Arc::new(DashMap::new()),
            scenarios: Arc::new(DashMap::new()),
            mqtt_prefix,
        })
    }

    /// Load all ONLINE scenarios from DB and start listening.
    pub async fn load_and_start(&self) -> Result<(), DomainError> {
        let online = self.repo.find_online().await?;
        let count = online.len();
        for scenario in online {
            if let Err(e) = self.register(scenario).await {
                tracing::warn!(error = %e, "failed to register scenario at startup");
            }
        }
        tracing::info!(count, "scenario engine loaded");
        self.spawn_device_event_listener();
        Ok(())
    }

    /// Register a scenario: cache it and activate its triggers.
    pub async fn register(&self, scenario: Scenario) -> Result<(), DomainError> {
        let def: ScenarioDefinition =
            serde_json::from_value(scenario.definition.clone()).map_err(|e| {
                DomainError::Internal(format!("invalid scenario definition: {e}"))
            })?;

        let id = scenario.id;
        self.scenarios.insert(id, scenario);

        for trigger in &def.triggers {
            if !trigger.is_enabled() {
                continue;
            }
            match trigger {
                Trigger::Schedule { cron, .. } => {
                    self.add_cron_job(id, cron).await?;
                }
                Trigger::Webhook { token, .. } => {
                    self.webhooks.insert(token.clone(), id);
                }
                _ => {}
            }
        }

        Ok(())
    }

    /// Deregister a scenario: remove cron jobs, webhook tokens, cache entry.
    pub async fn deregister(&self, id: &Uuid) -> Result<(), DomainError> {
        self.scenarios.remove(id);

        if let Some((_, job_id)) = self.cron_jobs.remove(id) {
            self.scheduler
                .remove(&job_id)
                .await
                .map_err(|e| DomainError::Internal(format!("remove cron job: {e}")))?;
        }

        self.webhooks.retain(|_, v| v != id);
        self.debounce.remove(id);
        Ok(())
    }

    /// Trigger a scenario manually by ID. Returns the execution record.
    pub async fn trigger_manual(
        &self,
        scenario_id: &Uuid,
    ) -> Result<ScenarioExecution, DomainError> {
        let scenario = self
            .repo
            .find_by_id(scenario_id)
            .await?
            .ok_or_else(|| DomainError::not_found("scenario", scenario_id.to_string()))?;
        self.run_scenario(&scenario, TriggerSource::Manual, None).await
    }

    /// Trigger a scenario via its webhook token.
    pub async fn trigger_by_webhook(&self, token: &str) -> Result<(), DomainError> {
        let scenario_id = self
            .webhooks
            .get(token)
            .map(|e| *e.value())
            .ok_or_else(|| DomainError::not_found("webhook_token", token))?;

        let scenario = self
            .repo
            .find_by_id(&scenario_id)
            .await?
            .ok_or_else(|| DomainError::not_found("scenario", scenario_id.to_string()))?;

        self.run_scenario(&scenario, TriggerSource::Api, None).await?;
        Ok(())
    }

    // ─── Internal helpers ─────────────────────────────────────────────────────

    async fn run_scenario(
        &self,
        scenario: &Scenario,
        triggered_by: TriggerSource,
        trigger_data: Option<serde_json::Value>,
    ) -> Result<ScenarioExecution, DomainError> {
        // Debounce check
        if let Ok(def) =
            serde_json::from_value::<ScenarioDefinition>(scenario.definition.clone())
        {
            if let Some(opts) = &def.options {
                if let Some(debounce_ms) = opts.debounce_ms {
                    if let Some(last) = self.debounce.get(&scenario.id) {
                        if last.elapsed() < Duration::from_millis(debounce_ms) {
                            tracing::debug!(
                                scenario_id = %scenario.id,
                                "debounced scenario execution"
                            );
                            let exec = self
                                .persist_execution(
                                    scenario.id,
                                    triggered_by,
                                    trigger_data,
                                    ExecutionStatus::Failure,
                                    Some("debounced".to_string()),
                                )
                                .await?;
                            return Ok(exec);
                        }
                    }
                    self.debounce.insert(scenario.id, Instant::now());
                }
            }
        }

        let exec_id = Uuid::new_v4();
        let started_at = chrono::Utc::now();
        let initial = ScenarioExecution {
            id: exec_id,
            scenario_id: scenario.id,
            status: ExecutionStatus::Running,
            triggered_by,
            trigger_data: trigger_data.clone(),
            error_message: None,
            started_at,
            ended_at: None,
        };
        self.exec_repo.create_execution(&initial).await?;

        let ctx = self.make_ctx();

        let def = match serde_json::from_value::<ScenarioDefinition>(scenario.definition.clone()) {
            Ok(d) => d,
            Err(e) => {
                let msg = format!("invalid definition: {e}");
                let ended_at = chrono::Utc::now();
                self.exec_repo
                    .complete_execution(&exec_id, ExecutionStatus::Failure, Some(msg.clone()), ended_at)
                    .await?;
                return Ok(ScenarioExecution {
                    status: ExecutionStatus::Failure,
                    error_message: Some(msg),
                    ended_at: Some(ended_at),
                    ..initial
                });
            }
        };

        let (status, error) = match execute_scenario(&def, &ctx).await {
            Ok(()) => (ExecutionStatus::Success, None),
            Err(e) => (ExecutionStatus::Failure, Some(e.to_string())),
        };

        let ended_at = chrono::Utc::now();
        self.exec_repo
            .complete_execution(&exec_id, status, error.clone(), ended_at)
            .await?;

        Ok(ScenarioExecution { status, error_message: error, ended_at: Some(ended_at), ..initial })
    }

    async fn persist_execution(
        &self,
        scenario_id: Uuid,
        triggered_by: TriggerSource,
        trigger_data: Option<serde_json::Value>,
        status: ExecutionStatus,
        error_message: Option<String>,
    ) -> Result<ScenarioExecution, DomainError> {
        let now = chrono::Utc::now();
        let exec = ScenarioExecution {
            id: Uuid::new_v4(),
            scenario_id,
            status,
            triggered_by,
            trigger_data,
            error_message,
            started_at: now,
            ended_at: Some(now),
        };
        self.exec_repo.create_execution(&exec).await?;
        Ok(exec)
    }

    async fn add_cron_job(&self, scenario_id: Uuid, cron: &str) -> Result<(), DomainError> {
        let engine = self.clone();
        let cron_owned = cron.to_string();

        let job = Job::new_async(cron_owned.as_str(), move |_uuid, _l| {
            let engine = engine.clone();
            Box::pin(async move {
                if let Some(entry) = engine.scenarios.get(&scenario_id) {
                    let scenario = entry.clone();
                    drop(entry);
                    if let Err(e) =
                        engine.run_scenario(&scenario, TriggerSource::Schedule, None).await
                    {
                        tracing::error!(
                            scenario_id = %scenario_id,
                            error = %e,
                            "cron scenario failed"
                        );
                    }
                }
            })
        })
        .map_err(|e| DomainError::Internal(format!("invalid cron expression: {e}")))?;

        let job_id = self
            .scheduler
            .add(job)
            .await
            .map_err(|e| DomainError::Internal(format!("add cron job: {e}")))?;

        self.cron_jobs.insert(scenario_id, job_id);
        Ok(())
    }

    fn spawn_device_event_listener(&self) {
        let engine = self.clone();
        let mut rx = self.realtime.subscribe_state();
        tokio::spawn(async move {
            while let Ok(event) = rx.recv().await {
                engine.on_device_event(event).await;
            }
        });
    }

    async fn on_device_event(
        &self,
        event: local_server_core::entities::zigbee::ZigbeeDeviceState,
    ) {
        let matching: Vec<Scenario> = self
            .scenarios
            .iter()
            .filter_map(|entry| {
                let s = entry.value();
                if s.status != ScenarioStatus::Online {
                    return None;
                }
                let def: ScenarioDefinition =
                    serde_json::from_value(s.definition.clone()).ok()?;
                for trigger in &def.triggers {
                    if let Trigger::DeviceEvent { device_id, enabled, .. } = trigger {
                        if *enabled && device_id == &event.device_ieee_addr {
                            return Some(s.clone());
                        }
                    }
                }
                None
            })
            .collect();

        if matching.is_empty() {
            return;
        }

        let trigger_data = Some(serde_json::json!({
            "device_id": event.device_ieee_addr,
            "payload": event.payload,
        }));

        for scenario in matching {
            if let Err(e) = self
                .run_scenario(&scenario, TriggerSource::Automatic, trigger_data.clone())
                .await
            {
                tracing::error!(
                    scenario_id = %scenario.id,
                    error = %e,
                    "device_event scenario failed"
                );
            }
        }
    }

    fn make_ctx(&self) -> ExecContext {
        ExecContext {
            mqtt: self.mqtt.clone(),
            zigbee_repo: self.zigbee_repo.clone(),
            phys_repo: self.phys_repo.clone(),
            exec_repo: self.exec_repo.clone(),
            mqtt_prefix: self.mqtt_prefix.clone(),
        }
    }
}
