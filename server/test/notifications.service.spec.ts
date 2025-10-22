import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from '../src/notifications/notifications.service';
import { DeviceToken } from '../src/notifications/entities/device-token.entity';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let tokenRepo: Repository<DeviceToken>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(DeviceToken),
          useValue: {
            find: jest.fn().mockResolvedValue([]),
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn((dto) => dto),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    tokenRepo = module.get<Repository<DeviceToken>>(getRepositoryToken(DeviceToken));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerToken', () => {
    it('should register a new device token', async () => {
      const token = 'test-token-123';
      const userId = 1;

      jest.spyOn(tokenRepo, 'findOne').mockResolvedValue(null);
      jest.spyOn(tokenRepo, 'save').mockResolvedValue({ token, userId } as any);

      await service.registerToken(token, userId);

      expect(tokenRepo.findOne).toHaveBeenCalledWith({ where: { token } });
      expect(tokenRepo.save).toHaveBeenCalled();
    });

    it('should not duplicate existing token', async () => {
      const token = 'existing-token';
      const existingToken = { token, userId: 1 };

      jest.spyOn(tokenRepo, 'findOne').mockResolvedValue(existingToken as any);
      jest.spyOn(tokenRepo, 'save');

      await service.registerToken(token);

      expect(tokenRepo.findOne).toHaveBeenCalledWith({ where: { token } });
      expect(tokenRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('sendLowStockAlert', () => {
    it('should handle sending low stock alert', async () => {
      const product = 'Test Product';
      const quantity = 5;

      await expect(service.sendLowStockAlert(product, quantity)).resolves.not.toThrow();
    });
  });
});
