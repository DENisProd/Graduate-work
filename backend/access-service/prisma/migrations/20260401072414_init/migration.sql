/*
  Warnings:

  - You are about to drop the column `createdAt` on the `access_policies` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "access_house_member_roles" DROP CONSTRAINT "access_house_member_roles_role_id_fkey";

-- AlterTable
ALTER TABLE "access_policies" DROP COLUMN "createdAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AddForeignKey
ALTER TABLE "access_house_member_roles" ADD CONSTRAINT "access_house_member_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "access_house_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
