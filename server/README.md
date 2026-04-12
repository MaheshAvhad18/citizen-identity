# Server Folder (Secure Identity System)

This folder contains the backend implementation for the Secure Identity System. It provides:

- HTTP APIs for authentication, session management, and a simple SQL proxy used by the frontend.
- Database connection and schema management.
- Demo database seeding for local testing.

---

## Files

### `server.js`
- **Role**: Main Express application entrypoint.
- **What it does**:
  - Loads environment variables using `dotenv`.
  - Configures JSON parsing and session middleware.
  - Implements authentication routes (`/api/auth/login`, `/api/auth/logout`, `/api/auth/mock-otp`, `/api/me`).
  - Provides a **SQL proxy** (`/api/sql/query` and `/api/sql/exec`) that the frontend uses to run parameterized SQL safely.
  - Provides an admin helper endpoint (`/api/admin/reset`) to truncate and reseed the database for demo purposes.
  - Serves static frontend files and prevents access to backend source/config.

---

### `db/pool.js`
- **Role**: MySQL connection pool configuration.
- **What it does**:
  - Reads DB connection settings from environment variables (`MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`).
  - Creates a `mysql2/promise` pool and exports it for use across the server.

---

### `db/schema.mysql.sql`
- **Role**: Database schema (DDL) for the application.
- **What it does**:
  - Defines all tables, primary keys, foreign key constraints, and default values.
  - Contains the full data model, including:
    - `CITIZEN`, `DIGITAL_ACCOUNT`, `ISSUER_ORGANIZATION`, `ISSUED_DOCUMENT`, `UPLOADED_DOCUMENT`, `REQUESTER_ORGANIZATION`, `ACCESS_REQUEST`, `AUTHENTICATION_LOG`, `E_SIGN_RECORD`, `NOTIFICATION`, `KYC_VERIFICATION`, `DOCUMENT_SHARE_LOG`.

---

### `db/seed.js`
- **Role**: Seed and reset database data for demos.
- **What it does**:
  - `truncateAll(pool)` - disables foreign key checks, truncates all tables in dependency-safe order, then re-enables checks.
  - `seedAll(pool)` - inserts demo rows for citizens, accounts, issuers, documents, requests, logs, etc.
  - Uses `bcryptjs` to hash a shared demo password, so seeded accounts can log in.

---

### `scripts/init-db.js`
- **Role**: CLI script to initialize the MySQL database schema and seed demo data.
- **What it does**:
  - Loads environment variables.
  - Reads `db/schema.mysql.sql`, strips SQL comments, and executes each statement to build the schema.
  - Calls `truncateAll()` and `seedAll()` to populate demo data.
  - Prints seeded demo user login credentials.

---

## How to use (local dev)
1. Ensure MySQL is running and accessible.
2. Set environment variables (e.g., in `.env`):
   - `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`
   - `SESSION_SECRET` (for sessions)
3. Run:
   ```bash
   npm run init-db
   npm start
   ```
4. Open `http://localhost:3000` in the browser.

---

## Notes
- The server uses a simple SQL proxy for the frontend to keep the UI code focused on DBMS concepts (query/exec patterns).
- This design is **not** suitable for production; it is intended for teaching/demo purposes.
