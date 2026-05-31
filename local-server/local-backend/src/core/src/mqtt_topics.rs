/// Canonical MQTT topic helpers for the IntelliGuard local-server.
///
/// All topic strings MUST be built through these functions — never hand-write
/// `"houses/..."` literals anywhere else in the codebase.
///
/// Topic scheme reference: `docs/mqtt-topic-scheme.md`

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

pub const HOUSE_PREFIX: &str = "houses";
pub const STATUS_SUFFIX: &str = "status";
pub const CMD_PREFIX: &str = "cmd";

// ---------------------------------------------------------------------------
// Builder functions
// ---------------------------------------------------------------------------

/// Returns the root prefix for a specific house.
///
/// # Example
/// ```
/// assert_eq!(local_server_core::mqtt_topics::house_prefix("h1"), "houses/h1");
/// ```
pub fn house_prefix(house_id: &str) -> String {
    format!("{}/{}", HOUSE_PREFIX, house_id)
}

/// Returns the telemetry topic pattern for an arbitrary Zigbee2MQTT suffix
/// (device friendly-name, bridge path, etc.).
///
/// # Example
/// ```
/// use local_server_core::mqtt_topics::telemetry_topic;
/// assert_eq!(
///     telemetry_topic("h1", "0x001788010d327fb4"),
///     "houses/h1/zigbee2mqtt/0x001788010d327fb4"
/// );
/// ```
pub fn telemetry_topic(house_id: &str, suffix: &str) -> String {
    format!("{}/zigbee2mqtt/{}", house_prefix(house_id), suffix)
}

/// Returns the wildcard subscription pattern that covers all Zigbee2MQTT
/// telemetry from a given house.
///
/// Subscribe with QoS 1 and retained = false.
pub fn telemetry_wildcard(house_id: &str) -> String {
    format!("{}/zigbee2mqtt/#", house_prefix(house_id))
}

/// Returns the retained status topic for a house.
///
/// Publish with QoS 1 and retained = true.
pub fn status_topic(house_id: &str) -> String {
    format!("{}/{}", house_prefix(house_id), STATUS_SUFFIX)
}

/// Returns a command topic under `houses/{houseId}/cmd/zigbee2mqtt/{suffix}`.
///
/// Used by the scenario-service (central) to send commands down to the
/// local Zigbee2MQTT instance.
pub fn cmd_topic(house_id: &str, suffix: &str) -> String {
    format!(
        "{}/{}/zigbee2mqtt/{}",
        house_prefix(house_id),
        CMD_PREFIX,
        suffix
    )
}

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

/// Extracts the house-id segment from any `houses/{houseId}/...` topic.
///
/// Returns `None` if the topic does not start with the expected prefix or if
/// the house-id segment is missing.
///
/// # Example
/// ```
/// use local_server_core::mqtt_topics::parse_house_id;
/// assert_eq!(
///     parse_house_id("houses/h1/zigbee2mqtt/bridge/event"),
///     Some("h1")
/// );
/// assert_eq!(parse_house_id("unrelated/topic"), None);
/// ```
pub fn parse_house_id(topic: &str) -> Option<&str> {
    let stripped = topic
        .strip_prefix(HOUSE_PREFIX)?
        .strip_prefix('/')?;
    let id = stripped.split('/').next()?;
    if id.is_empty() { None } else { Some(id) }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn house_prefix_format() {
        assert_eq!(house_prefix("abc-123"), "houses/abc-123");
    }

    #[test]
    fn telemetry_topic_format() {
        assert_eq!(
            telemetry_topic("h1", "0xaabbccdd"),
            "houses/h1/zigbee2mqtt/0xaabbccdd"
        );
    }

    #[test]
    fn telemetry_topic_bridge_path() {
        assert_eq!(
            telemetry_topic("h1", "bridge/event"),
            "houses/h1/zigbee2mqtt/bridge/event"
        );
    }

    #[test]
    fn telemetry_wildcard_format() {
        assert_eq!(
            telemetry_wildcard("h1"),
            "houses/h1/zigbee2mqtt/#"
        );
    }

    #[test]
    fn status_topic_format() {
        assert_eq!(status_topic("h1"), "houses/h1/status");
    }

    #[test]
    fn cmd_topic_device_set() {
        assert_eq!(
            cmd_topic("h1", "living-room-lamp/set"),
            "houses/h1/cmd/zigbee2mqtt/living-room-lamp/set"
        );
    }

    #[test]
    fn cmd_topic_bridge_request() {
        assert_eq!(
            cmd_topic("h1", "bridge/request/devices"),
            "houses/h1/cmd/zigbee2mqtt/bridge/request/devices"
        );
    }

    #[test]
    fn parse_house_id_valid() {
        assert_eq!(
            parse_house_id("houses/h1/zigbee2mqtt/bridge/event"),
            Some("h1")
        );
        assert_eq!(
            parse_house_id("houses/uuid-1234/status"),
            Some("uuid-1234")
        );
    }

    #[test]
    fn parse_house_id_invalid_prefix() {
        assert_eq!(parse_house_id("unrelated/topic"), None);
        assert_eq!(parse_house_id("houses"), None);
    }

    #[test]
    fn parse_house_id_empty_segment() {
        // "houses//status" — house-id is empty string, must return None
        assert_eq!(parse_house_id("houses//status"), None);
    }
}
