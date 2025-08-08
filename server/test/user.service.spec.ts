import { UserService } from '../src/user/user.service';
import { User, UserRole, UserStatus } from '../src/user/user.entity';
import { UserPermission, Permission } from '../src/user/user-permission.entity';
import { ActivityLog } from '../src/user/activity-log.entity';
import { UserPreferences } from '../src/user/user-preferences.entity';

import * as bcrypt from 'bcrypt';

// Simple in-memory repos
function createUserRepo() {
  let seq = 1;
  const items: any[] = [];
  return {
  create: jest.fn((u: any) => ({ ...u })),
    find: jest.fn(async () => items),
    findOne: jest.fn(async ({ where }: any) => {
      if (!where) return null;
      const key = Object.keys(where)[0];
      const val = where[key];
      return items.find((u) => (u as any)[key] === val) || null;
    }),
    findOneBy: jest.fn(async (criteria: any) => {
      const key = Object.keys(criteria)[0];
      const val = (criteria as any)[key];
      return items.find((u) => (u as any)[key] === val) || null;
    }),
    save: jest.fn(async (u: any) => {
      if (!u.id) u.id = seq++;
      const idx = items.findIndex((x) => x.id === u.id);
      if (idx >= 0) items[idx] = { ...items[idx], ...u };
      else items.push(u);
      return u;
    }),
    remove: jest.fn(async (u: any) => {
      const idx = items.findIndex((x) => x.id === u.id);
      if (idx >= 0) items.splice(idx, 1);
    }),
    update: jest.fn(async (id: number, patch: any) => {
      const item = items.find((x) => x.id === id);
      if (item) Object.assign(item, patch);
    }),
  } as any;
}

function createPermissionRepo() {
  const items: Array<Partial<UserPermission>> = [];
  return {
  create: jest.fn((d: any) => d),
    find: jest.fn(async ({ where, select }: any) => {
      const res = items.filter((i) => (where?.userId ? i.userId === where.userId : true));
      if (select?.includes?.('permission')) {
        return res.map((r) => ({ permission: r.permission }));
      }
      return res as any;
    }),
    findOne: jest.fn(async ({ where }: any) => {
      return (
        items.find(
          (i) => i.userId === where.userId && i.permission === where.permission
        ) || null
      ) as any;
    }),
    save: jest.fn(async (records: any) => {
      const arr = Array.isArray(records) ? records : [records];
      arr.forEach((r) => items.push({ ...r, id: items.length + 1 }));
      return arr as any;
    }),
    delete: jest.fn(async ({ userId }: any) => {
      for (let i = items.length - 1; i >= 0; i--) {
        if (items[i].userId === userId) items.splice(i, 1);
      }
    }),
    remove: jest.fn(async (record: any) => {
      const idx = items.findIndex(
        (i) => i.userId === record.userId && i.permission === record.permission
      );
      if (idx >= 0) items.splice(idx, 1);
    }),
    _items: items,
  } as any;
}

function createActivityLogRepo() {
  return {
    create: jest.fn((d) => d),
    save: jest.fn(async (d) => ({ id: Math.random(), ...d })),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: () => ({
        orderBy: () => ({ limit: () => ({ offset: () => ({ getMany: async () => [] }) }) }),
      }),
    })),
  } as any;
}

function createPreferencesRepo() {
  return {
    find: jest.fn(async () => []),
    findOne: jest.fn(async () => null),
    save: jest.fn(async (d) => d),
  } as any;
}

jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed');

describe('UserService - permissions and roles', () => {
  let service: UserService;
  let userRepo: any;
  let permRepo: any;

  beforeEach(() => {
    userRepo = createUserRepo();
    permRepo = createPermissionRepo();
    service = new UserService(
      userRepo,
      permRepo,
      createActivityLogRepo(),
      createPreferencesRepo()
    );
  });

  it('hasPermission returns true for ADMIN without hitting permission repo', async () => {
    // Arrange admin user
    await userRepo.save({ id: 1, username: 'admin', role: UserRole.ADMIN, status: UserStatus.ACTIVE });
    const spy = jest.spyOn(permRepo, 'findOne');

    // Act
    const result = await service.hasPermission(1, Permission.USER_READ);

    // Assert
    expect(result).toBe(true);
    expect(spy).not.toHaveBeenCalled();
  });

  it('hasPermission checks repository for non-admin', async () => {
    await userRepo.save({ id: 2, username: 'manager', role: UserRole.MANAGER, status: UserStatus.ACTIVE });
    // Grant permission
    await permRepo.save({ userId: 2, permission: Permission.USER_READ });

    const allowed = await service.hasPermission(2, Permission.USER_READ);
    const denied = await service.hasPermission(2, Permission.USER_DELETE);

    expect(allowed).toBe(true);
    expect(denied).toBe(false);
  });

  it('getUserPermissions returns all for ADMIN', async () => {
    await userRepo.save({ id: 3, username: 'admin2', role: UserRole.ADMIN, status: UserStatus.ACTIVE });

    const perms = await service.getUserPermissions(3);
    expect(perms.sort()).toEqual(Object.values(Permission).sort());
  });

  it('getUserPermissions returns only granted for non-admin', async () => {
    await userRepo.save({ id: 4, username: 'staff', role: UserRole.STAFF, status: UserStatus.ACTIVE });
    await permRepo.save({ userId: 4, permission: Permission.INVENTORY_READ });
    await permRepo.save({ userId: 4, permission: Permission.PRODUCT_CREATE });

    const perms = await service.getUserPermissions(4);
    expect(perms).toEqual([Permission.INVENTORY_READ, Permission.PRODUCT_CREATE]);
  });

  it('createUser seeds default permissions based on role (ADMIN -> all)', async () => {
    const user = await service.createUser({
      username: 'newadmin',
      email: 'admin@example.com',
      password: 'test',
      role: UserRole.ADMIN,
      firstName: 'A',
      lastName: 'D',
    }, undefined);

    const saved = permRepo._items.filter((r: any) => r.userId === user.id);
    expect(saved.length).toBe(Object.values(Permission).length);
  });

  it('createUser seeds default permissions based on role (MANAGER subset)', async () => {
    const user = await service.createUser({
      username: 'mgr',
      email: 'mgr@example.com',
      password: 'test',
      role: UserRole.MANAGER,
      firstName: 'M',
      lastName: 'G',
    }, undefined);

    const saved = permRepo._items.filter((r: any) => r.userId === user.id).map((r: any) => r.permission);

    // Manager includes USER_READ but not USER_DELETE according to service
    expect(saved).toContain(Permission.USER_READ);
    expect(saved).not.toContain(Permission.USER_DELETE);
    expect(saved.length).toBeGreaterThan(0);
  });
});
