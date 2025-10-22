import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            oauthLogin: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('googleAuth', () => {
    it('should handle google auth request', async () => {
      const result = await controller.googleAuth();
      expect(result).toBeUndefined();
    });
  });

  describe('googleAuthRedirect', () => {
    it('should handle google auth redirect', async () => {
      const mockUser = { email: 'test@example.com', id: 1 };
      const mockToken = 'test-jwt-token';
      const mockReq = { user: mockUser };
      const mockRes = {
        send: jest.fn(),
      };

      jest.spyOn(authService, 'oauthLogin').mockResolvedValue(mockToken);

      await controller.googleAuthRedirect(mockReq, mockRes as any);

      expect(authService.oauthLogin).toHaveBeenCalledWith(mockUser);
      expect(mockRes.send).toHaveBeenCalled();
    });
  });

  describe('githubAuth', () => {
    it('should handle github auth request', async () => {
      const result = await controller.githubAuth();
      expect(result).toBeUndefined();
    });
  });

  describe('githubAuthRedirect', () => {
    it('should handle github auth redirect', async () => {
      const mockUser = { email: 'test@example.com', id: 1 };
      const mockToken = 'test-jwt-token';
      const mockReq = { user: mockUser };
      const mockRes = {
        send: jest.fn(),
      };

      jest.spyOn(authService, 'oauthLogin').mockResolvedValue(mockToken);

      await controller.githubAuthRedirect(mockReq, mockRes as any);

      expect(authService.oauthLogin).toHaveBeenCalledWith(mockUser);
      expect(mockRes.send).toHaveBeenCalled();
    });
  });
});
