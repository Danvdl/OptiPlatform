import { InventoryService } from '../src/inventory/inventory.service';
import { NotificationsService } from '../src/notifications/notifications.service';

describe('InventoryService', () => {
  let service: InventoryService;
  const productRepo = {
    create: jest.fn((d) => d),
    save: jest.fn(async (d) => Object.assign({ id: 1 }, d)),
    delete: jest.fn(),
    find: jest.fn(),
    findOneBy: jest.fn(),
  } as any;

  const txRepo = {
    create: jest.fn((d) => d),
    save: jest.fn(async (d) => d),
    delete: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  } as any;

  const notifications = {
    sendLowStockAlert: jest.fn(),
  } as unknown as NotificationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new InventoryService(productRepo, txRepo, notifications);
  });

  it('creates a product', async () => {
    await service.createProduct({ name: 'Widget' });
    expect(productRepo.create).toHaveBeenCalledWith({ name: 'Widget' });
    expect(productRepo.save).toHaveBeenCalled();
  });

  it('alerts when stock is low after transaction', async () => {
    jest.spyOn(service as any, 'getCurrentStock').mockResolvedValue(3);
    productRepo.findOneBy.mockResolvedValue({ id: 1, name: 'Widget' });

    await service.createTransaction({
      productId: 1,
      locationId: 1,
      quantity: -2,
      transactionType: 'remove',
    });

    expect(notifications.sendLowStockAlert).toHaveBeenCalledWith('Widget', 3);
  });
});
