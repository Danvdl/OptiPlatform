import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function seedAnalyticsData() {
  // Create a connection pool
  const pool = new Pool({
    host: process.env.DB_HOST || 'aws-0-eu-west-2.pooler.supabase.com',
    port: parseInt(process.env.DB_PORT || '6543'),
    user: process.env.DB_USERNAME || 'postgres.npwzcpqrmfmcnqbdgzjf',
    password: process.env.DB_PASSWORD || 'OptiPlatform2024!',
    database: process.env.DB_NAME || 'postgres',
    ssl: { rejectUnauthorized: false },
  });

  console.log('✅ Database connected');

  try {
    // Create categories if they don't exist
    console.log('📁 Creating categories...');
    const electronicsResult = await pool.query(
      `INSERT INTO categories (name, description) 
       VALUES ('Electronics', 'Electronic products') 
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`
    );
    const electronicsId = electronicsResult.rows[0].id;

    const furnitureResult = await pool.query(
      `INSERT INTO categories (name, description) 
       VALUES ('Furniture', 'Furniture items') 
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`
    );
    const furnitureId = furnitureResult.rows[0].id;
    console.log('✅ Categories ready');

    // Get or create a system user for transactions
    console.log('👤 Getting system user...');
    let userId;
    const userResult = await pool.query(`SELECT id FROM users LIMIT 1`);
    if (userResult.rows.length > 0) {
      userId = userResult.rows[0].id;
      console.log(`✅ Using existing user ID: ${userId}`);
    } else {
      // Create a system user if no users exist
      const newUserResult = await pool.query(
        `INSERT INTO users (email, name, password, role) 
         VALUES ('system@optiplatform.com', 'System', 'N/A', 'admin') 
         RETURNING id`
      );
      userId = newUserResult.rows[0].id;
      console.log(`✅ Created system user ID: ${userId}`);
    }

    // Create products with different health profiles
    console.log('📦 Creating products...');
    const productsData = [
      // Excellent Health Products
      ['Premium Laptop', 'TECH-001', 'High-performance laptop with excellent sales', electronicsId, 'pcs', 20, 999.99, 1299.99, 'USD'],
      ['Wireless Mouse', 'TECH-002', 'Ergonomic wireless mouse with steady demand', electronicsId, 'pcs', 50, 19.99, 29.99, 'USD'],
      // Good Health Products
      ['Office Chair', 'FURN-001', 'Comfortable office chair with moderate sales', furnitureId, 'pcs', 15, 199.99, 299.99, 'USD'],
      ['Standing Desk', 'FURN-002', 'Adjustable standing desk', furnitureId, 'pcs', 10, 399.99, 599.99, 'USD'],
      // Warning - Low Stock Products
      ['Mechanical Keyboard', 'TECH-003', 'RGB mechanical keyboard - running low!', electronicsId, 'pcs', 15, 99.99, 149.99, 'USD'],
      ['Monitor Stand', 'FURN-003', 'Adjustable monitor stand - low stock', furnitureId, 'pcs', 10, 49.99, 79.99, 'USD'],
      // Critical - Multiple Issues
      ['USB Cable', 'TECH-004', 'USB-C cable - critical stock level with declining sales', electronicsId, 'pcs', 20, 8.99, 12.99, 'USD'],
      ['Desk Lamp', 'FURN-004', 'LED desk lamp - overstocked, slow moving', furnitureId, 'pcs', 10, 29.99, 49.99, 'USD'],
    ];

    const createdProducts = [];
    for (const productData of productsData) {
      const result = await pool.query(
        `INSERT INTO products (name, sku, description, category_id, unit, restock_threshold, purchase_price, sale_price, currency)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name
         RETURNING id, name, sku`,
        productData
      );
      createdProducts.push(result.rows[0]);
    }
    console.log(`✅ Created ${createdProducts.length} products`);

    // Generate transaction history for each product
    console.log('📊 Generating transaction history...');
    const now = new Date();
    let totalTransactions = 0;

    for (const product of createdProducts) {
      const transactions = [];

      // Generate transactions based on product health profile
      if (product.sku === 'TECH-001' || product.sku === 'TECH-002') {
        // Excellent health - consistent high sales
        for (let i = 90; i >= 0; i -= 3) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          transactions.push([
            product.id,
            userId,
            Math.floor(Math.random() * 5) + 8, // 8-12 units
            'sale',
            'completed',
            date,
            'Regular sale',
          ]);
        }
      } else if (product.sku === 'FURN-001' || product.sku === 'FURN-002') {
        // Good health - moderate sales
        for (let i = 90; i >= 0; i -= 5) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          transactions.push([
            product.id,
            userId,
            Math.floor(Math.random() * 3) + 2, // 2-4 units
            'sale',
            'completed',
            date,
            'Regular sale',
          ]);
        }
      } else if (product.sku === 'TECH-003' || product.sku === 'FURN-003') {
        // Warning - decent sales but low stock
        for (let i = 90; i >= 0; i -= 4) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          transactions.push([
            product.id,
            userId,
            Math.floor(Math.random() * 4) + 3, // 3-6 units
            'sale',
            'completed',
            date,
            'Regular sale',
          ]);
        }
      } else if (product.sku === 'TECH-004') {
        // Critical - declining sales
        for (let i = 90; i >= 30; i -= 3) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const quantity = Math.max(1, Math.floor(Math.random() * 5) + 5 - Math.floor(i / 15)); // Declining
          transactions.push([
            product.id,
            userId,
            quantity,
            'sale',
            'completed',
            date,
            'Declining sales',
          ]);
        }
        // Recent: very few sales
        for (let i = 25; i >= 0; i -= 8) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          transactions.push([
            product.id,
            userId,
            1,
            'sale',
            'completed',
            date,
            'Slow moving',
          ]);
        }
      } else if (product.sku === 'FURN-004') {
        // Critical - overstocked, slow moving
        for (let i = 90; i >= 0; i -= 10) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          transactions.push([
            product.id,
            userId,
            Math.floor(Math.random() * 2) + 1, // 1-2 units
            'sale',
            'completed',
            date,
            'Slow sale',
          ]);
        }
      }

      // Add some restocking transactions
      if (transactions.length > 0) {
        const midPoint = Math.floor(transactions.length / 2);
        const restockDate = new Date(now);
        restockDate.setDate(restockDate.getDate() - 45);
        transactions.splice(midPoint, 0, [
          product.id,
          userId,
          product.sku.includes('TECH') ? 50 : 30,
          'purchase',
          'completed',
          restockDate,
          'Regular restock',
        ]);
      }

      // Insert all transactions for this product
      for (const txn of transactions) {
        await pool.query(
          `INSERT INTO inventory_transactions 
           (product_id, user_id, quantity, transaction_type, status, occurred_at, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          txn
        );
      }

      totalTransactions += transactions.length;
      console.log(`  ✅ Created ${transactions.length} transactions for ${product.name}`);
    }

    console.log('\n🎉 Analytics data seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - ${createdProducts.length} products created`);
    console.log(`   - ${totalTransactions} transactions created`);
    console.log('   - Products with excellent health: TECH-001, TECH-002');
    console.log('   - Products with good health: FURN-001, FURN-002');
    console.log('   - Products with warnings: TECH-003, FURN-003');
    console.log('   - Products with critical issues: TECH-004, FURN-004');
    console.log('\n💡 You can now test the ML Analytics feature!');
    console.log('   Run: cd server && npm run start:dev');
    console.log('   Then visit: http://localhost:3001/graphql');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    await pool.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the seeding function
seedAnalyticsData().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
