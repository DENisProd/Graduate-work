-- Cloud sync mapping for physical devices.
-- protocolAddress (IEEE addr) is the primary natural key for matching;
-- phys_device_cloud_id stores the MongoDB ObjectId from scenario-service.
ALTER TABLE physical_devices ADD COLUMN phys_device_cloud_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_phys_dev_cloud_id
  ON physical_devices(phys_device_cloud_id)
  WHERE phys_device_cloud_id IS NOT NULL;
