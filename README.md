# Secure System Identity Verification (MySQL DBMS Project)

Full-stack **Secure Identity Verification** portal demonstrating a DBMS pipeline using a real **MySQL** database with a Node/Express backend.

## Features (DBMS Operations Covered)

- **12 relational tables**: Citizen, Accounts, Issuers, Documents, KYC, Access Requests, Auth Logs, e-Sign, Notifications, Share Logs
- **CREATE TABLE**: MySQL schema in `server/db/schema.mysql.sql`
- **INSERT**: upload documents, submit KYC, sign documents, add requester org (Admin)
- **SELECT \***: list tables across pages
- **SELECT with WHERE**: filter by type/status/channel/method
- **SELECT with LIKE**: search uploaded documents by name
- **SELECT with JOIN**: access requests (org + document), e-sign (document name), share logs (document + requester)
- **SELECT with GROUP BY (Aggregate)**: failed/blocked login attempts per account (`audit-log.html`)
- **ORDER BY**: sorting in lists
- **UPDATE**: approve/reject access requests, mark notification read, revoke e-sign, update KYC status, approve org
- **DELETE**: delete uploaded documents, delete notifications
- **Subquery / NOT EXISTS**: find unsigned documents (e-sign page)
- **COUNT / SUM**: dashboard stats (documents count, pending requests, storage usage)

## Tech Stack

- **MySQL** (database)
- **Node.js + Express** (backend server)
- **mysql2** (MySQL driver)
- **express-session** (demo auth session)
- **Chart.js** (dashboard chart) loaded via CDN in `dashboard.html`
- HTML + CSS + Vanilla JS (ES modules)

## Project Pages

- `index.html` — Landing / Login (demo)
- `dashboard.html` — Stats + chart + recent activity
- `documents.html` — Issued vs Uploaded docs (CRUD + filter + search)
- `kyc.html` — KYC submission + status updates
- `access-requests.html` — Consent approve/reject + history (JOIN)
- `esign.html` — e-sign list + sign + revoke + certificate details
- `notifications.html` — Inbox + mark read + delete
- `audit-log.html` — Timeline + aggregates (GROUP BY)
- `admin.html` — Issuer/Requester org management + share logs (JOIN) + DB reset

## Database Notes (Important)

- The schema is in **`server/db/schema.mysql.sql`**.
- The seed script is in **`server/db/seed.js`** (passwords are bcrypt-hashed).
- To create tables + insert demo data, run: `npm run init-db`
- To restore the original seed data at any time, open **Admin Panel** (`admin.html`) and click **Reset Demo DB** (this resets MySQL tables).

## How to Run (Windows)

### Prerequisites

- **MySQL Server** running (MySQL 8.x recommended)
- **Node.js** installed

### Step 1 — Create a database

Create a database (example name used by default):

```sql
CREATE DATABASE secure_identity_system;
```

### Step 2 — Configure environment variables

1. Copy `.env.example` to `.env`
2. Fill in your MySQL connection details:
   - `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`

### Step 3 — Install dependencies

From the project folder:

```bash
npm install
```

### Step 4 — Initialize schema + seed data

```bash
npm run init-db
```

### Step 5 — Start the server

```bash
npm start
```

Open the app:

- `http://localhost:3000/index.html`

## Demo Login Credentials

All demo users share the same password:

- **Username**: `arjun95` (or `priya98`, `rahul92`, `sneha99`, `aman90`)
- **Password**: `demo123`

### Internet Requirement

The project loads **Chart.js from a CDN**, so you need an internet connection unless you vendor it locally.

## Folder Structure

```
verification/
├── index.html
├── dashboard.html
├── documents.html
├── kyc.html
├── access-requests.html
├── esign.html
├── notifications.html
├── admin.html
├── audit-log.html
├── db.js
├── app.js
├── server/
│   ├── server.js
│   ├── db/
│   │   ├── pool.js
│   │   ├── schema.mysql.sql
│   │   └── seed.js
│   └── scripts/
│       └── init-db.js
└── css/
    └── style.css
```

## Demo Walkthrough (Quick)

1. **Login** (`index.html`) → opens dashboard (demo redirect)
2. **Dashboard**: show `COUNT`/`SUM` stats + Chart.js doc-type chart
3. **Documents**: search (LIKE), filter (WHERE), add (INSERT), delete (DELETE)
4. **KYC**: submit new KYC (INSERT), update status (UPDATE)
5. **Access Requests**: approve/reject (UPDATE), show JOIN results
6. **e-Sign**: sign a doc (INSERT), revoke (UPDATE), view certificate modal
7. **Notifications**: mark read (UPDATE), delete (DELETE)
8. **Audit Log**: filter timeline (WHERE), failed logins per account (GROUP BY)
9. **Admin**: approve organizations (UPDATE), add requester org (INSERT), share log JOIN, reset DB

