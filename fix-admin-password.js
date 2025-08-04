import { Client } from 'pg';
import bcrypt from 'bcrypt';

async function fixAdminPassword() {
  const client = new Client({
    connectionString: process.env.DB_URL || 'postgresql://postgres.eljsjkxwgwolpdaamsev:Terra254$@aws-0-eu-west-2.pooler.supabase.com:5432/postgres'
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Generate a proper hash for admin123
    const hashedPassword = await bcrypt.hash('admin123', 10);
    console.log('Generated hash for admin123:', hashedPassword);

    // Update the admin user's password
    await client.query('UPDATE users SET password = $1 WHERE username = $2', [hashedPassword, 'admin']);
    console.log('Admin password updated successfully');

    // Verify the update
    const result = await client.query('SELECT username, password FROM users WHERE username = $1', ['admin']);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const isMatch = await bcrypt.compare('admin123', user.password);
      console.log('Password verification after update:', isMatch);
    }

  } catch (error) {
    console.error('Update failed:', error);
  } finally {
    await client.end();
  }
}

fixAdminPassword();
