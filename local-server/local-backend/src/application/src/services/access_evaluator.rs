use std::sync::Arc;
use std::time::Duration;

use local_server_core::{
    DomainError,
    entities::access::AccessCheckResult,
};

use crate::ports::AccessRepository;

use super::{
    abac::evaluate_policies,
    access_cache::AccessCache,
    rbac::{evaluate_rbac, merge_results},
};

#[derive(Clone)]
pub struct AccessEvaluator {
    repo: Arc<dyn AccessRepository>,
    cache: Arc<AccessCache>,
}

impl AccessEvaluator {
    pub fn new(repo: Arc<dyn AccessRepository>) -> Self {
        Self {
            repo,
            cache: Arc::new(AccessCache::new(Duration::from_secs(300))),
        }
    }

    pub async fn check(
        &self,
        external_user_id: &str,
        resource_id: &str,
    ) -> Result<AccessCheckResult, DomainError> {
        if let Some(cached) = self.cache.get(external_user_id, resource_id) {
            return Ok(cached);
        }

        let resource = self.repo.find_resource(resource_id).await?.ok_or_else(|| {
            DomainError::not_found("resource", resource_id)
        })?;

        let house = self.repo.find_house(&resource.house_id).await?.ok_or_else(|| {
            DomainError::not_found("house", &resource.house_id)
        })?;

        let strategy = house.conflict_strategy;

        let member = self
            .repo
            .find_member_by_user_in_house(external_user_id, &resource.house_id)
            .await?;

        let Some(member) = member else {
            let result = AccessCheckResult {
                has_access: false,
                effective_right_type: None,
                reason: "not_a_member".to_string(),
            };
            self.cache.set(external_user_id, resource_id, result.clone());
            return Ok(result);
        };

        let perms = self.repo.check_effective(&member.id, resource_id).await?;

        let rbac = if perms.is_empty() {
            let rights = self.repo.list_rights_for_member(&member.id).await?;
            let applicable: Vec<_> = rights
                .into_iter()
                .filter(|r| r.resource_id == resource_id)
                .map(|r| local_server_core::entities::access::EffectivePermission {
                    id: r.id.clone(),
                    access_right_type: r.access_right_type,
                    source_type: "DIRECT".to_string(),
                    source_id: r.id,
                    house_member_id: member.id.clone(),
                    resource_id: resource_id.to_string(),
                    expires_at: r.expires_at,
                })
                .collect();
            evaluate_rbac(&applicable, strategy)
        } else {
            evaluate_rbac(&perms, strategy)
        };

        let policies = self.repo.find_policies_for_resource(resource_id).await?;
        let abac_effect = evaluate_policies(&policies).map(|(e, _)| e);

        let (has_access, right_type, reason) = merge_results(rbac, abac_effect, strategy);

        let result = AccessCheckResult {
            has_access,
            effective_right_type: right_type.map(|r| r.as_str().to_owned()),
            reason,
        };

        self.cache.set(external_user_id, resource_id, result.clone());
        Ok(result)
    }

    pub fn invalidate_cache(&self) {
        self.cache.invalidate_all();
    }
}
