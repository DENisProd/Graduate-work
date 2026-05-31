use std::sync::Arc;

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    routing::{delete, get},
    Json, Router,
};
use local_server_application::ports::{
    access_repository::{CreateResourceCmd, CreateRoomCmd, UpdateRoomCmd},
    AccessRepository,
};
use local_server_core::entities::access::{HouseRoom, Resource, ResourceType};
use serde::{Deserialize, Serialize};

use crate::http::error::AppError;

#[derive(Clone)]
struct ResourceState {
    repo: Arc<dyn AccessRepository>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ResourceResponse {
    pub id: String,
    pub r#type: String,
    pub name: Option<String>,
    pub external_id: Option<String>,
    pub path: String,
    pub depth: i32,
    pub house_id: String,
    pub parent_id: Option<String>,
}

impl From<Resource> for ResourceResponse {
    fn from(r: Resource) -> Self {
        Self {
            id: r.id,
            r#type: r.r#type.as_str().to_owned(),
            name: r.name,
            external_id: r.external_id,
            path: r.path,
            depth: r.depth,
            house_id: r.house_id,
            parent_id: r.parent_id,
        }
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RoomResponse {
    pub id: String,
    pub name: String,
    pub house_id: String,
}

impl From<HouseRoom> for RoomResponse {
    fn from(r: HouseRoom) -> Self {
        Self { id: r.id, name: r.name, house_id: r.house_id }
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListResourcesQuery {
    pub house_id: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateResourceBody {
    pub resource_type: String,
    pub name: Option<String>,
    pub external_id: Option<String>,
    pub house_id: String,
    pub parent_id: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateRoomBody {
    pub name: String,
    pub parent_id: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateRoomBody {
    pub name: Option<String>,
}

pub fn router(repo: Arc<dyn AccessRepository>) -> Router {
    let state = ResourceState { repo };
    Router::new()
        .route("/resources", get(list_resources).post(create_resource))
        .route("/resources/:id", delete(delete_resource))
        .route(
            "/houses/:house_id/rooms",
            get(list_rooms).post(create_room),
        )
        .route(
            "/house-rooms/:id",
            get(get_room).put(update_room).delete(delete_room),
        )
        .with_state(state)
}

async fn list_resources(
    State(s): State<ResourceState>,
    Query(q): Query<ListResourcesQuery>,
) -> Result<Json<Vec<ResourceResponse>>, AppError> {
    let house_id = q.house_id.unwrap_or_default();
    let items = s.repo.list_resources(&house_id).await?;
    Ok(Json(items.into_iter().map(ResourceResponse::from).collect()))
}

async fn create_resource(
    State(s): State<ResourceState>,
    Json(body): Json<CreateResourceBody>,
) -> Result<(StatusCode, Json<ResourceResponse>), AppError> {
    use std::str::FromStr;
    let rt = ResourceType::from_str(&body.resource_type)
        .map_err(|_| local_server_application::DomainError::Validation(
            format!("unknown resource type: {}", body.resource_type),
        ))?;
    let res = s
        .repo
        .create_resource(CreateResourceCmd {
            resource_type: rt,
            name: body.name,
            external_id: body.external_id,
            house_id: body.house_id,
            parent_id: body.parent_id,
        })
        .await?;
    Ok((StatusCode::CREATED, Json(ResourceResponse::from(res))))
}

async fn delete_resource(
    State(s): State<ResourceState>,
    Path(id): Path<String>,
) -> Result<StatusCode, AppError> {
    s.repo.delete_resource(&id).await?;
    Ok(StatusCode::NO_CONTENT)
}

async fn list_rooms(
    State(s): State<ResourceState>,
    Path(house_id): Path<String>,
) -> Result<Json<Vec<RoomResponse>>, AppError> {
    let rooms = s.repo.list_rooms(&house_id).await?;
    Ok(Json(rooms.into_iter().map(RoomResponse::from).collect()))
}

async fn get_room(
    State(s): State<ResourceState>,
    Path(id): Path<String>,
) -> Result<Json<RoomResponse>, AppError> {
    let room = s
        .repo
        .find_room(&id)
        .await?
        .ok_or_else(|| local_server_application::DomainError::not_found("room", &id))?;
    Ok(Json(RoomResponse::from(room)))
}

async fn create_room(
    State(s): State<ResourceState>,
    Path(house_id): Path<String>,
    Json(body): Json<CreateRoomBody>,
) -> Result<(StatusCode, Json<RoomResponse>), AppError> {
    let room = s
        .repo
        .create_room(CreateRoomCmd {
            name: body.name,
            house_id,
            parent_id: body.parent_id,
        })
        .await?;
    Ok((StatusCode::CREATED, Json(RoomResponse::from(room))))
}

async fn update_room(
    State(s): State<ResourceState>,
    Path(id): Path<String>,
    Json(body): Json<UpdateRoomBody>,
) -> Result<Json<RoomResponse>, AppError> {
    let room = s
        .repo
        .update_room(&id, UpdateRoomCmd { name: body.name })
        .await?;
    Ok(Json(RoomResponse::from(room)))
}

async fn delete_room(
    State(s): State<ResourceState>,
    Path(id): Path<String>,
) -> Result<StatusCode, AppError> {
    s.repo.delete_room(&id).await?;
    Ok(StatusCode::NO_CONTENT)
}
