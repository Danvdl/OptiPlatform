import { Client } from 'pg';
import bcrypt from 'bcrypt';

async function checkPassword() {
  const client = new Client({
    connectionString: process.env.DB_URL || 'postgresql://postgres.eljsjkxwgwolpdaamsev:Terra254$@aws-0-eu-west-2.pooler.supabase.com:5432/postgres'
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Get the admin user's password hash
    const result = await client.query('SELECT username, password FROM users WHERE username = $1', ['admin']);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('Admin user found:', user.username);
      console.log('Password hash:', user.password);
      
      // Test if the password matches
      const isMatch = await bcrypt.compare('admin123', user.password);
      console.log('Password matches admin123:', isMatch);
      
      // Also try comparing with the expected hash from migration
      const expectedHash = '$2b$10$rGlhNdNKmBCJKTddF7/KfuFGD0l0qHLpPHE.z.vYxOYUr9M9Lwr1O';
      console.log('Expected hash from migration:', expectedHash);
      console.log('Actual hash matches expected:', user.password === expectedHash);
    } else {
      console.log('Admin user not found');
    }

  } catch (error) {
    console.error('Query failed:', error);
  } finally {
    await client.end();
  }
}

checkPassword();
