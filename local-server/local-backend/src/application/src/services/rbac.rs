use local_server_core::entities::access::{AccessRightType, ConflictStrategy, EffectivePermission};

pub fn evaluate_rbac(
    perms: &[EffectivePermission],
    strategy: ConflictStrategy,
) -> (bool, Option<AccessRightType>, &'static str) {
    if perms.is_empty() {
        return (false, None, "no_rights");
    }

    let has_deny = perms.iter().any(|p| p.access_right_type == AccessRightType::Deny);
    let has_allow = perms.iter().any(|p| p.access_right_type.is_permissive());

    match strategy {
        ConflictStrategy::DenyOverrides => {
            if has_deny {
                (false, Some(AccessRightType::Deny), "rbac_deny_overrides")
            } else if has_allow {
                (true, Some(AccessRightType::Allow), "rbac_allow")
            } else {
                (false, None, "no_applicable_rights")
            }
        }
        ConflictStrategy::AllowOverrides => {
            if has_allow {
                (true, Some(AccessRightType::Allow), "rbac_allow_overrides")
            } else if has_deny {
                (false, Some(AccessRightType::Deny), "rbac_deny")
            } else {
                (false, None, "no_applicable_rights")
            }
        }
    }
}

pub fn merge_results(
    rbac: (bool, Option<AccessRightType>, &'static str),
    abac_effect: Option<&str>,
    strategy: ConflictStrategy,
) -> (bool, Option<AccessRightType>, String) {
    let (rbac_access, rbac_type, rbac_reason) = rbac;

    let abac_deny = abac_effect == Some("DENY");
    let abac_allow = abac_effect == Some("ALLOW");

    match strategy {
        ConflictStrategy::DenyOverrides => {
            if abac_deny {
                (false, Some(AccessRightType::Deny), "abac_deny".to_string())
            } else if !rbac_access && abac_allow {
                (true, Some(AccessRightType::Allow), "abac_allow".to_string())
            } else {
                (rbac_access, rbac_type, rbac_reason.to_string())
            }
        }
        ConflictStrategy::AllowOverrides => {
            if abac_allow {
                (true, Some(AccessRightType::Allow), "abac_allow".to_string())
            } else if !rbac_access && abac_deny {
                (false, Some(AccessRightType::Deny), "abac_deny".to_string())
            } else {
                (rbac_access, rbac_type, rbac_reason.to_string())
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use chrono::Utc;
    use local_server_core::entities::access::EffectivePermission;

    use super::*;

    fn perm(id: &str, right: AccessRightType) -> EffectivePermission {
        EffectivePermission {
            id: id.to_string(),
            access_right_type: right,
            source_type: "TEST".to_string(),
            source_id: id.to_string(),
            house_member_id: "member-1".to_string(),
            resource_id: "device-1".to_string(),
            expires_at: Some(Utc::now()),
        }
    }

    #[test]
    fn deny_overrides_blocks_device_control_when_allow_and_deny_conflict() {
        let perms = vec![
            perm("allow-device-control", AccessRightType::Allow),
            perm("deny-device-control", AccessRightType::Deny),
        ];

        let result = evaluate_rbac(&perms, ConflictStrategy::DenyOverrides);

        assert_eq!(
            result,
            (
                false,
                Some(AccessRightType::Deny),
                "rbac_deny_overrides",
            )
        );
    }

    #[test]
    fn allow_overrides_keeps_access_for_permitted_member() {
        let perms = vec![
            perm("deny-room", AccessRightType::Deny),
            perm("allow-device", AccessRightType::Allow),
        ];

        let result = evaluate_rbac(&perms, ConflictStrategy::AllowOverrides);

        assert_eq!(
            result,
            (
                true,
                Some(AccessRightType::Allow),
                "rbac_allow_overrides",
            )
        );
    }

    #[test]
    fn abac_deny_has_priority_over_rbac_allow_in_deny_overrides_mode() {
        let result = merge_results(
            (true, Some(AccessRightType::Allow), "rbac_allow"),
            Some("DENY"),
            ConflictStrategy::DenyOverrides,
        );

        assert_eq!(
            result,
            (
                false,
                Some(AccessRightType::Deny),
                "abac_deny".to_string(),
            )
        );
    }

    #[test]
    fn abac_allow_can_restore_access_for_observer_in_allow_overrides_mode() {
        let result = merge_results(
            (false, Some(AccessRightType::Deny), "rbac_deny"),
            Some("ALLOW"),
            ConflictStrategy::AllowOverrides,
        );

        assert_eq!(
            result,
            (
                true,
                Some(AccessRightType::Allow),
                "abac_allow".to_string(),
            )
        );
    }
}
