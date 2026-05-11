use chrono::{Local, NaiveTime};
use local_server_core::entities::access::AccessPolicy;
use serde_json::Value;

/// Evaluate a slice of ABAC policies and return the winning effect string
/// ("ALLOW" or "DENY"), or `None` if no policy applies.
pub fn evaluate_policies(policies: &[AccessPolicy]) -> Option<(&str, i32)> {
    let mut best: Option<(&str, i32)> = None;
    for policy in policies {
        let applies = match &policy.condition {
            None => true,
            Some(cond) => eval_condition(cond),
        };
        if !applies {
            continue;
        }
        let priority = policy.priority;
        match best {
            None => best = Some((policy.effect.as_str(), priority)),
            Some((_, bp)) if priority > bp => best = Some((policy.effect.as_str(), priority)),
            _ => {}
        }
    }
    best
}

fn eval_condition(cond: &Value) -> bool {
    match cond["type"].as_str() {
        Some("ALWAYS") | None => true,
        Some("AND") => {
            let items = match cond["items"].as_array() {
                Some(a) => a,
                None => return true,
            };
            items.iter().all(eval_condition)
        }
        Some("OR") => {
            let items = match cond["items"].as_array() {
                Some(a) => a,
                None => return false,
            };
            items.iter().any(eval_condition)
        }
        Some("NOT") => !eval_condition(&cond["item"]),
        Some("TIME_WINDOW") => {
            let from = cond["from"].as_str().unwrap_or("00:00");
            let to = cond["to"].as_str().unwrap_or("23:59");
            in_time_window(from, to)
        }
        _ => true,
    }
}

fn in_time_window(from: &str, to: &str) -> bool {
    let now = Local::now().time();
    let parse = |s: &str| -> Option<NaiveTime> {
        NaiveTime::parse_from_str(s, "%H:%M").ok()
    };
    let (Some(start), Some(end)) = (parse(from), parse(to)) else {
        return true;
    };
    if start <= end {
        now >= start && now <= end
    } else {
        now >= start || now <= end
    }
}
