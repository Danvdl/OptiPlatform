import { AuthService } from '../src/auth/auth.service';
import type { JwtService } from '@nestjs/jwt';

// simple mock JwtService
const jwtService: JwtService = {
  sign: jest.fn().mockReturnValue('signed-token'),
} as any;

describe('AuthService', () => {
  const service = new AuthService(jwtService);

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
