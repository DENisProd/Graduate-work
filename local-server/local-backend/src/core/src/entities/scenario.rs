use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum ScenarioStatus {
    Online,
    Offline,
    Error,
}

impl ScenarioStatus {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Online => "ONLINE",
            Self::Offline => "OFFLINE",
            Self::Error => "ERROR",
        }
    }
}

impl std::str::FromStr for ScenarioStatus {
    type Err = ();
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "ONLINE" => Ok(Self::Online),
            "OFFLINE" => Ok(Self::Offline),
            "ERROR" => Ok(Self::Error),
            _ => Err(()),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum TriggerSource {
    Schedule,
    Manual,
    Automatic,
    Api,
}

impl TriggerSource {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Schedule => "SCHEDULE",
            Self::Manual => "MANUAL",
            Self::Automatic => "AUTOMATIC",
            Self::Api => "API",
        }
    }
}

impl std::str::FromStr for TriggerSource {
    type Err = ();
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "SCHEDULE" => Ok(Self::Schedule),
            "MANUAL" => Ok(Self::Manual),
            "AUTOMATIC" => Ok(Self::Automatic),
            "API" => Ok(Self::Api),
            _ => Err(()),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum ExecutionStatus {
    Running,
    Success,
    Failure,
}

impl ExecutionStatus {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Running => "RUNNING",
            Self::Success => "SUCCESS",
            Self::Failure => "FAILURE",
        }
    }
}

impl std::str::FromStr for ExecutionStatus {
    type Err = ();
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "RUNNING" => Ok(Self::Running),
            "SUCCESS" => Ok(Self::Success),
            "FAILURE" => Ok(Self::Failure),
            _ => Err(()),
        }
    }
}

pub type ScenarioDefinitionJson = serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Scenario {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub house_id: String,
    pub creator_id: String,
    pub definition: ScenarioDefinitionJson,
    pub status: ScenarioStatus,
    pub cloud_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScenarioExecution {
    pub id: Uuid,
    pub scenario_id: Uuid,
    pub status: ExecutionStatus,
    pub triggered_by: TriggerSource,
    pub trigger_data: Option<serde_json::Value>,
    pub error_message: Option<String>,
    pub started_at: DateTime<Utc>,
    pub ended_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScenarioDefinition {
    pub version: u8,
    pub scope: Option<Scope>,
    pub triggers: Vec<Trigger>,
    #[serde(default = "default_condition")]
    pub conditions: Condition,
    pub actions: Vec<Action>,
    pub options: Option<ScenarioOptions>,
}

fn default_condition() -> Condition {
    Condition::Always
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Scope {
    pub house_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum Trigger {
    Schedule {
        cron: String,
        timezone: Option<String>,
        #[serde(default = "bool_true")]
        enabled: bool,
    },
    Manual {
        #[serde(default = "bool_true")]
        enabled: bool,
    },
    DeviceEvent {
        device_id: String,
        event: String,
        payload: Option<serde_json::Value>,
        #[serde(default = "bool_true")]
        enabled: bool,
    },
    Webhook {
        token: String,
        #[serde(default = "bool_true")]
        enabled: bool,
    },
}

fn bool_true() -> bool {
    true
}

impl Trigger {
    pub fn is_enabled(&self) -> bool {
        match self {
            Trigger::Schedule { enabled, .. } => *enabled,
            Trigger::Manual { enabled } => *enabled,
            Trigger::DeviceEvent { enabled, .. } => *enabled,
            Trigger::Webhook { enabled, .. } => *enabled,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum Condition {
    Always,
    DeviceState {
        device_id: String,
        path: String,
        op: CompareOp,
        value: serde_json::Value,
    },
    TimeWindow {
        from: String,
        to: String,
        timezone: Option<String>,
    },
    And {
        items: Vec<Condition>,
    },
    Or {
        items: Vec<Condition>,
    },
    Not {
        item: Box<Condition>,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum CompareOp {
    Eq,
    Ne,
    Gt,
    Gte,
    Lt,
    Lte,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum Action {
    DeviceCommand {
        device_id: String,
        command: String,
        args: Option<serde_json::Value>,
    },
    Delay {
        ms: u64,
    },
    HttpRequest {
        method: HttpMethod,
        url: String,
        headers: Option<serde_json::Value>,
        body: Option<serde_json::Value>,
        timeout_ms: Option<u64>,
    },
    Notify {
        channel: NotifyChannel,
        title: Option<String>,
        message: String,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum HttpMethod {
    Get,
    Post,
    Put,
    Patch,
    Delete,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum NotifyChannel {
    Log,
    Push,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScenarioOptions {
    pub debounce_ms: Option<u64>,
}