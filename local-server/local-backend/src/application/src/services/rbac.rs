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