use local_server_core::{DomainError, entities::scenario::ScenarioDefinition};

use super::{actions::exec_action, conditions::eval_condition, exec_context::ExecContext};

pub async fn execute_scenario(
    def: &ScenarioDefinition,
    ctx: &ExecContext,
) -> Result<(), DomainError> {
    let condition_met = eval_condition(&def.conditions, ctx)
        .await
        .unwrap_or(false);

    if !condition_met {
        tracing::debug!("scenario condition not met, skipping actions");
        return Ok(());
    }

    for action in &def.actions {
        exec_action(action, ctx).await?;
    }

    Ok(())
}
