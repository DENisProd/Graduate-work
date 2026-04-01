-- AlterTable
ALTER TABLE "access_houses" ADD COLUMN "owner_id" TEXT;

-- AddForeignKey
ALTER TABLE "access_houses" ADD CONSTRAINT "access_houses_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "access_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
