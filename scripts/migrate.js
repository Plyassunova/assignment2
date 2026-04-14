require('dotenv').config();

const fs = require('fs/promises');
const path = require('path');
const { Client } = require('pg');

function splitSqlStatements(sql) {
  return sql
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean);
}

async function getMigrationFiles() {
  const migrationsDirectory = path.resolve(__dirname, '..', 'db', 'migrations');
  const entries = await fs.readdir(migrationsDirectory, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.sql'))
    .map((entry) => path.join(migrationsDirectory, entry.name))
    .sort();
}

async function run() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }

  const migrationFiles = await getMigrationFiles();

  if (migrationFiles.length === 0) {
    console.log('No migration files found.');
    return;
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();
    await client.query('BEGIN');

    for (const migrationFile of migrationFiles) {
      const sql = await fs.readFile(migrationFile, 'utf8');
      const statements = splitSqlStatements(sql);

      for (const statement of statements) {
        await client.query(statement);
      }

      console.log(`Applied migration: ${path.basename(migrationFile)}`);
    }

    await client.query('COMMIT');
    console.log('Migrations completed successfully.');
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Rollback failed:', rollbackError.message);
    }

    throw error;
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
