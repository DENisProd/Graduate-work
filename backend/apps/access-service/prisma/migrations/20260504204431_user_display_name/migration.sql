/*
  Warnings:

  - You are about to drop the column `metadata` on the `access_resources` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "access_resources" DROP COLUMN "metadata";

-- AlterTable
ALTER TABLE "access_users" ADD COLUMN     "display_name" VARCHAR(255);
