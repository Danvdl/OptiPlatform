import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  // Create database client using the same connection string as the app
  const client = new Client({
    connectionString: process.env.DB_URL || 'postgresql://postgres.eljsjkxwgwolpdaamsev:Terra254$@aws-0-eu-west-2.pooler.supabase.com:5432/postgres'
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Read the migration file
    const migrationPath = path.join(__dirname, 'database', 'migrations', '001_user_management_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running user management migration...');
    await client.query(migrationSQL);
    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

runMigration();
