pub mod access_rights;
pub mod check;
pub mod houses;
pub mod invitations;
pub mod members;
pub mod policies;
pub mod resources;
pub mod roles;

use std::sync::Arc;

use axum::Router;
use local_server_application::{ports::AccessRepository, services::AccessEvaluator};

pub fn router(repo: Arc<dyn AccessRepository>, evaluator: Arc<AccessEvaluator>) -> Router {
    Router::new()
        .merge(houses::router(repo.clone()))
        .merge(members::router(repo.clone()))
        .merge(roles::router(repo.clone()))
        .merge(invitations::router(repo.clone()))
        .merge(resources::router(repo.clone()))
        .merge(access_rights::router(repo.clone()))
        .merge(policies::router(repo.clone()))
        .merge(check::router(repo, evaluator))
}
