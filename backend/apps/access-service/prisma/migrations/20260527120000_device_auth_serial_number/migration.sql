-- AlterTable
ALTER TABLE "device_auth_sessions" ADD COLUMN "serial_number" TEXT;

-- CreateIndex
CREATE INDEX "device_auth_sessions_serial_number_idx" ON "device_auth_sessions"("serial_number");
