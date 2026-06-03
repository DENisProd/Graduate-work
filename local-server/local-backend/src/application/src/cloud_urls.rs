pub fn scenario_url_from_access(access: &str) -> String {
    let base = access.trim().trim_end_matches('/');
    let origin = base
        .strip_suffix("/api/access")
        .unwrap_or(base)
        .trim_end_matches('/');
    format!("{origin}/api/scenario")
}

pub fn resolve_scenario_service_url(
    runtime_access: Option<&str>,
    cloud_sync_fallback: &str,
    scenario_fallback: &str,
) -> String {
    let access = runtime_access
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| cloud_sync_fallback.trim());
    if access.is_empty() {
        return scenario_fallback.trim().to_string();
    }
    scenario_url_from_access(access)
}
