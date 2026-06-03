use std::sync::Arc;

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    routing::get,
    Json, Router,
};
use local_server_application::ports::{
    access_repository::{CreateHouseCmd, UpdateHouseCmd},
    AccessRepository,
};
use local_server_core::entities::access::House;
use serde::{Deserialize, Serialize};

use crate::http::error::AppError;

#[derive(Clone)]
struct HouseState {
    repo: Arc<dyn AccessRepository>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HouseResponse {
    pub id: String,
    pub name: String,
    pub avatar_url: Option<String>,
    pub address: Option<String>,
    pub conflict_strategy: String,
    pub owner_id: String,
    pub created_at: String,
    pub updated_at: String,
}

impl From<House> for HouseResponse {
    fn from(h: House) -> Self {
        Self {
            id: h.id,
            name: h.name,
            avatar_url: h.avatar_url,
            address: h.address,
            conflict_strategy: h.conflict_strategy.as_str().to_owned(),
            owner_id: h.owner_id,
            created_at: h.created_at.to_rfc3339(),
            updated_at: h.updated_at.to_rfc3339(),
        }
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListHousesQuery {
    pub user_id: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateHouseBody {
    pub name: String,
    pub avatar_url: Option<String>,
    pub address: Option<String>,
    pub owner_external_user_id: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateHouseBody {
    pub name: Option<String>,
    pub avatar_url: Option<String>,
    pub address: Option<String>,
    pub conflict_strategy: Option<String>,
}

pub fn router(repo: Arc<dyn AccessRepository>) -> Router {
    let state = HouseState { repo };
    Router::new()
        .route("/houses", get(list_houses).post(create_house))
        .route(
            "/houses/:id",
            get(get_house).put(update_house).delete(delete_house),
        )
        .with_state(state)
}

async fn list_houses(
    State(s): State<HouseState>,
    Query(q): Query<ListHousesQuery>,
) -> Result<Json<Vec<HouseResponse>>, AppError> {
    let user_id = q.user_id.unwrap_or_default();
    let houses = s.repo.list_houses_for_user(&user_id).await?;
    Ok(Json(houses.into_iter().map(HouseResponse::from).collect()))
}

async fn get_house(
    State(s): State<HouseState>,
    Path(id): Path<String>,
) -> Result<Json<HouseResponse>, AppError> {
    let house = s
        .repo
        .find_house(&id)
        .await?
        .ok_or_else(|| local_server_application::DomainError::not_found("house", &id))?;
    Ok(Json(HouseResponse::from(house)))
}

async fn create_house(
    State(s): State<HouseState>,
    Json(body): Json<CreateHouseBody>,
) -> Result<(StatusCode, Json<HouseResponse>), AppError> {
    let house = s
        .repo
        .create_house(CreateHouseCmd {
            name: body.name,
            avatar_url: body.avatar_url,
            address: body.address,
            owner_external_user_id: body.owner_external_user_id,
        })
        .await?;
    Ok((StatusCode::CREATED, Json(HouseResponse::from(house))))
}

async fn update_house(
    State(s): State<HouseState>,
    Path(id): Path<String>,
    Json(body): Json<UpdateHouseBody>,
) -> Result<Json<HouseResponse>, AppError> {
    let house = s
        .repo
        .update_house(
            &id,
            UpdateHouseCmd {
                name: body.name,
                avatar_url: body.avatar_url,
                address: body.address,
                conflict_strategy: body.conflict_strategy,
            },
        )
        .await?;
    Ok(Json(HouseResponse::from(house)))
}

async fn delete_house(
    State(s): State<HouseState>,
    Path(id): Path<String>,
) -> Result<StatusCode, AppError> {
    s.repo.delete_house(&id).await?;
    Ok(StatusCode::NO_CONTENT)
}