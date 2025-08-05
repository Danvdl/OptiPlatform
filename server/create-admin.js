const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

async function createAdminUser() {
  const pool = new Pool({
    connectionString: process.env.DB_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('🔍 Creating new admin user...');
    
    // Generate admin user details
    const adminEmail = 'admin@test.com';
    const adminPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const userId = uuidv4();
    
    // Check if admin user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [adminEmail, adminEmail.split('@')[0]]
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
      INSERT INTO users (username, email, password, role, first_name, last_name, created_at, updated_at)
      VALUES ($1, $2, $3, 'ADMIN', 'Test', 'Admin', NOW(), NOW())
    `, [adminEmail.split('@')[0], adminEmail, hashedPassword]);
    
    console.log('✅ Admin user created successfully!');
    console.log('🔑 Login credentials:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    
    // Verify the user was created
    const newUser = await pool.query(
      'SELECT id, username, email, role, first_name, last_name FROM users WHERE email = $1',
      [adminEmail]
    );
    
    if (newUser.rows.length > 0) {
      console.log('👤 User details:');
      const user = newUser.rows[0];
      console.log(`   ID: ${user.id}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Name: ${user.first_name} ${user.last_name}`);
    }
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  } finally {
    await pool.end();
  }
}

createAdminUser();
