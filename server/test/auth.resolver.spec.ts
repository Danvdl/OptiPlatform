import { Test, TestingModule } from '@nestjs/testing';
import { AuthResolver } from '../src/auth/auth.resolver';
import { AuthService } from '../src/auth/auth.service';

describe('AuthResolver', () => {
  let resolver: AuthResolver;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthResolver,
        {
          provide: AuthService,
          useValue: {
            validateUser: jest.fn(),
            registerUser: jest.fn(),
            login: jest.fn(),
          },
        },
      ],
    }).compile();

    resolver = module.get<AuthResolver>(AuthResolver);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      const loginInput = {
        username: 'testuser',
        password: 'password123',
      };

      const mockUser = { id: 1, username: 'testuser' };
      const mockToken = 'jwt-token-123';

      jest.spyOn(authService, 'validateUser').mockResolvedValue(mockUser as any);
      jest.spyOn(authService, 'login').mockResolvedValue(mockToken);

      const result = await resolver.login(loginInput);

      expect(result).toBe(mockToken);
      expect(authService.validateUser).toHaveBeenCalledWith('testuser', 'password123');
      expect(authService.login).toHaveBeenCalledWith(mockUser);
    });

    it('should throw error for invalid credentials', async () => {
      const loginInput = {
        username: 'wronguser',
        password: 'wrongpassword',
      };

      jest.spyOn(authService, 'validateUser').mockResolvedValue(null);

      await expect(resolver.login(loginInput)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('register', () => {
    it('should register new user', async () => {
      const registerInput = {
        username: 'newuser',
        password: 'newpassword123',
      };

      const mockUser = { id: 1, username: 'newuser' };
      const mockToken = 'jwt-token-123';

      jest.spyOn(authService, 'registerUser').mockResolvedValue(mockUser as any);
      jest.spyOn(authService, 'login').mockResolvedValue(mockToken);

      const result = await resolver.register(registerInput);

      expect(result).toBe(mockToken);
      expect(authService.registerUser).toHaveBeenCalledWith('newuser', 'newpassword123');
      expect(authService.login).toHaveBeenCalledWith(mockUser);
    });
  });
});
