/**
 * Demo access seed: house with rooms/devices and guest/user roles.
 * Run: npm run seed:demo (from backend/apps/access-service)
 */
import { join } from 'path';
import { config as loadEnv } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { seedHouseGuestUserAccess, upsertExternalUser } from './lib/house-access-seed.lib';

loadEnv({ path: join(__dirname, '../../../.env') });

const url = process.env.ACCESS_CONTROL_DB_URL;
if (!url) throw new Error('ACCESS_CONTROL_DB_URL is not set');

const adapter = new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });

const ADMIN_EXTERNAL_ID = 'd4e5f6a7-b8c9-0123-defa-456789012345';
const GUEST_EXTERNAL_ID = process.env.DEMO_GUEST_KEYCLOAK_ID ?? 'a1111111-1111-4111-a111-111111111111';
const USER_EXTERNAL_ID = process.env.DEMO_USER_KEYCLOAK_ID ?? 'b2222222-2222-4222-b222-222222222222';
const DEMO_HOUSE_ID = 'c3333333-3333-4333-b333-333333333333';

async function main() {
  console.log('🌱 Seeding demo access (guest/user)...\n');

  const admin = await upsertExternalUser(prisma, ADMIN_EXTERNAL_ID, 'Admin User');

  let house = await prisma.house.findUnique({ where: { id: DEMO_HOUSE_ID } });
  if (!house) {
    house = await prisma.house.create({
      data: {
        id: DEMO_HOUSE_ID,
        name: 'Демо-дом',
        address: 'ул. Примерная, 1',
        ownerId: admin.id,
      },
    });
  } else {
    house = await prisma.house.update({
      where: { id: DEMO_HOUSE_ID },
      data: { ownerId: admin.id, name: 'Демо-дом' },
    });
  }

  await seedHouseGuestUserAccess(prisma, DEMO_HOUSE_ID, {
    guestExternalId: GUEST_EXTERNAL_ID,
    userExternalId: USER_EXTERNAL_ID,
    keepExistingOwner: false,
  });

  console.log('✅ Demo access seed complete');
  console.log(`   House id: ${house.id}`);
  console.log(`   Guest:    guest / guest — свет в коридоре (WRITE)`);
  console.log(`   User:     user / user — свет везде + target_temp (WRITE)`);
}

main()
  .catch((e) => {
    console.error('❌ Demo seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
