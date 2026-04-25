-- AlterTable
ALTER TABLE "DeviceCategory" ADD COLUMN     "isModerated" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "isModerated" BOOLEAN NOT NULL DEFAULT true;
