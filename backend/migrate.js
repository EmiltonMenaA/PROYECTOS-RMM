require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('./db');

async function runMigration() {
  try {
    const migrationsDir = path.join(__dirname, 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.error('Migrations directory not found:', migrationsDir);
      process.exit(1);
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('No migration files found.');
      process.exit(0);
    }

    console.log('Running migrations...');
    for (const file of files) {
      const sqlPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(sqlPath, 'utf8');
      console.log(`- Applying ${file}`);
      await db.pool.query(sql);
    }

    console.log('All migrations applied successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

runMigration();
