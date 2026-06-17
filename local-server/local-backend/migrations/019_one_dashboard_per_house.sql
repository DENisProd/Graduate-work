-- Keep a single widget dashboard per house (local server model).
-- Prefer: is_default, then most widgets, then newest update.

DELETE FROM widget_dashboards
WHERE id NOT IN (
  SELECT id FROM (
    SELECT id,
      ROW_NUMBER() OVER (
        PARTITION BY house_id
        ORDER BY is_default DESC,
                 COALESCE(json_array_length(widgets), 0) DESC,
                 updated_at DESC
      ) AS rn
    FROM widget_dashboards
  )
  WHERE rn = 1
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_widget_dash_house_unique
  ON widget_dashboards(house_id);
