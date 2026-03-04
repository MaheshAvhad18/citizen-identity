require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { pool } = require('../db/pool');
const { truncateAll, seedAll } = require('../db/seed');

async function runSchema() {
  const schemaPath = path.join(__dirname, '..', 'db', 'schema.mysql.sql');
  const raw = fs.readFileSync(schemaPath, 'utf8');
  const sql = raw.replace(/^\s*--.*$/gm, '').trim();

  // Execute each statement; keep it simple (schema has no complex delimiters)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(Boolean)
    ;

  for (const stmt of statements) {
    await pool.query(stmt);
  }
}

async function main() {
  try {
    console.log('Initializing MySQL schema...');
    await runSchema();
    console.log('Truncating and seeding tables...');
    await truncateAll(pool);
    const info = await seedAll(pool);
    console.log('Done.');
    console.log('Demo login:');
    for (const u of info.demoUsers) {
      console.log(`- ${u.username} / ${u.password}`);
    }
  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

