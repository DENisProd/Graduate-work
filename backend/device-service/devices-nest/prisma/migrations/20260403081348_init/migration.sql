-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('ONLINE', 'OFFLINE');

-- CreateEnum
CREATE TYPE "DeviceFunctionType" AS ENUM ('READ', 'WRITE', 'READ_WRITE');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('TOGGLE', 'COMMAND', 'VALUE');

-- CreateTable
CREATE TABLE "DeviceType" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceCategory" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "deviceTypeId" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "deviceCategoryId" INTEGER NOT NULL,
    "status" "DeviceStatus" NOT NULL DEFAULT 'OFFLINE',
    "serialNumber" VARCHAR(100),
    "firmwareVersion" VARCHAR(50),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceFunction" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "deviceId" INTEGER NOT NULL,
    "functionType" "DeviceFunctionType" NOT NULL,
    "currentValue" TEXT,
    "minValue" DOUBLE PRECISION,
    "maxValue" DOUBLE PRECISION,
    "unit" VARCHAR(50),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceFunction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceFunctionAction" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "deviceFunctionId" INTEGER NOT NULL,
    "actionType" "ActionType" NOT NULL,
    "payloadTemplate" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceFunctionAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceTranslation" (
    "id" SERIAL NOT NULL,
    "locale" VARCHAR(10) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "deviceId" INTEGER NOT NULL,

    CONSTRAINT "DeviceTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceCategoryTranslation" (
    "id" SERIAL NOT NULL,
    "locale" VARCHAR(10) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "deviceCategoryId" INTEGER NOT NULL,

    CONSTRAINT "DeviceCategoryTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceTypeTranslation" (
    "id" SERIAL NOT NULL,
    "locale" VARCHAR(10) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "deviceTypeId" INTEGER NOT NULL,

    CONSTRAINT "DeviceTypeTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceFunctionTranslation" (
    "id" SERIAL NOT NULL,
    "locale" VARCHAR(10) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "deviceFunctionId" INTEGER NOT NULL,

    CONSTRAINT "DeviceFunctionTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceFunctionActionTranslation" (
    "id" SERIAL NOT NULL,
    "locale" VARCHAR(10) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "deviceFunctionActionId" INTEGER NOT NULL,

    CONSTRAINT "DeviceFunctionActionTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeviceType_code_key" ON "DeviceType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceCategory_code_key" ON "DeviceCategory"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Device_code_key" ON "Device"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceFunction_deviceId_code_key" ON "DeviceFunction"("deviceId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceFunctionAction_deviceFunctionId_code_key" ON "DeviceFunctionAction"("deviceFunctionId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceTranslation_deviceId_locale_key" ON "DeviceTranslation"("deviceId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceCategoryTranslation_deviceCategoryId_locale_key" ON "DeviceCategoryTranslation"("deviceCategoryId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceTypeTranslation_deviceTypeId_locale_key" ON "DeviceTypeTranslation"("deviceTypeId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceFunctionTranslation_deviceFunctionId_locale_key" ON "DeviceFunctionTranslation"("deviceFunctionId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceFunctionActionTranslation_deviceFunctionActionId_loca_key" ON "DeviceFunctionActionTranslation"("deviceFunctionActionId", "locale");

-- AddForeignKey
ALTER TABLE "DeviceCategory" ADD CONSTRAINT "DeviceCategory_deviceTypeId_fkey" FOREIGN KEY ("deviceTypeId") REFERENCES "DeviceType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_deviceCategoryId_fkey" FOREIGN KEY ("deviceCategoryId") REFERENCES "DeviceCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceFunction" ADD CONSTRAINT "DeviceFunction_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceFunctionAction" ADD CONSTRAINT "DeviceFunctionAction_deviceFunctionId_fkey" FOREIGN KEY ("deviceFunctionId") REFERENCES "DeviceFunction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceTranslation" ADD CONSTRAINT "DeviceTranslation_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceCategoryTranslation" ADD CONSTRAINT "DeviceCategoryTranslation_deviceCategoryId_fkey" FOREIGN KEY ("deviceCategoryId") REFERENCES "DeviceCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceTypeTranslation" ADD CONSTRAINT "DeviceTypeTranslation_deviceTypeId_fkey" FOREIGN KEY ("deviceTypeId") REFERENCES "DeviceType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceFunctionTranslation" ADD CONSTRAINT "DeviceFunctionTranslation_deviceFunctionId_fkey" FOREIGN KEY ("deviceFunctionId") REFERENCES "DeviceFunction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceFunctionActionTranslation" ADD CONSTRAINT "DeviceFunctionActionTranslation_deviceFunctionActionId_fkey" FOREIGN KEY ("deviceFunctionActionId") REFERENCES "DeviceFunctionAction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
