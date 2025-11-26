import { AuthService } from '../src/auth/auth.service';
import { vi } from 'vitest';
import type { JwtService } from '@nestjs/jwt';
import { UserService } from '../src/user/user.service';

import { Repository } from 'typeorm';
import { User } from '../src/user/user.entity';

vi.mock('bcrypt', () => ({
  compare: vi.fn(async (pass: string) => pass === 'test'),
}));

// simple mock JwtService
const jwtService: JwtService = {
  sign: vi.fn(() => 'signed-token'),
  signAsync: vi.fn(),
  verify: vi.fn(),
  verifyAsync: vi.fn(),
  decode: vi.fn(),
} as any;

// mock User repository
const usersRepo = {
  findOne: vi.fn(async ({ where: { username } }) => {
    if (username === 'test') {
      return { id: 1, username: 'test', password: 'hashed' };
    }
    return null;
  }),
  create: vi.fn((u) => u),
  save: vi.fn(async (u) => u),
} as any;

describe('AuthService', () => {
  const mockUserService = { 
    updateLastLogin: vi.fn().mockResolvedValue(undefined) 
  } as unknown as UserService;
  const service = new AuthService(jwtService, usersRepo, mockUserService);


  it('validates a user with correct credentials', async () => {
    const result = await service.validateUser('test', 'test');
    expect(result).toEqual({ id: 1, username: 'test' });
  });

  it('returns null for invalid credentials', async () => {
    const result = await service.validateUser('test', 'wrong');
    expect(result).toBeNull();
  });

  it('signs a token on login', async () => {
    const user = { id: 1, username: 'test' };
    const token = await service.login(user);
    expect(jwtService.sign).toHaveBeenCalledWith({ username: 'test', sub: 1 });
    expect(token).toBe('signed-token');
  });
});
