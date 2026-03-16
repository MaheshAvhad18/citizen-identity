require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const { pool } = require('./db/pool');
const { truncateAll, seedAll } = require('./db/seed');

const app = express();

app.use(express.json({ limit: '1mb' }));

app.use(
  session({
    name: 'sid',
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
    },
  })
);

function requireAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  res.status(401).json({ error: 'Not authenticated' });
}

// --- Auth routes ---
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const [rows] = await pool.execute(
    `SELECT account_id, citizen_id, username, password_hash
     FROM DIGITAL_ACCOUNT
     WHERE username = ?
     LIMIT 1`,
    [username]
  );

  const account = rows && rows[0];
  const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';
  const deviceInfo = req.headers['user-agent'] || 'Unknown';

  if (!account || !account.password_hash) {
    // We cannot log the failure against an account if the account does not exist.
    // However, if we want to log somewhere else, we could.
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const accountId = account.account_id;
  const ok = await bcrypt.compare(password, account.password_hash);

  if (!ok) {
    // Record failed auth
    await pool.execute(
      `INSERT INTO AUTHENTICATION_LOG 
       (account_id, auth_method, ip_address, device_info, location, auth_status, failure_reason)
       VALUES (?, 'Password', ?, ?, 'Unknown', 'Failed', 'Wrong password')`,
      [accountId, ipAddress, deviceInfo]
    );
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Record valid auth
  await pool.execute(
    `INSERT INTO AUTHENTICATION_LOG 
     (account_id, auth_method, ip_address, device_info, location, auth_status, failure_reason)
     VALUES (?, 'Password', ?, ?, 'Unknown', 'Success', NULL)`,
    [accountId, ipAddress, deviceInfo]
  );

  req.session.user = {
    accountId: account.account_id,
    citizenId: account.citizen_id,
    username: account.username,
  };

  res.json({ ok: true, user: req.session.user });
});

app.post('/api/auth/mock-otp', async (req, res) => {
  // Demo-only: logs in as arjun95
  const [rows] = await pool.execute(
    `SELECT account_id, citizen_id, username
     FROM DIGITAL_ACCOUNT
     WHERE username = 'arjun95'
     LIMIT 1`
  );
  const account = rows && rows[0];
  if (!account) return res.status(500).json({ error: 'Demo account missing. Run npm run init-db' });

  req.session.user = {
    accountId: account.account_id,
    citizenId: account.citizen_id,
    username: account.username,
  };
  res.json({ ok: true, user: req.session.user });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

app.get('/api/me', (req, res) => {
  res.json({ user: req.session.user || null });
});

// --- SQL proxy endpoints (keeps frontend simple for DBMS demo) ---
app.post('/api/sql/query', requireAuth, async (req, res) => {
  const { sql, params } = req.body || {};
  if (typeof sql !== 'string') return res.status(400).json({ error: 'sql must be a string' });
  if (params !== undefined && !Array.isArray(params)) return res.status(400).json({ error: 'params must be an array' });

  const user = req.session.user;
  const safeParams = Array.isArray(params) ? params : [];

  // Basic tenanting: if query references account_id and caller didn't pass it,
  // many of our pages already hardcode account_id=1. We'll not auto-mutate SQL;
  // this is a DBMS demo, not production RBAC.
  const [rows] = await pool.execute(sql, safeParams);
  res.json({ rows, accountId: user.accountId });
});

app.post('/api/sql/exec', requireAuth, async (req, res) => {
  const { sql, params } = req.body || {};
  if (typeof sql !== 'string') return res.status(400).json({ error: 'sql must be a string' });
  if (params !== undefined && !Array.isArray(params)) return res.status(400).json({ error: 'params must be an array' });

  const safeParams = Array.isArray(params) ? params : [];
  const [result] = await pool.execute(sql, safeParams);
  res.json({
    ok: true,
    affectedRows: result.affectedRows || 0,
    insertId: result.insertId || null,
  });
});

// --- Admin: reset demo DB ---
app.post('/api/admin/reset', requireAuth, async (req, res) => {
  // In a real app this would be restricted. Kept for local demo convenience.
  await truncateAll(pool);
  await seedAll(pool);
  res.json({ ok: true });
});

// --- Static files ---
app.use((req, res, next) => {
  // Prevent browsing backend code/config
  if (
    req.path.startsWith('/server') ||
    req.path.startsWith('/node_modules') ||
    req.path === '/package.json' ||
    req.path === '/package-lock.json' ||
    req.path === '/.env' ||
    req.path === '/.env.example'
  ) {
    return res.status(404).end();
  }
  next();
});

app.use(express.static(path.join(__dirname, '..')));

// Default route
app.get('/', (req, res) => {
  res.redirect('/index.html');
});

const port = Number(process.env.PORT || 3000);

app.listen(port, "0.0.0.0", () => {
  console.log(`Server running at http://localhost:${port}`);
});