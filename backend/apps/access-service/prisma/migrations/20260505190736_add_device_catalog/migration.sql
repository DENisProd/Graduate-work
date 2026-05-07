-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('ONLINE', 'OFFLINE');

-- CreateEnum
CREATE TYPE "DeviceFunctionType" AS ENUM ('READ', 'WRITE', 'READ_WRITE');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('TOGGLE', 'COMMAND', 'VALUE');

-- CreateTable
CREATE TABLE "device_types" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_categories" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "device_type_id" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "is_moderated" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "device_category_id" INTEGER NOT NULL,
    "status" "DeviceStatus" NOT NULL DEFAULT 'OFFLINE',
    "serial_number" VARCHAR(100),
    "firmware_version" VARCHAR(50),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "is_moderated" BOOLEAN NOT NULL DEFAULT true,
    "last_seen_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_functions" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "device_id" INTEGER NOT NULL,
    "function_type" "DeviceFunctionType" NOT NULL,
    "current_value" TEXT,
    "min_value" DOUBLE PRECISION,
    "max_value" DOUBLE PRECISION,
    "unit" VARCHAR(50),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_functions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_function_actions" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "device_function_id" INTEGER NOT NULL,
    "action_type" "ActionType" NOT NULL,
    "payload_template" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_function_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_translations" (
    "id" SERIAL NOT NULL,
    "locale" VARCHAR(10) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "device_id" INTEGER NOT NULL,

    CONSTRAINT "device_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_category_translations" (
    "id" SERIAL NOT NULL,
    "locale" VARCHAR(10) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "device_category_id" INTEGER NOT NULL,

    CONSTRAINT "device_category_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_type_translations" (
    "id" SERIAL NOT NULL,
    "locale" VARCHAR(10) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "device_type_id" INTEGER NOT NULL,

    CONSTRAINT "device_type_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_function_translations" (
    "id" SERIAL NOT NULL,
    "locale" VARCHAR(10) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "device_function_id" INTEGER NOT NULL,

    CONSTRAINT "device_function_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_function_action_translations" (
    "id" SERIAL NOT NULL,
    "locale" VARCHAR(10) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "device_function_action_id" INTEGER NOT NULL,

    CONSTRAINT "device_function_action_translations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "device_types_code_key" ON "device_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "device_categories_code_key" ON "device_categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "devices_code_key" ON "devices"("code");

-- CreateIndex
CREATE UNIQUE INDEX "device_functions_device_id_code_key" ON "device_functions"("device_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "device_function_actions_device_function_id_code_key" ON "device_function_actions"("device_function_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "device_translations_device_id_locale_key" ON "device_translations"("device_id", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "device_category_translations_device_category_id_locale_key" ON "device_category_translations"("device_category_id", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "device_type_translations_device_type_id_locale_key" ON "device_type_translations"("device_type_id", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "device_function_translations_device_function_id_locale_key" ON "device_function_translations"("device_function_id", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "device_function_action_translations_device_function_action__key" ON "device_function_action_translations"("device_function_action_id", "locale");

-- AddForeignKey
ALTER TABLE "device_categories" ADD CONSTRAINT "device_categories_device_type_id_fkey" FOREIGN KEY ("device_type_id") REFERENCES "device_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_device_category_id_fkey" FOREIGN KEY ("device_category_id") REFERENCES "device_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_functions" ADD CONSTRAINT "device_functions_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_function_actions" ADD CONSTRAINT "device_function_actions_device_function_id_fkey" FOREIGN KEY ("device_function_id") REFERENCES "device_functions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_translations" ADD CONSTRAINT "device_translations_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_category_translations" ADD CONSTRAINT "device_category_translations_device_category_id_fkey" FOREIGN KEY ("device_category_id") REFERENCES "device_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_type_translations" ADD CONSTRAINT "device_type_translations_device_type_id_fkey" FOREIGN KEY ("device_type_id") REFERENCES "device_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_function_translations" ADD CONSTRAINT "device_function_translations_device_function_id_fkey" FOREIGN KEY ("device_function_id") REFERENCES "device_functions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_function_action_translations" ADD CONSTRAINT "device_function_action_translations_device_function_action_fkey" FOREIGN KEY ("device_function_action_id") REFERENCES "device_function_actions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
