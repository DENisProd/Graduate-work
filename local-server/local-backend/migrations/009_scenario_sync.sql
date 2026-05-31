-- Track the MongoDB ObjectId from scenario-service for each local scenario.
-- NULL means the scenario was created locally and has not been pushed to cloud yet.
ALTER TABLE scenarios ADD COLUMN scenario_cloud_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_scenarios_cloud_id
  ON scenarios(scenario_cloud_id)
  WHERE scenario_cloud_id IS NOT NULL;
