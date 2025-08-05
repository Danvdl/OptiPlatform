const { Pool } = require('pg');
require('dotenv').config();

async function inspectUsers() {
  const pool = new Pool({
    connectionString: process.env.DB_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('🔍 Inspecting all users in the database...\n');
    
    // Get all users
    const result = await pool.query(`
      SELECT id, username, email, role, first_name, last_name, created_at
      FROM users 
      ORDER BY id
    `);
    
    console.log(`📊 Total users found: ${result.rows.length}\n`);
    
    if (result.rows.length === 0) {
      console.log('❌ No users found in the database!');
    } else {
      console.log('👥 All users:');
      result.rows.forEach((user, index) => {
        console.log(`\n${index + 1}. User ID: ${user.id}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Name: ${user.first_name} ${user.last_name}`);
        console.log(`   Created: ${user.created_at}`);
      });
    }
    
    // Check specifically for admin@test.com
    console.log('\n🔍 Checking specifically for admin@test.com...');
    const adminCheck = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      ['admin@test.com']
    );
    
    if (adminCheck.rows.length > 0) {
      console.log('✅ Found admin@test.com:');
      console.log(adminCheck.rows[0]);
    } else {
      console.log('❌ No user found with email admin@test.com');
    }
    
    // Check for users with ADMIN role
    console.log('\n🔍 Checking for users with ADMIN role...');
    const adminRoleCheck = await pool.query(
      'SELECT * FROM users WHERE role = $1',
      ['ADMIN']
    );
    
    if (adminRoleCheck.rows.length > 0) {
      console.log(`✅ Found ${adminRoleCheck.rows.length} user(s) with ADMIN role:`);
      adminRoleCheck.rows.forEach(user => {
        console.log(`   - ${user.username} (${user.email})`);
      });
    } else {
      console.log('❌ No users found with ADMIN role');
    }
    
  } catch (error) {
    console.error('❌ Error inspecting users:', error.message);
  } finally {
    await pool.end();
  }
}

inspectUsers();
