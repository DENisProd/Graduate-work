-- Add Zigbee-specific fields to physical_devices and an index for upsert by IEEE.

ALTER TABLE physical_devices ADD COLUMN interview_completed INTEGER NOT NULL DEFAULT 0;
ALTER TABLE physical_devices ADD COLUMN power_source TEXT;

CREATE INDEX IF NOT EXISTS idx_pd_protocol_addr
    ON physical_devices(protocol_address)
    WHERE protocol_address IS NOT NULL;
