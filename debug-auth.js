import { Client } from 'pg';

async function debugAuth() {
  const client = new Client({
    connectionString: process.env.DB_URL || 'postgresql://postgres.eljsjkxwgwolpdaamsev:Terra254$@aws-0-eu-west-2.pooler.supabase.com:5432/postgres'
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check all tables that might contain users
    const tables = await client.query(`
      SELECT table_name, table_schema 
      FROM information_schema.tables 
      WHERE table_name LIKE '%user%' 
      ORDER BY table_schema, table_name
    `);
    console.log('Tables containing "user":', tables.rows);

    // Check the specific users table and its data
    console.log('\n--- Checking main users table ---');
    const users = await client.query('SELECT id, username, email, role, status, length(password) as pwd_length FROM users LIMIT 5');
    console.log('Users:', users.rows);

    // Check if there's an auth.users table (Supabase default)
    try {
      const authUsers = await client.query('SELECT id, email, encrypted_password FROM auth.users LIMIT 5');
      console.log('\n--- Auth.users table found ---');
      console.log('Auth users:', authUsers.rows);
    } catch (error) {
      console.log('\n--- No auth.users table found ---');
    }

  } catch (error) {
    console.error('Query failed:', error);
  } finally {
    await client.end();
  }
}

debugAuth();
