-- CreateEnum
CREATE TYPE "AccessRightType" AS ENUM ('ALLOW', 'DENY', 'READ', 'WRITE');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('HOUSE', 'ROOM', 'DEVICE', 'DEVICE_FUNCTION', 'SCENE', 'GROUP', 'AUTOMATION');

-- CreateEnum
CREATE TYPE "HousePermission" AS ENUM ('INVITE_MEMBERS', 'EDIT_ROLES', 'MANAGE_DEVICES', 'MANAGE_AUTOMATIONS');

-- CreateEnum
CREATE TYPE "PolicySubjectType" AS ENUM ('USER', 'ROLE', 'MEMBER', 'ANYONE');

-- CreateEnum
CREATE TYPE "PermissionSourceType" AS ENUM ('ROLE', 'DIRECT', 'POLICY');

-- CreateEnum
CREATE TYPE "ConflictResolutionStrategy" AS ENUM ('DENY_OVERRIDES', 'ALLOW_OVERRIDES', 'PRIORITY');

-- CreateTable
CREATE TABLE "access_users" (
    "id" TEXT NOT NULL,
    "external_user_id" TEXT NOT NULL,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_houses" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "avatar_url" TEXT,
    "address" VARCHAR(500),
    "conflictStrategy" "ConflictResolutionStrategy" NOT NULL DEFAULT 'DENY_OVERRIDES',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_houses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_house_members" (
    "id" TEXT NOT NULL,
    "house_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removed_at" TIMESTAMP(3),

    CONSTRAINT "access_house_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_house_roles" (
    "id" TEXT NOT NULL,
    "house_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "priority" INTEGER NOT NULL,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_house_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_house_member_roles" (
    "id" TEXT NOT NULL,
    "house_member_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_house_member_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_house_role_permissions" (
    "id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "permission" "HousePermission" NOT NULL,

    CONSTRAINT "access_house_role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_resources" (
    "id" TEXT NOT NULL,
    "house_id" TEXT NOT NULL,
    "type" "ResourceType" NOT NULL,
    "external_id" TEXT,
    "parent_id" TEXT,
    "path" VARCHAR(500) NOT NULL,
    "depth" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_rights" (
    "id" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "house_member_id" TEXT,
    "role_id" TEXT,
    "access_right_type" "AccessRightType" NOT NULL,
    "parameters" JSONB,
    "expires_at" TIMESTAMP(3),
    "granted_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_rights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_policies" (
    "id" TEXT NOT NULL,
    "house_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "effect" "AccessRightType" NOT NULL,
    "subjectType" "PolicySubjectType" NOT NULL,
    "subjectId" TEXT,
    "resourceId" TEXT,
    "condition" JSONB,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_effective_permissions" (
    "id" TEXT NOT NULL,
    "house_member_id" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "accessRightType" "AccessRightType" NOT NULL,
    "sourceType" "PermissionSourceType" NOT NULL,
    "sourceId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_effective_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_house_invitations" (
    "id" TEXT NOT NULL,
    "house_id" TEXT NOT NULL,
    "email" VARCHAR(255),
    "token_hash" TEXT NOT NULL,
    "role_id" TEXT,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "invited_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "access_house_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource_id" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "access_users_external_user_id_key" ON "access_users"("external_user_id");

-- CreateIndex
CREATE INDEX "access_house_members_user_id_idx" ON "access_house_members"("user_id");

-- CreateIndex
CREATE INDEX "access_house_members_house_id_idx" ON "access_house_members"("house_id");

-- CreateIndex
CREATE UNIQUE INDEX "access_house_members_house_id_user_id_key" ON "access_house_members"("house_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "access_house_roles_house_id_priority_key" ON "access_house_roles"("house_id", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "access_house_member_roles_house_member_id_role_id_key" ON "access_house_member_roles"("house_member_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "access_house_role_permissions_role_id_permission_key" ON "access_house_role_permissions"("role_id", "permission");

-- CreateIndex
CREATE INDEX "access_resources_house_id_idx" ON "access_resources"("house_id");

-- CreateIndex
CREATE INDEX "access_resources_parent_id_idx" ON "access_resources"("parent_id");

-- CreateIndex
CREATE INDEX "access_resources_path_idx" ON "access_resources"("path");

-- CreateIndex
CREATE INDEX "access_rights_resource_id_idx" ON "access_rights"("resource_id");

-- CreateIndex
CREATE INDEX "access_rights_house_member_id_idx" ON "access_rights"("house_member_id");

-- CreateIndex
CREATE INDEX "access_rights_role_id_idx" ON "access_rights"("role_id");

-- CreateIndex
CREATE INDEX "access_policies_house_id_idx" ON "access_policies"("house_id");

-- CreateIndex
CREATE INDEX "access_policies_resourceId_idx" ON "access_policies"("resourceId");

-- CreateIndex
CREATE INDEX "access_effective_permissions_house_member_id_idx" ON "access_effective_permissions"("house_member_id");

-- CreateIndex
CREATE INDEX "access_effective_permissions_resource_id_idx" ON "access_effective_permissions"("resource_id");

-- CreateIndex
CREATE UNIQUE INDEX "access_effective_permissions_house_member_id_resource_id_ac_key" ON "access_effective_permissions"("house_member_id", "resource_id", "accessRightType");

-- CreateIndex
CREATE UNIQUE INDEX "access_house_invitations_token_hash_key" ON "access_house_invitations"("token_hash");

-- CreateIndex
CREATE INDEX "access_house_invitations_house_id_idx" ON "access_house_invitations"("house_id");

-- CreateIndex
CREATE INDEX "access_audit_logs_actor_id_idx" ON "access_audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "access_audit_logs_resource_id_idx" ON "access_audit_logs"("resource_id");

-- AddForeignKey
ALTER TABLE "access_house_members" ADD CONSTRAINT "access_house_members_house_id_fkey" FOREIGN KEY ("house_id") REFERENCES "access_houses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_house_members" ADD CONSTRAINT "access_house_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "access_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_house_roles" ADD CONSTRAINT "access_house_roles_house_id_fkey" FOREIGN KEY ("house_id") REFERENCES "access_houses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_house_member_roles" ADD CONSTRAINT "access_house_member_roles_house_member_id_fkey" FOREIGN KEY ("house_member_id") REFERENCES "access_house_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_house_member_roles" ADD CONSTRAINT "access_house_member_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "access_house_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_house_role_permissions" ADD CONSTRAINT "access_house_role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "access_house_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_resources" ADD CONSTRAINT "access_resources_house_id_fkey" FOREIGN KEY ("house_id") REFERENCES "access_houses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_resources" ADD CONSTRAINT "access_resources_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "access_resources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_rights" ADD CONSTRAINT "access_rights_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "access_resources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_rights" ADD CONSTRAINT "access_rights_house_member_id_fkey" FOREIGN KEY ("house_member_id") REFERENCES "access_house_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_rights" ADD CONSTRAINT "access_rights_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "access_house_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_rights" ADD CONSTRAINT "access_rights_granted_by_id_fkey" FOREIGN KEY ("granted_by_id") REFERENCES "access_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_policies" ADD CONSTRAINT "access_policies_house_id_fkey" FOREIGN KEY ("house_id") REFERENCES "access_houses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_policies" ADD CONSTRAINT "access_policies_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "access_resources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_effective_permissions" ADD CONSTRAINT "access_effective_permissions_house_member_id_fkey" FOREIGN KEY ("house_member_id") REFERENCES "access_house_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_effective_permissions" ADD CONSTRAINT "access_effective_permissions_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "access_resources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_house_invitations" ADD CONSTRAINT "access_house_invitations_house_id_fkey" FOREIGN KEY ("house_id") REFERENCES "access_houses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_house_invitations" ADD CONSTRAINT "access_house_invitations_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "access_house_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_house_invitations" ADD CONSTRAINT "access_house_invitations_invited_by_id_fkey" FOREIGN KEY ("invited_by_id") REFERENCES "access_house_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
