import { InventoryService } from '../src/inventory/inventory.service';
import { vi } from 'vitest';
import { InventoryTransaction, TransactionType } from '../src/inventory/entities/inventory-transaction.entity';

describe('InventoryService - transactions', () => {
  const productRepo = {
    findOneBy: vi.fn(async ({ id }) => ({ id, name: 'Widget', restockThreshold: 5 })),
  } as any;

  const txRepo = {
    create: vi.fn((d) => d),
    save: vi.fn(async (d) => d),
    createQueryBuilder: vi.fn(() => ({
      select: () => ({ where: () => ({ getRawOne: async () => ({ sum: '3' }) }) }),
    })),
    find: vi.fn(),
    findOneBy: vi.fn(),
  } as any;

  const categoryRepo = { } as any;
  const productNoteRepo = { } as any;
  const notifications = { sendLowStockAlert: vi.fn(), sendWasteAlert: vi.fn() } as any;
  const priceHistoryService = { trackPriceChange: vi.fn() } as any;

  const config = { get: vi.fn(() => undefined) } as any;
  const service = new InventoryService(productRepo, categoryRepo, productNoteRepo, txRepo, notifications, priceHistoryService, config);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('computes totalCost from unitCost and quantity', async () => {
    await service.createTransaction({
      productId: 1,
      quantity: -2,
      transactionType: TransactionType.REMOVE,
      unitCost: 10,
    } as any);

    expect(txRepo.create).toHaveBeenCalledWith(expect.objectContaining({ totalCost: 20 }));
  });

  it('triggers low stock notification when below threshold', async () => {
    await service.createTransaction({
      productId: 1,
      quantity: -2,
      transactionType: TransactionType.REMOVE,
    } as any);

    expect(notifications.sendLowStockAlert).toHaveBeenCalledWith('Widget', 3);
  });

  it('sends waste alert when waste value exceeds threshold', async () => {
    // current stock mocked by query builder is 3; product purchasePrice used if no unitCost
    await service.createWaste({
      productId: 1,
      userId: 1,
      quantity: 2,
      wasteType: 'waste',
      reasonCode: 'expired',
      unitCost: 60, // 2 * 60 = 120 > 100
    } as any);

    expect(notifications.sendWasteAlert).toHaveBeenCalledWith(
      expect.objectContaining({ product: 'Widget', quantity: 2, value: 120, reason: 'expired' })
    );
  });

  it('also checks low stock after waste', async () => {
    notifications.sendWasteAlert.mockClear();
    notifications.sendLowStockAlert.mockClear();

    await service.createWaste({
      productId: 1,
      userId: 1,
      quantity: 3, // newStock = 0, should trigger low stock alert
      wasteType: 'damaged',
      reasonCode: 'customer_damage',
      unitCost: 10,
    } as any);

    expect(notifications.sendLowStockAlert).toHaveBeenCalledWith('Widget', 0);
  });
});
