const { Pool } = require('pg');
require('dotenv').config();

async function checkExistingAdmin() {
  const pool = new Pool({
    connectionString: process.env.DB_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('🔍 Checking existing admin user...\n');
    
    const result = await pool.query(`
      SELECT id, username, email, password, role, first_name, last_name
      FROM users 
      WHERE username = 'admin' OR email LIKE '%admin%'
    `);
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('👤 Existing admin user found:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: "${user.role}" (${typeof user.role})`);
      console.log(`   Name: ${user.first_name} ${user.last_name}`);
      console.log(`   Has password: ${user.password ? 'Yes' : 'No'}`);
      
      console.log('\n🔑 You can try logging in with:');
      console.log(`   Username: ${user.username}`);
      console.log(`   Email: ${user.email}`);
      console.log('   Password: [unknown - try common passwords like "admin", "password", "admin123"]');
      
    } else {
      console.log('❌ No admin user found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkExistingAdmin();
