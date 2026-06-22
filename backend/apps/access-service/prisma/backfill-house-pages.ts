/**
 * Backfill PAGE resources and default rights for all existing houses.
 * Run: npm run backfill:pages (from backend/apps/access-service)
 */
import { join } from 'path';
import { config as loadEnv } from 'dotenv';
import { AccessRightType, PrismaClient, ResourceType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  DEFAULT_READ_PAGE_SLUGS,
  HOUSE_PAGE_DEFINITIONS,
} from '../src/modules/house-roles/house-pages.constants';
import {
  SYSTEM_ROLE_NAMES,
  SYSTEM_ROLE_PRIORITIES,
  SYSTEM_ROLE_PERMISSIONS,
} from '../src/modules/house-roles/constants';

loadEnv({ path: join(__dirname, '../../../.env') });

const url = process.env.ACCESS_CONTROL_DB_URL;
if (!url) throw new Error('ACCESS_CONTROL_DB_URL is not set');

const adapter = new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });

async function ensureChildResource(
  parent: { id: string; path: string; depth: number; houseId: string },
  data: { type: ResourceType; name: string; externalId?: string },
) {
  const existing = await prisma.resource.findFirst({
    where: {
      houseId: parent.houseId,
      type: data.type,
      ...(data.externalId != null
        ? { externalId: data.externalId }
        : { parentId: parent.id, name: data.name }),
    },
  });
  if (existing) return existing;

  const created = await prisma.resource.create({
    data: {
      houseId: parent.houseId,
      type: data.type,
      name: data.name,
      externalId: data.externalId,
      parentId: parent.id,
      path: parent.path,
      depth: parent.depth + 1,
    },
  });
  return prisma.resource.update({
    where: { id: created.id },
    data: { path: `${parent.path}/${created.id}` },
  });
}

async function ensureRoleRight(resourceId: string, roleId: string, type: AccessRightType) {
  const exists = await prisma.accessRight.findFirst({
    where: { resourceId, roleId, accessRightType: type },
  });
  if (!exists) {
    await prisma.accessRight.create({ data: { resourceId, roleId, accessRightType: type } });
  }
}

async function setupHouseResourceAccess(houseId: string) {
  const house = await prisma.house.findUnique({ where: { id: houseId }, select: { ownerId: true } });
  if (!house?.ownerId) {
    console.warn(`   ⚠ skip ${houseId}: no owner`);
    return;
  }

  const ownerMember = await prisma.houseMember.findFirst({
    where: { houseId, userId: house.ownerId, removedAt: null },
  });
  if (!ownerMember) {
    console.warn(`   ⚠ skip ${houseId}: owner member not found`);
    return;
  }

  const roleNames = [SYSTEM_ROLE_NAMES.OWNER, SYSTEM_ROLE_NAMES.ADMIN, SYSTEM_ROLE_NAMES.DEFAULT] as const;
  const roleIds: Record<string, string> = {};

  for (const name of roleNames) {
    let role = await prisma.houseRole.findFirst({ where: { houseId, name } });
    if (!role) {
      role = await prisma.houseRole.create({
        data: {
          name,
          houseId,
          priority: SYSTEM_ROLE_PRIORITIES[name],
          isSystem: true,
          permissions: {
            create: (SYSTEM_ROLE_PERMISSIONS[name] ?? []).map((permission) => ({ permission })),
          },
        },
      });
    }
    roleIds[name] = role.id;
  }

  await prisma.houseMemberRole.upsert({
    where: {
      houseMemberId_roleId: { houseMemberId: ownerMember.id, roleId: roleIds[SYSTEM_ROLE_NAMES.OWNER] },
    },
    update: {},
    create: { houseMemberId: ownerMember.id, roleId: roleIds[SYSTEM_ROLE_NAMES.OWNER] },
  });

  let root = await prisma.resource.findFirst({
    where: { houseId, type: ResourceType.HOUSE, parentId: null },
  });
  if (!root) {
    root = await prisma.resource.create({
      data: { houseId, type: ResourceType.HOUSE, path: `/${houseId}`, depth: 0 },
    });
  }

  const containers = [
    { type: ResourceType.ROOM, name: 'Комнаты' },
    { type: ResourceType.DEVICE, name: 'Устройства' },
    { type: ResourceType.SCENE, name: 'Сценарии' },
    { type: ResourceType.AUTOMATION, name: 'Автоматизации' },
    { type: ResourceType.GROUP, name: 'Виджеты' },
  ] as const;

  for (const c of containers) {
    await ensureChildResource(root, { type: c.type, name: c.name });
  }

  for (const page of HOUSE_PAGE_DEFINITIONS) {
    const pageResource = await ensureChildResource(root, {
      type: ResourceType.PAGE,
      name: page.name,
      externalId: page.slug,
    });
    await ensureRoleRight(pageResource.id, roleIds[SYSTEM_ROLE_NAMES.OWNER], AccessRightType.ALLOW);
    await ensureRoleRight(pageResource.id, roleIds[SYSTEM_ROLE_NAMES.ADMIN], AccessRightType.ALLOW);
    if ((DEFAULT_READ_PAGE_SLUGS as readonly string[]).includes(page.slug)) {
      await ensureRoleRight(pageResource.id, roleIds[SYSTEM_ROLE_NAMES.DEFAULT], AccessRightType.READ);
    }
  }

  await ensureRoleRight(root.id, roleIds[SYSTEM_ROLE_NAMES.OWNER], AccessRightType.ALLOW);
  await ensureRoleRight(root.id, roleIds[SYSTEM_ROLE_NAMES.ADMIN], AccessRightType.ALLOW);
  await ensureRoleRight(root.id, roleIds[SYSTEM_ROLE_NAMES.DEFAULT], AccessRightType.READ);
}

async function main() {
  console.log('🔄 Backfilling PAGE resources for all houses...\n');

  const houses = await prisma.house.findMany({ select: { id: true, name: true } });
  for (const house of houses) {
    const before = await prisma.resource.count({ where: { houseId: house.id, type: 'PAGE' } });
    await setupHouseResourceAccess(house.id);
    const after = await prisma.resource.count({ where: { houseId: house.id, type: 'PAGE' } });
    console.log(`   ✔ ${house.name} (${house.id}): PAGE ${before} → ${after}`);
  }

  console.log('\n✅ Backfill complete');
}

main()
  .catch((e) => {
    console.error('❌ Backfill failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
