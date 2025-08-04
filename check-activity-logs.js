import { Client } from 'pg';

async function checkActivityLogsSchema() {
  const client = new Client({
    connectionString: process.env.DB_URL || 'postgresql://postgres.eljsjkxwgwolpdaamsev:Terra254$@aws-0-eu-west-2.pooler.supabase.com:5432/postgres'
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check table structure for activity_logs
    const tableInfo = await client.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'activity_logs' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    console.log('Activity_logs table structure:');
    tableInfo.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type}${row.character_maximum_length ? `(${row.character_maximum_length})` : ''} ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

  } catch (error) {
    console.error('Query failed:', error);
  } finally {
    await client.end();
  }
}

checkActivityLogsSchema();
