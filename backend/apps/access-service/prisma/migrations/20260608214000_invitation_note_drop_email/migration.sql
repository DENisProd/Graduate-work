-- Add note to invitations and remove email.

ALTER TABLE "access_house_invitations"
ADD COLUMN "note" VARCHAR(255);

ALTER TABLE "access_house_invitations"
DROP COLUMN "email";

