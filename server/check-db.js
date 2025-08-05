const { Pool } = require('pg');
const bcrypt = require('bcrypt')    if (newUser.rows.length > 0) {
      console.log('👤 User details:');
      const user = newUser.rows[0];
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Name: ${user.first_name} ${user.last_name}`);
    }{ v4: uuidv4 } = require('uuid');
require('dotenv').config();

async function createAdminUser() {
  const pool = new Pool({
    connectionString: process.env.DB_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('🔍 Checking users table structure first...');
    
    const schemaResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('👤 Users table columns:');
    schemaResult.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`);
    });
    
    console.log('\n🔍 Creating new admin user...');
    
    // Generate admin user details
    const adminEmail = 'admin@test.com';
    const adminPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const userId = uuidv4();
    
    // Check if admin user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [adminEmail]
    );
    
    if (existingUser.rows.length > 0) {
      console.log('⚠️  Admin user already exists with email:', adminEmail);
      console.log('🔑 You can login with:');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
      return;
    }
    
    // Create admin user
    await pool.query(`
      INSERT INTO users (id, email, encrypted_password, role, first_name, last_name, created_at, updated_at)
      VALUES ($1, $2, $3, 'ADMIN', 'Test', 'Admin', NOW(), NOW())
    `, [userId, adminEmail, hashedPassword]);
    
    console.log('✅ Admin user created successfully!');
    console.log('🔑 Login credentials:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    
    // Verify the user was created
    const newUser = await pool.query(
      'SELECT id, email, role, first_name, last_name FROM users WHERE email = $1',
      [adminEmail]
    );
    
    if (newUser.rows.length > 0) {
      console.log('� User details:');
      const user = newUser.rows[0];
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Name: ${user.first_name} ${user.last_name}`);
      console.log(`   Active: ${user.is_active}`);
    }
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  } finally {
    await pool.end();
  }
}

createAdminUser();
