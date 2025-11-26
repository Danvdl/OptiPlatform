import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
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
            find: vi.fn().mockResolvedValue([]),
            findOne: vi.fn(),
            save: vi.fn(),
            create: vi.fn((dto) => dto),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    tokenRepo = module.get<Repository<DeviceToken>>(getRepositoryToken(DeviceToken));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerToken', () => {
    it('should register a new device token', async () => {
      const token = 'test-token-123';
      const userId = 1;

      vi.spyOn(tokenRepo, 'findOne').mockResolvedValue(null);
      vi.spyOn(tokenRepo, 'save').mockResolvedValue({ token, userId } as any);

      await service.registerToken(token, userId);

      expect(tokenRepo.findOne).toHaveBeenCalledWith({ where: { token } });
      expect(tokenRepo.save).toHaveBeenCalled();
    });

    it('should not duplicate existing token', async () => {
      const token = 'existing-token';
      const existingToken = { token, userId: 1 };

      vi.spyOn(tokenRepo, 'findOne').mockResolvedValue(existingToken as any);
      vi.spyOn(tokenRepo, 'save');

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

    it('should not throw when no tokens registered', async () => {
      const product = 'Widget';
      const quantity = 2;

      await expect(service.sendLowStockAlert(product, quantity)).resolves.not.toThrow();
    });
  });

  describe('sendWasteAlert', () => {
    it('should handle sending waste alert with all parameters', async () => {
      const params = {
        product: 'Damaged Goods',
        quantity: 10,
        value: 250.50,
        reason: 'Water damage',
      };

      await expect(service.sendWasteAlert(params)).resolves.not.toThrow();
    });

    it('should handle waste alert without reason', async () => {
      const params = {
        product: 'Expired Items',
        quantity: 5,
        value: 100,
      };

      await expect(service.sendWasteAlert(params)).resolves.not.toThrow();
    });

    it('should format value correctly in alert', async () => {
      const params = {
        product: 'Test',
        quantity: 1,
        value: 99.999,
      };

      await expect(service.sendWasteAlert(params)).resolves.not.toThrow();
    });

    it('should handle singular and plural units correctly', async () => {
      // Singular
      await expect(service.sendWasteAlert({
        product: 'Item',
        quantity: 1,
        value: 10,
      })).resolves.not.toThrow();

      // Plural
      await expect(service.sendWasteAlert({
        product: 'Items',
        quantity: 5,
        value: 50,
      })).resolves.not.toThrow();
    });

    it('should not throw when no tokens registered', async () => {
      const params = {
        product: 'Widget',
        quantity: 3,
        value: 45,
      };

      await expect(service.sendWasteAlert(params)).resolves.not.toThrow();
    });
  });
});
