import { AuthService } from '../src/auth/auth.service';
import type { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

const jwtService: JwtService = {
  sign: jest.fn().mockReturnValue('signed-token'),
} as any;

// Minimal user repo mock
function createUsersRepo(seed: any[] = []) {
  const items = [...seed];
  return {
    findOne: jest.fn(async ({ where }: any) => {
      const clauses: any[] = where || [];
      if (Array.isArray(clauses)) {
        return items.find((u) => clauses.some((c) => (u.username === c.username) || (u.email && u.email === c.email))) || null;
      }
      const key = Object.keys(where)[0];
      return items.find((u) => (u as any)[key] === (where as any)[key]) || null;
    }),
    create: jest.fn((u) => u),
    save: jest.fn(async (u) => ({ id: 123, ...u })),
  } as any;
}

jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed');

describe('AuthService.register', () => {
  it('rejects duplicate username', async () => {
    const usersRepo = createUsersRepo([{ username: 'dupe', email: 'a@b.com' }]);
    const service = new AuthService(jwtService, usersRepo, { updateLastLogin: jest.fn() } as any);

    await expect(service.registerUser('dupe', 'secret', 'x@y.com')).rejects.toThrow('Username already exists');
  });

  it('rejects duplicate email', async () => {
    const usersRepo = createUsersRepo([{ username: 'x', email: 'dupe@b.com' }]);
    const service = new AuthService(jwtService, usersRepo, { updateLastLogin: jest.fn() } as any);

    await expect(service.registerUser('new', 'secret', 'dupe@b.com')).rejects.toThrow('Email already exists');
  });

  it('hashes password and does not equal plain text', async () => {
    const usersRepo = createUsersRepo([]);
    const service = new AuthService(jwtService, usersRepo, { updateLastLogin: jest.fn() } as any);

    const result = await service.registerUser('new', 'secret', 'new@example.com');
    expect(result).toHaveProperty('id');
    expect(usersRepo.create).toHaveBeenCalled();
    const created = usersRepo.create.mock.calls[0][0];
    expect(created.password).toBe('hashed');
    expect(created.password).not.toBe('secret');
  });
});
