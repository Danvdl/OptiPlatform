// Debug script to check what UserService returns
// This should be run as a NestJS console command, but we'll simulate it

const { Pool } = require('pg');
require('dotenv').config();

async function debugUserService() {
  const pool = new Pool({
    connectionString: process.env.DB_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('🔍 Direct database query for admin user...\n');
    
    const result = await pool.query(`
      SELECT id, username, email, role, first_name, last_name, status
      FROM users 
      WHERE username = 'admin'
    `);
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('📊 Raw database result:');
      console.log('  ID:', user.id, typeof user.id);
      console.log('  Username:', user.username, typeof user.username);
      console.log('  Email:', user.email, typeof user.email);
      console.log('  Role:', `"${user.role}"`, typeof user.role);
      console.log('  Status:', `"${user.status}"`, typeof user.status);
      console.log('  First Name:', user.first_name, typeof user.first_name);
      console.log('  Last Name:', user.last_name, typeof user.last_name);
      
      console.log('\n🔤 Role comparison:');
      console.log('  Database role:', `"${user.role}"`);
      console.log('  Expected admin:', '"admin"');
      console.log('  Matches admin:', user.role === 'admin');
      console.log('  Role length:', user.role.length);
      console.log('  Role char codes:', Array.from(user.role).map(c => c.charCodeAt(0)));
      
    } else {
      console.log('❌ No admin user found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

debugUserService();
