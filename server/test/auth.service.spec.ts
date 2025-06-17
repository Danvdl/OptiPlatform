import { AuthService } from '../src/auth/auth.service';
import type { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '../src/user/user.entity';
import * as bcrypt from 'bcrypt';

// simple mock JwtService
const jwtService: JwtService = {
  sign: jest.fn().mockReturnValue('signed-token'),
} as any;

// mock Repository<User>
const userRepo = {
  findOne: jest.fn(),
} as unknown as Repository<User>;

describe('AuthService', () => {
  let service: AuthService;
  const passwordHash = bcrypt.hashSync('test', 10);

  beforeEach(() => {
    jest.clearAllMocks();
    userRepo.findOne = jest.fn().mockResolvedValue({ id: 1, username: 'test', password: passwordHash });
    service = new AuthService(jwtService, userRepo);
  });

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
