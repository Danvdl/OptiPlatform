import { DataSource } from 'typeorm';
import { Product } from '../inventory/entities/product.entity';
import { InventoryTransaction, TransactionType } from '../inventory/entities/inventory-transaction.entity';
import { Category } from '../inventory/entities/category.entity';

async function seedAnalyticsData() {
  // Create a connection to the database
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'aws-0-eu-west-2.pooler.supabase.com',
    port: parseInt(process.env.DB_PORT || '6543'),
    username: process.env.DB_USERNAME || 'postgres.npwzcpqrmfmcnqbdgzjf',
    password: process.env.DB_PASSWORD || 'OptiPlatform2024!',
    database: process.env.DB_NAME || 'postgres',
    entities: [Product, InventoryTransaction, Category],
    synchronize: false,
    ssl: { rejectUnauthorized: false },
  });

  await dataSource.initialize();
  console.log('✅ Database connected');

  const productRepo = dataSource.getRepository(Product);
  const transactionRepo = dataSource.getRepository(InventoryTransaction);
  const categoryRepo = dataSource.getRepository(Category);

  // Clear existing test data (optional - comment out if you want to keep existing data)
  // await transactionRepo.delete({});
  // await productRepo.delete({});
  // console.log('🗑️  Cleared existing data');

  try {
    // Create or get categories
    console.log('📁 Creating categories...');
    let electronicsCategory = await categoryRepo.findOne({ where: { name: 'Electronics' } });
    if (!electronicsCategory) {
      electronicsCategory = await categoryRepo.save({ name: 'Electronics', description: 'Electronic products' });
    }
    
    let furnitureCategory = await categoryRepo.findOne({ where: { name: 'Furniture' } });
    if (!furnitureCategory) {
      furnitureCategory = await categoryRepo.save({ name: 'Furniture', description: 'Furniture items' });
    }
    console.log('✅ Categories ready');

    // Create products with different health profiles
    const products = [
      // Excellent Health Products
      {
        name: 'Premium Laptop',
        sku: 'TECH-001',
        description: 'High-performance laptop with excellent sales',
        categoryId: electronicsCategory.id,
        unit: 'pcs',
        restockThreshold: 20,
        purchasePrice: 999.99,
        salePrice: 1299.99,
        currency: 'USD',
      },
      {
        name: 'Wireless Mouse',
        sku: 'TECH-002',
        description: 'Ergonomic wireless mouse with steady demand',
        categoryId: electronicsCategory.id,
        unit: 'pcs',
        restockThreshold: 50,
        purchasePrice: 19.99,
        salePrice: 29.99,
        currency: 'USD',
      },
      // Good Health Products
      {
        name: 'Office Chair',
        sku: 'FURN-001',
        description: 'Comfortable office chair with moderate sales',
        categoryId: furnitureCategory.id,
        unit: 'pcs',
        restockThreshold: 15,
        purchasePrice: 199.99,
        salePrice: 299.99,
        currency: 'USD',
      },
      {
        name: 'Standing Desk',
        sku: 'FURN-002',
        description: 'Adjustable standing desk',
        categoryId: furnitureCategory.id,
        unit: 'pcs',
        restockThreshold: 10,
        purchasePrice: 399.99,
        salePrice: 599.99,
        currency: 'USD',
      },
      // Warning - Low Stock Products
      {
        name: 'Mechanical Keyboard',
        sku: 'TECH-003',
        description: 'RGB mechanical keyboard - running low!',
        categoryId: electronicsCategory.id,
        unit: 'pcs',
        restockThreshold: 15,
        purchasePrice: 99.99,
        salePrice: 149.99,
        currency: 'USD',
      },
      {
        name: 'Monitor Stand',
        sku: 'FURN-003',
        description: 'Adjustable monitor stand - low stock',
        categoryId: furnitureCategory.id,
        unit: 'pcs',
        restockThreshold: 10,
        purchasePrice: 49.99,
        salePrice: 79.99,
        currency: 'USD',
      },
      // Critical - Multiple Issues
      {
        name: 'USB Cable',
        sku: 'TECH-004',
        description: 'USB-C cable - critical stock level with declining sales',
        categoryId: electronicsCategory.id,
        unit: 'pcs',
        restockThreshold: 20,
        purchasePrice: 8.99,
        salePrice: 12.99,
        currency: 'USD',
      },
      {
        name: 'Desk Lamp',
        sku: 'FURN-004',
        description: 'LED desk lamp - overstocked, slow moving',
        categoryId: furnitureCategory.id,
        unit: 'pcs',
        restockThreshold: 10,
        purchasePrice: 29.99,
        salePrice: 49.99,
        currency: 'USD',
      },
    ];

    console.log('📦 Creating products...');
    const createdProducts = await productRepo.save(products);
    console.log(`✅ Created ${createdProducts.length} products`);

    // Generate transaction history for each product
    console.log('📊 Generating transaction history...');
    const now = new Date();
    
    for (const product of createdProducts) {
      const transactions = [];
      
      // Generate transactions based on product health profile
      if (product.sku === 'TECH-001' || product.sku === 'TECH-002') {
        // Excellent health - consistent high sales
        for (let i = 90; i >= 0; i -= 3) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          transactions.push({
            product,
            type: TransactionType.SALE,
            quantity: Math.floor(Math.random() * 5) + 8, // 8-12 units
            transactionDate: date,
            userId: 1,
            notes: 'Regular sale',
          });
        }
      } else if (product.sku === 'FURN-001' || product.sku === 'FURN-002') {
        // Good health - moderate sales
        for (let i = 90; i >= 0; i -= 5) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          transactions.push({
            product,
            type: TransactionType.SALE,
            quantity: Math.floor(Math.random() * 3) + 2, // 2-4 units
            transactionDate: date,
            userId: 1,
            notes: 'Regular sale',
          });
        }
      } else if (product.sku === 'TECH-003' || product.sku === 'FURN-003') {
        // Warning - decent sales but low stock
        for (let i = 90; i >= 0; i -= 4) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          transactions.push({
            product,
            type: TransactionType.SALE,
            quantity: Math.floor(Math.random() * 4) + 3, // 3-6 units
            transactionDate: date,
            userId: 1,
            notes: 'Regular sale',
          });
        }
      } else if (product.sku === 'TECH-004') {
        // Critical - declining sales
        for (let i = 90; i >= 30; i -= 3) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const quantity = Math.max(1, Math.floor(Math.random() * 5) + 5 - Math.floor(i / 15)); // Declining
          transactions.push({
            product,
            type: TransactionType.SALE,
            quantity,
            transactionDate: date,
            userId: 1,
            notes: 'Declining sales',
          });
        }
        // Recent: very few sales
        for (let i = 25; i >= 0; i -= 8) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          transactions.push({
            product,
            type: TransactionType.SALE,
            quantity: 1,
            transactionDate: date,
            userId: 1,
            notes: 'Slow moving',
          });
        }
      } else if (product.sku === 'FURN-004') {
        // Critical - overstocked, slow moving
        for (let i = 90; i >= 0; i -= 10) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          transactions.push({
            product,
            type: TransactionType.SALE,
            quantity: Math.floor(Math.random() * 2) + 1, // 1-2 units
            transactionDate: date,
            userId: 1,
            notes: 'Slow sale',
          });
        }
      }

      // Add some restocking transactions
      if (transactions.length > 0) {
        const midPoint = Math.floor(transactions.length / 2);
        const restockDate = new Date(now);
        restockDate.setDate(restockDate.getDate() - 45);
        transactions.splice(midPoint, 0, {
          product,
          type: TransactionType.PURCHASE,
          quantity: product.sku.includes('TECH') ? 50 : 30,
          transactionDate: restockDate,
          userId: 1,
          notes: 'Regular restock',
        });
      }

      await transactionRepo.save(transactions);
      console.log(`  ✅ Created ${transactions.length} transactions for ${product.name}`);
    }

    console.log('\n🎉 Analytics data seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - ${createdProducts.length} products created`);
    console.log('   - Products with excellent health: TECH-001, TECH-002');
    console.log('   - Products with good health: FURN-001, FURN-002');
    console.log('   - Products with warnings: TECH-003, FURN-003');
    console.log('   - Products with critical issues: TECH-004, FURN-004');
    console.log('\n💡 You can now test the ML Analytics feature!');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await dataSource.destroy();
    console.log('🔌 Database connection closed');
  }
}

// Run the seeding function
seedAnalyticsData().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
