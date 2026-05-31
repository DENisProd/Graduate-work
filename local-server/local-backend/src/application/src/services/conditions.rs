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
