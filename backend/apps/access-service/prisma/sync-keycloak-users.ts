import { join } from 'path';
import { config as loadEnv } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

loadEnv({ path: join(__dirname, '../../../.env') });

const url = process.env.ACCESS_CONTROL_DB_URL;
if (!url) throw new Error('ACCESS_CONTROL_DB_URL is not set');

const guestKcId = process.env.GUEST_KC_ID;
const userKcId = process.env.USER_KC_ID;
if (!guestKcId || !userKcId) throw new Error('GUEST_KC_ID and USER_KC_ID env vars required');

const adapter = new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });

const pairs = [
  { username: 'guest', kcId: guestKcId, displayName: 'Guest User' },
  { username: 'user', kcId: userKcId, displayName: 'Demo User' },
];

async function main() {
  for (const p of pairs) {
    let user = await prisma.user.findFirst({
      where: { OR: [{ externalUserId: p.kcId }, { displayName: p.displayName }] },
    });
    if (!user) {
      user = await prisma.user.create({
        data: { externalUserId: p.kcId, displayName: p.displayName },
      });
      console.log(`   created access user ${p.username} ${p.kcId}`);
    } else if (user.externalUserId !== p.kcId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { externalUserId: p.kcId, displayName: p.displayName },
      });
      console.log(`   updated ${p.username} -> ${p.kcId}`);
    } else {
      console.log(`   ok ${p.username} ${p.kcId}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
