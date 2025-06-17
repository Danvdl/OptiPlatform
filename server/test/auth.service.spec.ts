import { AuthService } from '../src/auth/auth.service';
import type { JwtService } from '@nestjs/jwt';

import { Repository } from 'typeorm';
import { User } from '../src/user/user.entity';

import * as bcrypt from 'bcrypt';

// simple mock JwtService
const jwtService: JwtService = {
  sign: jest.fn().mockReturnValue('signed-token'),
} as any;

// mock User repository
const usersRepo = {
  findOne: jest.fn(async ({ where: { username } }) => {
    if (username === 'test') {
      return { id: 1, username: 'test', password: 'hashed' };
    }
    return null;
  }),
} as any;

jest.spyOn(bcrypt, 'compare').mockImplementation(async (pass: string) => pass === 'test');

describe('AuthService', () => {
  const service = new AuthService(jwtService, usersRepo);


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
