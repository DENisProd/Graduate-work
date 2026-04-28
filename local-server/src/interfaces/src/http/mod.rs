use axum::Router;
use tower_http::trace::TraceLayer;

use crate::HttpAppState;

pub mod system;

/// Compose all HTTP sub-routers under the `/api/v1` prefix and apply
/// cross-cutting middleware (request tracing).
///
/// Future tasks (LS-002+) merge their own routers in here.
pub fn router(state: HttpAppState) -> Router {
    Router::new()
        .nest("/api/v1", Router::new().merge(system::router(state)))
        .layer(TraceLayer::new_for_http())
}
