const { Pool } = require('pg');
require('dotenv').config();

async function fixUserRoles() {
  const pool = new Pool({
    connectionString: process.env.DB_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('🔧 Fixing user roles to match frontend enum values...\n');
    
    // Update roles to lowercase
    const updateResult = await pool.query(`
      UPDATE users 
      SET role = CASE 
        WHEN role = 'ADMIN' THEN 'admin'
        WHEN role = 'MANAGER' THEN 'manager'
        WHEN role = 'STAFF' THEN 'staff'
        ELSE LOWER(role)
      END
      WHERE role IN ('ADMIN', 'MANAGER', 'STAFF') 
         OR role != LOWER(role)
    `);
    
    console.log(`✅ Updated ${updateResult.rowCount} user role(s)`);
    
    // Verify the changes
    const result = await pool.query(`
      SELECT id, username, email, role, first_name, last_name
      FROM users 
      ORDER BY id
    `);
    
    console.log('\n👥 Updated users:');
    result.rows.forEach((user, index) => {
      console.log(`\n${index + 1}. User ID: ${user.id}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: "${user.role}" ✅`);
      console.log(`   Name: ${user.first_name} ${user.last_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error fixing user roles:', error.message);
  } finally {
    await pool.end();
  }
}

fixUserRoles();
