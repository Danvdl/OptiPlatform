import { UserResolver } from '../src/user/user.resolver';
import { UserRole } from '../src/user/user.entity';
import { Permission } from '../src/user/user-permission.entity';

describe('UserResolver - access checks', () => {
  const userService = {
    hasPermission: jest.fn(),
    findAll: jest.fn(async () => []),
    getUserPermissions: jest.fn(async () => []),
  } as any;

  const loggingService = { logInfo: jest.fn() } as any;
  const resolver = new UserResolver(userService, loggingService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const ctx = (user: any) => ({ req: { user } });

  it('users query denies without USER_READ', async () => {
    userService.hasPermission.mockResolvedValue(false);
    await expect(resolver.users(ctx({ id: 2, role: UserRole.STAFF }))).rejects.toThrow('Insufficient permissions to view users');
  });

  it('users query allows with admin (hasPermission true)', async () => {
    userService.hasPermission.mockResolvedValue(true);
    const res = await resolver.users(ctx({ id: 1, role: UserRole.ADMIN }));
    expect(Array.isArray(res)).toBe(true);
  });

  it("userPermissions returns caller's own without USER_READ", async () => {
    userService.getUserPermissions.mockResolvedValue([Permission.INVENTORY_READ]);
    const res = await resolver.userPermissions(ctx({ id: 5, role: UserRole.STAFF }), undefined);
    expect(res).toEqual([Permission.INVENTORY_READ]);
    expect(userService.hasPermission).not.toHaveBeenCalled();
  });

  it('userPermissions enforces USER_READ when targeting others', async () => {
    userService.hasPermission.mockResolvedValue(false);
    await expect(
      resolver.userPermissions(ctx({ id: 5, role: UserRole.STAFF }), 10)
    ).rejects.toThrow('Insufficient permissions to view user permissions');

    // When permission granted
    userService.hasPermission.mockResolvedValue(true);
    userService.getUserPermissions.mockResolvedValue([Permission.USER_READ]);
    const ok = await resolver.userPermissions(ctx({ id: 5, role: UserRole.STAFF }), 10);
    expect(ok).toEqual([Permission.USER_READ]);
  });
});
