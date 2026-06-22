import {
  AccessRightType,
  PrismaClient,
  ResourceType,
} from '@prisma/client';
import {
  DEFAULT_READ_PAGE_SLUGS,
  HOUSE_PAGE_DEFINITIONS,
} from '../../src/modules/house-roles/house-pages.constants';
import {
  SYSTEM_ROLE_NAMES,
  SYSTEM_ROLE_PRIORITIES,
  SYSTEM_ROLE_PERMISSIONS,
} from '../../src/modules/house-roles/constants';

export const GUEST_ROLE_NAME = 'Guest';
export const USER_ROLE_NAME = 'User';

export type RoomDef = { name: string; slug: string };
export type DeviceDef = {
  externalId: string;
  name: string;
  roomSlug: string;
  functions: Array<{ code: string; name: string }>;
};

export const DEMO_ROOMS: RoomDef[] = [
  { name: 'Коридор', slug: 'corridor' },
  { name: 'Гостиная', slug: 'living' },
  { name: 'Спальня', slug: 'bedroom' },
];

export const DEMO_DEVICES: DeviceDef[] = [
  {
    externalId: 'demo-corridor-light',
    name: 'Свет в коридоре',
    roomSlug: 'corridor',
    functions: [{ code: 'power', name: 'Питание' }],
  },
  {
    externalId: 'demo-living-light',
    name: 'Свет в гостиной',
    roomSlug: 'living',
    functions: [{ code: 'power', name: 'Питание' }],
  },
  {
    externalId: 'demo-bedroom-light',
    name: 'Свет в спальне',
    roomSlug: 'bedroom',
    functions: [{ code: 'power', name: 'Питание' }],
  },
  {
    externalId: 'demo-living-thermo',
    name: 'Термостат гостиной',
    roomSlug: 'living',
    functions: [
      { code: 'current_temp', name: 'Текущая температура' },
      { code: 'target_temp', name: 'Целевая температура' },
    ],
  },
];

export async function upsertExternalUser(
  prisma: PrismaClient,
  externalUserId: string,
  displayName: string,
) {
  const byName = await prisma.user.findFirst({ where: { displayName } });
  if (byName) {
    if (byName.externalUserId !== externalUserId) {
      return prisma.user.update({
        where: { id: byName.id },
        data: { externalUserId, displayName },
      });
    }
    return byName;
  }
  const byExternal = await prisma.user.findUnique({ where: { externalUserId } });
  if (byExternal) {
    return prisma.user.update({
      where: { id: byExternal.id },
      data: { displayName },
    });
  }
  return prisma.user.create({ data: { externalUserId, displayName } });
}

export async function ensureChildResource(
  prisma: PrismaClient,
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

export async function ensureRoleRight(
  prisma: PrismaClient,
  resourceId: string,
  roleId: string,
  type: AccessRightType,
) {
  const exists = await prisma.accessRight.findFirst({
    where: { resourceId, roleId, accessRightType: type },
  });
  if (!exists) {
    await prisma.accessRight.create({
      data: { resourceId, roleId, accessRightType: type },
    });
  }
}

async function ensureDefaultRoles(prisma: PrismaClient, houseId: string, ownerMemberId: string) {
  const roleNames = [SYSTEM_ROLE_NAMES.OWNER, SYSTEM_ROLE_NAMES.ADMIN, SYSTEM_ROLE_NAMES.DEFAULT] as const;
  const ids: Record<string, string> = {};

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
    ids[name] = role.id;
  }

  await prisma.houseMemberRole.upsert({
    where: {
      houseMemberId_roleId: { houseMemberId: ownerMemberId, roleId: ids[SYSTEM_ROLE_NAMES.OWNER] },
    },
    update: {},
    create: { houseMemberId: ownerMemberId, roleId: ids[SYSTEM_ROLE_NAMES.OWNER] },
  });

  return ids;
}

export async function ensureHouseStructure(
  prisma: PrismaClient,
  houseId: string,
  ownerMemberId: string,
  rooms: RoomDef[] = DEMO_ROOMS,
  devices: DeviceDef[] = DEMO_DEVICES,
) {
  let root = await prisma.resource.findFirst({
    where: { houseId, type: ResourceType.HOUSE, parentId: null },
  });
  if (!root) {
    root = await prisma.resource.create({
      data: { houseId, type: ResourceType.HOUSE, path: `/${houseId}`, depth: 0 },
    });
  }

  const roleIds = await ensureDefaultRoles(prisma, houseId, ownerMemberId);

  const containers = [
    { type: ResourceType.ROOM, name: 'Комнаты' },
    { type: ResourceType.DEVICE, name: 'Устройства' },
    { type: ResourceType.SCENE, name: 'Сценарии' },
    { type: ResourceType.AUTOMATION, name: 'Автоматизации' },
    { type: ResourceType.GROUP, name: 'Виджеты' },
  ] as const;

  for (const c of containers) {
    await ensureChildResource(prisma, root, { type: c.type, name: c.name });
  }

  for (const page of HOUSE_PAGE_DEFINITIONS) {
    const pageResource = await ensureChildResource(prisma, root, {
      type: ResourceType.PAGE,
      name: page.name,
      externalId: page.slug,
    });
    for (const roleId of [roleIds[SYSTEM_ROLE_NAMES.OWNER], roleIds[SYSTEM_ROLE_NAMES.ADMIN]]) {
      await ensureRoleRight(prisma, pageResource.id, roleId, AccessRightType.ALLOW);
    }
    if ((DEFAULT_READ_PAGE_SLUGS as readonly string[]).includes(page.slug)) {
      await ensureRoleRight(prisma, pageResource.id, roleIds[SYSTEM_ROLE_NAMES.DEFAULT], AccessRightType.READ);
    }
  }

  await ensureRoleRight(prisma, root.id, roleIds[SYSTEM_ROLE_NAMES.OWNER], AccessRightType.ALLOW);
  await ensureRoleRight(prisma, root.id, roleIds[SYSTEM_ROLE_NAMES.ADMIN], AccessRightType.ALLOW);
  await ensureRoleRight(prisma, root.id, roleIds[SYSTEM_ROLE_NAMES.DEFAULT], AccessRightType.READ);

  const roomBySlug = new Map<string, { id: string }>();

  for (const room of rooms) {
    const roomResource = await ensureChildResource(prisma, root, {
      type: ResourceType.ROOM,
      name: room.name,
      externalId: room.slug,
    });
    roomBySlug.set(room.slug, roomResource);
  }

  const fnByExternal = new Map<string, string>();

  for (const device of devices) {
    const room = roomBySlug.get(device.roomSlug);
    if (!room) throw new Error(`Room not found: ${device.roomSlug}`);

    const deviceResource = await ensureChildResource(prisma, room as never, {
      type: ResourceType.DEVICE,
      name: device.name,
      externalId: device.externalId,
    });

    for (const fn of device.functions) {
      const externalId = `fn:${device.externalId}:${fn.code}`;
      const fnResource = await ensureChildResource(prisma, deviceResource as never, {
        type: ResourceType.DEVICE_FUNCTION,
        name: fn.name,
        externalId,
      });
      fnByExternal.set(externalId, fnResource.id);
    }
  }

  return { roleIds, fnByExternal, rootId: root.id };
}

export async function ensureCustomRole(
  prisma: PrismaClient,
  houseId: string,
  name: string,
  priority: number,
) {
  let role = await prisma.houseRole.findFirst({ where: { houseId, name } });
  if (!role) {
    role = await prisma.houseRole.create({
      data: { houseId, name, priority, isSystem: false },
    });
  }
  return role;
}

export async function ensureMember(
  prisma: PrismaClient,
  houseId: string,
  userId: string,
  roleId: string,
) {
  let member = await prisma.houseMember.findFirst({
    where: { houseId, userId, removedAt: null },
  });
  if (!member) {
    member = await prisma.houseMember.create({ data: { houseId, userId } });
  }
  await prisma.houseMemberRole.upsert({
    where: { houseMemberId_roleId: { houseMemberId: member.id, roleId } },
    update: {},
    create: { houseMemberId: member.id, roleId },
  });
  return member;
}

export async function applyGuestUserRoleRights(
  prisma: PrismaClient,
  houseId: string,
  guestRoleId: string,
  userRoleId: string,
  fnByExternal: Map<string, string>,
) {
  const guestPageSlugs = ['overview', 'devices'] as const;
  for (const slug of guestPageSlugs) {
    const page = await prisma.resource.findFirst({
      where: { houseId, type: ResourceType.PAGE, externalId: slug },
    });
    if (page) await ensureRoleRight(prisma, page.id, guestRoleId, AccessRightType.READ);
  }

  const corridorPower = fnByExternal.get('fn:demo-corridor-light:power');
  if (corridorPower) {
    await ensureRoleRight(prisma, corridorPower, guestRoleId, AccessRightType.WRITE);
  }

  const userPageSlugs = ['overview', 'rooms', 'devices', 'scenarios', 'widgets'] as const;
  for (const slug of userPageSlugs) {
    const page = await prisma.resource.findFirst({
      where: { houseId, type: ResourceType.PAGE, externalId: slug },
    });
    if (page) await ensureRoleRight(prisma, page.id, userRoleId, AccessRightType.READ);
  }

  for (const externalId of [
    'fn:demo-corridor-light:power',
    'fn:demo-living-light:power',
    'fn:demo-bedroom-light:power',
  ]) {
    const resourceId = fnByExternal.get(externalId);
    if (resourceId) await ensureRoleRight(prisma, resourceId, userRoleId, AccessRightType.WRITE);
  }

  const targetTempId = fnByExternal.get('fn:demo-living-thermo:target_temp');
  if (targetTempId) await ensureRoleRight(prisma, targetTempId, userRoleId, AccessRightType.WRITE);
}

export interface SeedHouseAccessOptions {
  guestExternalId: string;
  userExternalId: string;
  /** If set, use this user as owner member instead of creating admin owner */
  keepExistingOwner?: boolean;
}

export async function seedHouseGuestUserAccess(
  prisma: PrismaClient,
  houseId: string,
  options: SeedHouseAccessOptions,
) {
  const house = await prisma.house.findUnique({ where: { id: houseId } });
  if (!house) throw new Error(`House not found: ${houseId}`);

  const guestUser = await upsertExternalUser(prisma, options.guestExternalId, 'Guest User');
  const regularUser = await upsertExternalUser(prisma, options.userExternalId, 'Demo User');

  let ownerMember = await prisma.houseMember.findFirst({
    where: { houseId, userId: house.ownerId ?? '', removedAt: null },
  });

  if (!ownerMember && options.keepExistingOwner && house.ownerId) {
    throw new Error(`Owner member not found for house ${houseId}`);
  }

  if (!ownerMember) {
    const admin = await upsertExternalUser(
      prisma,
      'd4e5f6a7-b8c9-0123-defa-456789012345',
      'Admin User',
    );
    await prisma.house.update({ where: { id: houseId }, data: { ownerId: admin.id } });
    ownerMember = await prisma.houseMember.upsert({
      where: { houseId_userId: { houseId, userId: admin.id } },
      update: { removedAt: null },
      create: { houseId, userId: admin.id },
    });
  }

  const ownerMemberId = ownerMember.id;
  const { fnByExternal } = await ensureHouseStructure(prisma, houseId, ownerMemberId);

  const guestRole = await ensureCustomRole(prisma, houseId, GUEST_ROLE_NAME, 10);
  const userRole = await ensureCustomRole(prisma, houseId, USER_ROLE_NAME, 11);

  await ensureMember(prisma, houseId, guestUser.id, guestRole.id);
  await ensureMember(prisma, houseId, regularUser.id, userRole.id);

  await applyGuestUserRoleRights(prisma, houseId, guestRole.id, userRole.id, fnByExternal);

  return { house, guestRole, userRole, fnByExternal };
}
