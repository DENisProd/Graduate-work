use thiserror::Error;

/// Pure domain error. Infrastructure errors are translated to one of these
/// variants at the boundary (in `infrastructure` crate).
#[derive(Debug, Error)]
pub enum DomainError {
    #[error("entity not found: {entity} ({id})")]
    NotFound { entity: &'static str, id: String },

    #[error("validation failed: {0}")]
    Validation(String),

    #[error("conflict: {0}")]
    Conflict(String),

    #[error("forbidden: {0}")]
    Forbidden(String),

    #[error("dependency unavailable: {0}")]
    DependencyUnavailable(String),

    #[error("internal: {0}")]
    Internal(String),
}

impl DomainError {
    pub fn not_found(entity: &'static str, id: impl Into<String>) -> Self {
        Self::NotFound { entity, id: id.into() }
    }
}
