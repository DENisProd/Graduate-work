-- Track last successful push to cloud to avoid overwriting newer local edits.
ALTER TABLE widget_dashboards ADD COLUMN last_pushed_at TEXT;
