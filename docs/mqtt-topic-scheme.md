# MQTT Topic Scheme

## Overview

This document defines the canonical MQTT topic structure for the IntelliGuard smart-home platform.
All services MUST import topic constants/helpers from the designated module instead of hard-coding strings.

| Component | Module |
|---|---|
| Rust (local-server) | `local_server_core::mqtt_topics` |
| TypeScript (backend) | `backend/apps/scenario-service/src/zigbee/mqtt-topics.ts` |

---

## Topic Table

| Topic pattern | Direction | QoS | Retained | Description |
|---|---|---|---|---|
| `houses/{houseId}/zigbee2mqtt/#` | local-server → central MQTT | 1 | No | All Zigbee2MQTT telemetry forwarded from the house |
| `houses/{houseId}/status` | local-server → central MQTT | 1 | **Yes** | House online/offline status (LWT) |
| `houses/{houseId}/cmd/zigbee2mqtt/{device}/set` | scenario-service → central MQTT | 1 | No | Device command (e.g. turn on/off, set brightness) |
| `houses/{houseId}/cmd/zigbee2mqtt/bridge/request/{action}` | scenario-service → central MQTT | 1 | No | Zigbee2MQTT bridge request (permit_join, devices list, etc.) |

---

## Segment Definitions

| Segment | Description |
|---|---|
| `houses` | Fixed root prefix for all house-scoped topics |
| `{houseId}` | UUID of the house (e.g. `a1b2c3d4-...`) |
| `zigbee2mqtt` | Zigbee2MQTT namespace separator |
| `status` | House connectivity status |
| `cmd` | Command direction indicator (central → house) |
| `{device}` | Friendly name or IEEE address of the Zigbee device |
| `{action}` | Bridge action (e.g. `devices`, `permit_join`, `device/remove`) |

---

## QoS and Retained Policy

- **QoS 1** is used for all topics to guarantee at-least-once delivery across the WAN link between house and cloud.
- **Retained = Yes** on `houses/{houseId}/status` ensures that a subscriber connecting after the last status publish still receives the last known online/offline state.
- Command topics are never retained — stale commands must not be re-executed on reconnect.

---

## Authorisation Rules (EMQX)

| Client | Publish allowed | Subscribe allowed |
|---|---|---|
| local-server | `houses/{houseId}/zigbee2mqtt/#`, `houses/{houseId}/status` | `houses/{houseId}/cmd/#` |
| scenario-service | `houses/+/cmd/zigbee2mqtt/#` | `houses/+/zigbee2mqtt/#`, `houses/+/status` |

Anonymous connections are **denied**. Configure credentials in `infrastructure/emqx/credentials.env`.
