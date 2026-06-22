/**
 * Seed guest/user roles, members, devices and access rights for a house.
 * Run: HOUSE_ID=... npx ts-node prisma/seed-house-access.ts
 */
import { join } from 'path';
import { config as loadEnv } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { seedHouseGuestUserAccess } from './lib/house-access-seed.lib';

loadEnv({ path: join(__dirname, '../../../.env') });

const url = process.env.ACCESS_CONTROL_DB_URL;
if (!url) throw new Error('ACCESS_CONTROL_DB_URL is not set');

const houseId = process.env.HOUSE_ID;
if (!houseId) throw new Error('HOUSE_ID env var is required');

const targetHouseId: string = houseId;

const guestExternalId =
  process.env.DEMO_GUEST_KEYCLOAK_ID ?? '5cd1f760-d965-49ea-b854-b015a9d2a07e';
const userExternalId =
  process.env.DEMO_USER_KEYCLOAK_ID ?? '7aec7530-9382-485c-9695-eedcd5fe3544';

const adapter = new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(`🌱 Seeding guest/user access for house ${targetHouseId}...\n`);

  const { house, guestRole, userRole } = await seedHouseGuestUserAccess(prisma, targetHouseId, {
    guestExternalId,
    userExternalId,
    keepExistingOwner: true,
  });

  console.log('✅ House access seed complete');
  console.log(`   House: ${house.name} (${house.id})`);
  console.log(`   Roles: ${guestRole.name}, ${userRole.name}`);
  console.log(`   Members: guest/guest, user/user`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
