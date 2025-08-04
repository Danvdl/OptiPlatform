import { Client } from 'pg';

async function checkUsers() {
  const client = new Client({
    connectionString: process.env.DB_URL || 'postgresql://postgres.eljsjkxwgwolpdaamsev:Terra254$@aws-0-eu-west-2.pooler.supabase.com:5432/postgres'
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check if users exist
    const result = await client.query('SELECT id, username, email, role, status FROM users ORDER BY id');
    console.log('Users in database:', result.rows);

    // Check table structure
    const tableInfo = await client.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    console.log('\nUsers table structure:');
    tableInfo.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type}${row.character_maximum_length ? `(${row.character_maximum_length})` : ''} ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

  } catch (error) {
    console.error('Query failed:', error);
  } finally {
    await client.end();
  }
}

checkUsers();
