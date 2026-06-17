-- Widget dashboards (mirrors scenario-service WidgetDashboard collection).
-- layouts and widgets are stored as JSON text.
CREATE TABLE IF NOT EXISTS widget_dashboards (
  id          TEXT PRIMARY KEY,
  house_id    TEXT NOT NULL,
  user_id     TEXT NOT NULL,
  name        TEXT NOT NULL,
  is_default  INTEGER NOT NULL DEFAULT 0,
  layouts     TEXT NOT NULL DEFAULT '{}',
  widgets     TEXT NOT NULL DEFAULT '[]',
  cloud_id    TEXT,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_widget_dash_house
  ON widget_dashboards(house_id, user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_widget_dash_house_unique
  ON widget_dashboards(house_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_widget_dash_cloud_id
  ON widget_dashboards(cloud_id)
  WHERE cloud_id IS NOT NULL;
