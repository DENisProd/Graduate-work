use async_trait::async_trait;
use local_server_core::{
    DomainError,
    entities::access::{
        AccessPolicy, AccessRight, AccessRightType, EffectivePermission, House, HouseInvitation,
        HouseMember, HouseRole, HouseRoom, Resource, ResourceType,
    },
};

pub struct CreateHouseCmd {
    pub name: String,
    pub avatar_url: Option<String>,
    pub plan_url: Option<String>,
    pub address: Option<String>,
    pub owner_external_user_id: String,
}

pub struct UpdateHouseCmd {
    pub name: Option<String>,
    pub avatar_url: Option<String>,
    pub plan_url: Option<String>,
    pub address: Option<String>,
    pub conflict_strategy: Option<String>,
}

pub struct AddMemberCmd {
    pub house_id: String,
    pub external_user_id: String,
}

pub struct CreateRoleCmd {
    pub name: String,
    pub priority: i32,
    pub house_id: String,
}

pub struct UpdateRoleCmd {
    pub name: Option<String>,
    pub priority: Option<i32>,
}

pub struct CreateRoomCmd {
    pub name: String,
    pub house_id: String,
    pub parent_id: Option<String>,
}

pub struct UpdateRoomCmd {
    pub name: Option<String>,
}

pub struct CreateResourceCmd {
    pub resource_type: ResourceType,
    pub name: Option<String>,
    pub external_id: Option<String>,
    pub house_id: String,
    pub parent_id: Option<String>,
}

pub struct CreateInvitationCmd {
    pub house_id: String,
    pub email: String,
    pub role_id: Option<String>,
    pub expires_in_hours: u32,
}

pub struct CreateAccessRightCmd {
    pub access_right_type: AccessRightType,
    pub resource_id: String,
    pub house_member_id: String,
    pub role_id: Option<String>,
    pub granted_by_external_id: Option<String>,
    pub expires_at: Option<String>,
}

pub struct CreatePolicyCmd {
    pub name: String,
    pub effect: String,
    pub subject_type: String,
    pub subject_id: Option<String>,
    pub condition: Option<serde_json::Value>,
    pub priority: i32,
    pub house_id: String,
    pub resource_id: Option<String>,
}

pub struct UpdatePolicyCmd {
    pub name: Option<String>,
    pub effect: Option<String>,
    pub condition: Option<serde_json::Value>,
    pub priority: Option<i32>,
}

#[async_trait]
pub trait AccessRepository: Send + Sync {
    async fn find_house(&self, id: &str) -> Result<Option<House>, DomainError>;
    async fn list_houses_for_user(&self, external_user_id: &str) -> Result<Vec<House>, DomainError>;
    async fn create_house(&self, cmd: CreateHouseCmd) -> Result<House, DomainError>;
    async fn update_house(&self, id: &str, cmd: UpdateHouseCmd) -> Result<House, DomainError>;
    async fn delete_house(&self, id: &str) -> Result<(), DomainError>;

    async fn find_member(&self, id: &str) -> Result<Option<HouseMember>, DomainError>;
    async fn find_member_by_user_in_house(
        &self,
        external_user_id: &str,
        house_id: &str,
    ) -> Result<Option<HouseMember>, DomainError>;
    async fn list_members(&self, house_id: &str) -> Result<Vec<HouseMember>, DomainError>;
    async fn add_member(&self, cmd: AddMemberCmd) -> Result<HouseMember, DomainError>;
    async fn remove_member(&self, id: &str) -> Result<(), DomainError>;

    async fn list_roles(&self, house_id: &str) -> Result<Vec<HouseRole>, DomainError>;
    async fn find_role(&self, id: &str) -> Result<Option<HouseRole>, DomainError>;
    async fn create_role(&self, cmd: CreateRoleCmd) -> Result<HouseRole, DomainError>;
    async fn update_role(&self, id: &str, cmd: UpdateRoleCmd) -> Result<HouseRole, DomainError>;
    async fn delete_role(&self, id: &str) -> Result<(), DomainError>;

    async fn assign_role(&self, member_id: &str, role_id: &str) -> Result<(), DomainError>;
    async fn unassign_role(&self, member_id: &str, role_id: &str) -> Result<(), DomainError>;
    async fn list_member_roles(&self, member_id: &str) -> Result<Vec<HouseRole>, DomainError>;

    async fn list_rooms(&self, house_id: &str) -> Result<Vec<HouseRoom>, DomainError>;
    async fn find_room(&self, id: &str) -> Result<Option<HouseRoom>, DomainError>;
    async fn create_room(&self, cmd: CreateRoomCmd) -> Result<HouseRoom, DomainError>;
    async fn update_room(&self, id: &str, cmd: UpdateRoomCmd) -> Result<HouseRoom, DomainError>;
    async fn delete_room(&self, id: &str) -> Result<(), DomainError>;

    async fn list_invitations(
        &self,
        house_id: &str,
    ) -> Result<Vec<HouseInvitation>, DomainError>;
    async fn create_invitation(
        &self,
        cmd: CreateInvitationCmd,
    ) -> Result<HouseInvitation, DomainError>;
    async fn delete_invitation(&self, id: &str) -> Result<(), DomainError>;

    async fn find_resource(&self, id: &str) -> Result<Option<Resource>, DomainError>;
    async fn list_resources(&self, house_id: &str) -> Result<Vec<Resource>, DomainError>;
    async fn create_resource(&self, cmd: CreateResourceCmd) -> Result<Resource, DomainError>;
    async fn delete_resource(&self, id: &str) -> Result<(), DomainError>;

    async fn list_rights_for_member(
        &self,
        member_id: &str,
    ) -> Result<Vec<AccessRight>, DomainError>;
    async fn create_right(&self, cmd: CreateAccessRightCmd) -> Result<AccessRight, DomainError>;
    async fn delete_right(&self, id: &str) -> Result<(), DomainError>;

    async fn list_policies(&self, house_id: &str) -> Result<Vec<AccessPolicy>, DomainError>;
    async fn find_policies_for_resource(
        &self,
        resource_id: &str,
    ) -> Result<Vec<AccessPolicy>, DomainError>;
    async fn create_policy(&self, cmd: CreatePolicyCmd) -> Result<AccessPolicy, DomainError>;
    async fn update_policy(
        &self,
        id: &str,
        cmd: UpdatePolicyCmd,
    ) -> Result<AccessPolicy, DomainError>;
    async fn delete_policy(&self, id: &str) -> Result<(), DomainError>;

    async fn check_effective(
        &self,
        member_id: &str,
        resource_id: &str,
    ) -> Result<Vec<EffectivePermission>, DomainError>;
    async fn rebuild_effective(&self, house_id: &str) -> Result<usize, DomainError>;
}