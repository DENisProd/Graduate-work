-- AlterTable
ALTER TABLE "access_house_invitations" ADD COLUMN     "invited_permissions" "HousePermission"[] DEFAULT ARRAY[]::"HousePermission"[];
