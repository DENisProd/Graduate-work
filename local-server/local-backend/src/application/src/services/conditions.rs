use std::cmp::Ordering;
use std::future::Future;
use std::pin::Pin;

use chrono::Timelike;
use local_server_core::{
    DomainError,
    entities::scenario::{CompareOp, Condition},
};

use super::exec_context::ExecContext;

pub fn eval_condition<'a>(
    cond: &'a Condition,
    ctx: &'a ExecContext,
) -> Pin<Box<dyn Future<Output = Result<bool, DomainError>> + Send + 'a>> {
    Box::pin(async move {
        match cond {
            Condition::Always => Ok(true),

            Condition::And { items } => {
                for item in items {
                    if !eval_condition(item, ctx).await? {
                        return Ok(false);
                    }
                }
                Ok(true)
            }

            Condition::Or { items } => {
                for item in items {
                    if eval_condition(item, ctx).await? {
                        return Ok(true);
                    }
                }
                Ok(false)
            }

            Condition::Not { item } => {
                let inner = eval_condition(item, ctx).await?;
                Ok(!inner)
            }

            Condition::DeviceState { device_id, path, op, value } => {
                let state = ctx.zigbee_repo.last_state(device_id).await?;
                match state {
                    Some(s) => Ok(compare_values(json_path_get(&s.payload, path), op, value)),
                    None => Ok(false),
                }
            }

            Condition::TimeWindow { from, to, timezone } => {
                Ok(in_time_window(from, to, timezone.as_deref()))
            }
        }
    })
}

fn json_path_get<'a>(value: &'a serde_json::Value, path: &str) -> Option<&'a serde_json::Value> {
    let mut current = value;
    for key in path.split('.') {
        match current {
            serde_json::Value::Object(map) => {
                current = map.get(key)?;
            }
            _ => return None,
        }
    }
    Some(current)
}

fn compare_values(
    actual: Option<&serde_json::Value>,
    op: &CompareOp,
    expected: &serde_json::Value,
) -> bool {
    let Some(actual) = actual else {
        return false;
    };
    match op {
        CompareOp::Eq => actual == expected,
        CompareOp::Ne => actual != expected,
        CompareOp::Gt => numeric_cmp(actual, expected)
            .map_or(false, |o| o == Ordering::Greater),
        CompareOp::Gte => numeric_cmp(actual, expected)
            .map_or(false, |o| o != Ordering::Less),
        CompareOp::Lt => numeric_cmp(actual, expected)
            .map_or(false, |o| o == Ordering::Less),
        CompareOp::Lte => numeric_cmp(actual, expected)
            .map_or(false, |o| o != Ordering::Greater),
    }
}

fn numeric_cmp(a: &serde_json::Value, b: &serde_json::Value) -> Option<Ordering> {
    a.as_f64()?.partial_cmp(&b.as_f64()?)
}

fn in_time_window(from: &str, to: &str, timezone: Option<&str>) -> bool {
    let parse_hhmm = |s: &str| -> Option<u32> {
        let mut it = s.splitn(2, ':');
        let h: u32 = it.next()?.parse().ok()?;
        let m: u32 = it.next()?.parse().ok()?;
        if h > 23 || m > 59 {
            return None;
        }
        Some(h * 60 + m)
    };

    let Some(from_mins) = parse_hhmm(from) else {
        return false;
    };
    let Some(to_mins) = parse_hhmm(to) else {
        return false;
    };

    let (cur_h, cur_m) = current_hm(timezone);
    let cur_mins = cur_h * 60 + cur_m;

    if from_mins <= to_mins {
        cur_mins >= from_mins && cur_mins < to_mins
    } else {
        // spans midnight
        cur_mins >= from_mins || cur_mins < to_mins
    }
}

fn current_hm(timezone: Option<&str>) -> (u32, u32) {
    let utc = chrono::Utc::now();

    if let Some(tz_str) = timezone {
        if let Ok(tz) = tz_str.parse::<chrono_tz::Tz>() {
            let local = utc.with_timezone(&tz);
            return (local.hour(), local.minute());
        }
    }
    (utc.hour(), utc.minute())
}

#[cfg(test)]
mod tests {
    use std::sync::Arc;

    use async_trait::async_trait;
    use chrono::Utc;
    use local_server_core::{
        DomainError,
        entities::{
            physical_device::PhysicalDevice,
            scenario::{CompareOp, Condition},
            zigbee::ZigbeeDeviceState,
        },
    };
    use uuid::Uuid;

    use crate::ports::{
        MqttClient, PhysicalDeviceRepository, ScenarioExecutionRepository, ZigbeeRepository,
    };
    use crate::ports::physical_device_repository::{
        CreatePhysicalDeviceCmd, PhysicalDeviceFilter, UpdatePhysicalDeviceCmd,
        UpsertFromBridgeCmd,
    };

    use super::*;

    struct StubZigbeeRepo {
        state: Option<ZigbeeDeviceState>,
    }

    #[async_trait]
    impl ZigbeeRepository for StubZigbeeRepo {
        async fn insert_state(&self, _state: &ZigbeeDeviceState) -> Result<(), DomainError> {
            Ok(())
        }

        async fn last_state(&self, _ieee: &str) -> Result<Option<ZigbeeDeviceState>, DomainError> {
            Ok(self.state.clone())
        }

        async fn list_states(&self, _ieee: &str, _limit: i64) -> Result<Vec<ZigbeeDeviceState>, DomainError> {
            Ok(vec![])
        }

        async fn list_states_filtered(
            &self,
            _ieee: Option<&str>,
            _limit: i64,
        ) -> Result<Vec<ZigbeeDeviceState>, DomainError> {
            Ok(vec![])
        }

        async fn list_logs(
            &self,
            _ieee: Option<&str>,
            _from: Option<&str>,
            _to: Option<&str>,
            _limit: i64,
        ) -> Result<Vec<serde_json::Value>, DomainError> {
            Ok(vec![])
        }
    }

    struct StubPhysicalDeviceRepo;

    #[async_trait]
    impl PhysicalDeviceRepository for StubPhysicalDeviceRepo {
        async fn find_all(
            &self,
            _filter: PhysicalDeviceFilter,
        ) -> Result<Vec<PhysicalDevice>, DomainError> {
            Ok(vec![])
        }

        async fn find_by_id(&self, _id: Uuid) -> Result<Option<PhysicalDevice>, DomainError> {
            Ok(None)
        }

        async fn find_by_ieee(&self, _ieee: &str) -> Result<Option<PhysicalDevice>, DomainError> {
            Ok(None)
        }

        async fn list_zigbee_devices(&self) -> Result<Vec<PhysicalDevice>, DomainError> {
            Ok(vec![])
        }

        async fn create(&self, _cmd: CreatePhysicalDeviceCmd) -> Result<PhysicalDevice, DomainError> {
            Err(DomainError::DependencyUnavailable("not used in tests".to_string()))
        }

        async fn update(
            &self,
            _id: Uuid,
            _cmd: UpdatePhysicalDeviceCmd,
        ) -> Result<PhysicalDevice, DomainError> {
            Err(DomainError::DependencyUnavailable("not used in tests".to_string()))
        }

        async fn delete(&self, _id: Uuid) -> Result<(), DomainError> {
            Ok(())
        }

        async fn delete_by_ieee(&self, _ieee: &str) -> Result<(), DomainError> {
            Ok(())
        }

        async fn upsert_by_ieee(
            &self,
            _cmd: UpsertFromBridgeCmd,
        ) -> Result<PhysicalDevice, DomainError> {
            Err(DomainError::DependencyUnavailable("not used in tests".to_string()))
        }

        async fn update_last_seen(&self, _ieee: &str) -> Result<(), DomainError> {
            Ok(())
        }

        async fn upsert_from_cloud(
            &self,
            _cloud_id: &str,
            _protocol_address: Option<&str>,
            _cmd: crate::ports::UpsertPhysDevFromCloudCmd,
        ) -> Result<PhysicalDevice, DomainError> {
            Err(DomainError::DependencyUnavailable("not used in tests".to_string()))
        }

        async fn list_without_cloud_id(&self) -> Result<Vec<PhysicalDevice>, DomainError> {
            Ok(vec![])
        }

        async fn set_phys_cloud_id(&self, _id: Uuid, _cloud_id: &str) -> Result<(), DomainError> {
            Ok(())
        }
    }

    struct StubExecRepo;

    #[async_trait]
    impl ScenarioExecutionRepository for StubExecRepo {
        async fn create_execution(
            &self,
            _exec: &local_server_core::entities::scenario::ScenarioExecution,
        ) -> Result<(), DomainError> {
            Ok(())
        }

        async fn complete_execution(
            &self,
            _id: &Uuid,
            _status: local_server_core::entities::scenario::ExecutionStatus,
            _error: Option<String>,
            _ended_at: chrono::DateTime<Utc>,
        ) -> Result<(), DomainError> {
            Ok(())
        }

        async fn find_execution_by_id(
            &self,
            _id: &Uuid,
        ) -> Result<Option<local_server_core::entities::scenario::ScenarioExecution>, DomainError> {
            Ok(None)
        }

        async fn list_executions(
            &self,
            _scenario_id: &Uuid,
            _limit: i64,
        ) -> Result<Vec<local_server_core::entities::scenario::ScenarioExecution>, DomainError> {
            Ok(vec![])
        }

        async fn list_all_executions(
            &self,
            _page: i64,
            _size: i64,
        ) -> Result<(Vec<local_server_core::entities::scenario::ScenarioExecution>, i64), DomainError> {
            Ok((vec![], 0))
        }
    }

    struct StubMqtt;

    #[async_trait]
    impl MqttClient for StubMqtt {
        async fn publish(&self, _topic: &str, _payload: &[u8]) -> Result<(), DomainError> {
            Ok(())
        }

        async fn is_connected(&self) -> bool {
            true
        }

        async fn current_url(&self) -> Option<String> {
            None
        }

        async fn reconfigure(
            &self,
            _config: Option<crate::ports::MqttConnectConfig>,
        ) -> Result<(), DomainError> {
            Ok(())
        }
    }

    fn ctx_with_payload(payload: serde_json::Value) -> ExecContext {
        ExecContext {
            mqtt: Some(Arc::new(StubMqtt)),
            zigbee_repo: Arc::new(StubZigbeeRepo {
                state: Some(ZigbeeDeviceState {
                    device_ieee_addr: "device-1".to_string(),
                    timestamp: Utc::now(),
                    payload,
                    state: None,
                    brightness: None,
                    linkquality: None,
                    color_mode: None,
                    occupancy: None,
                    temperature: None,
                    humidity: None,
                    battery: None,
                }),
            }),
            phys_repo: Arc::new(StubPhysicalDeviceRepo),
            exec_repo: Arc::new(StubExecRepo),
            mqtt_prefix: "zigbee2mqtt".to_string(),
        }
    }

    #[tokio::test]
    async fn device_state_condition_allows_command_when_threshold_is_reached() {
        let ctx = ctx_with_payload(serde_json::json!({
            "temperature": 24.7,
            "state": "ON"
        }));
        let condition = Condition::DeviceState {
            device_id: "device-1".to_string(),
            path: "temperature".to_string(),
            op: CompareOp::Gte,
            value: serde_json::json!(24.0),
        };

        let result = eval_condition(&condition, &ctx).await.unwrap();

        assert!(result);
    }

    #[tokio::test]
    async fn device_state_condition_returns_false_for_missing_attribute() {
        let ctx = ctx_with_payload(serde_json::json!({
            "humidity": 55
        }));
        let condition = Condition::DeviceState {
            device_id: "device-1".to_string(),
            path: "temperature".to_string(),
            op: CompareOp::Gt,
            value: serde_json::json!(20),
        };

        let result = eval_condition(&condition, &ctx).await.unwrap();

        assert!(!result);
    }

    #[tokio::test]
    async fn composite_conditions_support_and_not_logic_for_scenarios() {
        let ctx = ctx_with_payload(serde_json::json!({
            "state": "ON",
            "occupancy": false
        }));
        let condition = Condition::And {
            items: vec![
                Condition::DeviceState {
                    device_id: "device-1".to_string(),
                    path: "state".to_string(),
                    op: CompareOp::Eq,
                    value: serde_json::json!("ON"),
                },
                Condition::Not {
                    item: Box::new(Condition::DeviceState {
                        device_id: "device-1".to_string(),
                        path: "occupancy".to_string(),
                        op: CompareOp::Eq,
                        value: serde_json::json!(true),
                    }),
                },
            ],
        };

        let result = eval_condition(&condition, &ctx).await.unwrap();

        assert!(result);
    }
}
