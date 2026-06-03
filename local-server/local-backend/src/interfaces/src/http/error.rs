use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use local_server_application::DomainError;
use serde::Serialize;

#[derive(Debug)]
pub enum AppError {
    Domain(DomainError),
}

impl From<DomainError> for AppError {
    fn from(e: DomainError) -> Self {
        AppError::Domain(e)
    }
}

#[derive(Serialize)]
struct ErrorBody {
    message: String,
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            AppError::Domain(DomainError::NotFound { entity, id }) => {
                (StatusCode::NOT_FOUND, format!("{entity} '{id}' not found"))
            }
            AppError::Domain(DomainError::Validation(msg)) => (StatusCode::BAD_REQUEST, msg),
            AppError::Domain(DomainError::Conflict(msg)) => (StatusCode::CONFLICT, msg),
            AppError::Domain(DomainError::Forbidden(msg)) => (StatusCode::FORBIDDEN, msg),
            AppError::Domain(DomainError::DependencyUnavailable(msg)) => {
                (StatusCode::SERVICE_UNAVAILABLE, msg)
            }
            AppError::Domain(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
        };
        (status, Json(ErrorBody { message })).into_response()
    }
}