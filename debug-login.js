import { Client } from 'pg';
import bcrypt from 'bcrypt';

async function debugLogin() {
  const client = new Client({
    connectionString: process.env.DB_URL || 'postgresql://postgres.eljsjkxwgwolpdaamsev:Terra254$@aws-0-eu-west-2.pooler.supabase.com:5432/postgres'
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Simulate the exact query that TypeORM would make
    console.log('Looking for user with username "admin"...');
    const result = await client.query('SELECT * FROM public.users WHERE username = $1', ['admin']);
    
    if (result.rows.length === 0) {
      console.log('No user found with username "admin"');
      return;
    }

    const user = result.rows[0];
    console.log('User found:', {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      password_length: user.password ? user.password.length : 'null'
    });

    // Test password comparison
    console.log('Testing password "admin123"...');
    const isMatch = await bcrypt.compare('admin123', user.password);
    console.log('Password matches:', isMatch);

    if (isMatch) {
      console.log('Login should succeed!');
      const { password, ...result } = user;
      console.log('User object to return:', result);
    } else {
      console.log('Password does not match - login will fail');
    }

  } catch (error) {
    console.error('Debug failed:', error);
  } finally {
    await client.end();
  }
}

debugLogin();
