require('dotenv').config();

const { Pool } = require('pg');
const { createApp } = require('./app');
const { PostgresRepository } = require('./repositories/postgresRepository');

function createRepository() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  return new PostgresRepository(pool);
}

function start() {
  const repository = createRepository();
  const app = createApp(repository);
  const port = Number(process.env.PORT || 3000);

  return app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

if (require.main === module) {
  try {
    start();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = {
  createRepository,
  start
};
