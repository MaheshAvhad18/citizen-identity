const mysql = require('mysql2/promise');

function getEnv(name, fallback) {
  const v = process.env[name];
  return v === undefined || v === '' ? fallback : v;
}

const pool = mysql.createPool({
  host: getEnv('MYSQL_HOST', '127.0.0.1'),
  port: Number(getEnv('MYSQL_PORT', 3306)),
  user: getEnv('MYSQL_USER', 'root'),
  password: getEnv('MYSQL_PASSWORD', ''),
  database: getEnv('MYSQL_DATABASE', 'secure_identity_system'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // IMPORTANT: keep false for safety; frontend uses prepared params.
  multipleStatements: false,
});

module.exports = { pool };

