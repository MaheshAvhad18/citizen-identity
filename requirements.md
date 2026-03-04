# Secure Identity System — Setup & Requirements

A step-by-step guide to run the Secure Identity Verification portal on **Windows**, **macOS**, and **Linux**.

---

## ✅ Prerequisites

| Software      | Version   | Purpose                                |
|---------------|-----------|----------------------------------------|
| **Node.js**   | v18+      | Backend server & dependency management |
| **npm**       | v9+       | Package manager (comes with Node.js)   |
| **MySQL**     | v8.0+     | Relational database for all app data   |
| **Git**       | Any       | Clone the repository (optional)        |

---

## 📦 Project Structure

```
verification/
├── .env                    # Environment variables (DB credentials, port)
├── package.json            # Node dependencies & scripts
├── index.html              # Login page
├── dashboard.html          # Main dashboard
├── documents.html          # Document management
├── kyc.html                # KYC verification
├── access-requests.html    # Access & consent management
├── esign.html              # e-Sign records
├── notifications.html      # Notification center
├── audit-log.html          # Authentication log
├── admin.html              # Admin panel
├── app.js                  # Shared frontend utilities
├── db.js                   # Database bootstrap script
├── css/
│   └── style.css           # Global stylesheet
└── server/
    ├── server.js            # Express.js backend
    ├── db/
    │   ├── pool.js          # MySQL connection pool
    │   ├── schema.mysql.sql # Database schema (DDL)
    │   └── seed.js          # Demo seed data
    └── scripts/
        └── init-db.js       # Database initialization script
```

---

## 🪟 Windows Setup

### Option A: MySQL installed directly on Windows

#### Using **PowerShell** or **Command Prompt**

```powershell
# 1. Clone the repository (if not already done)
git clone <repository-url>
cd verification

# 2. Install Node.js dependencies
npm install

# 3. Start MySQL (if installed as a Windows service)
#    Open Services (Win + R → services.msc) and start "MySQL80" or "MySQL"
#    OR use the command line:
net start MySQL80

# 4. Create the database and user in MySQL
#    Open a MySQL shell:
mysql -u root -p
```

```sql
-- Run these SQL commands in the MySQL shell:
CREATE DATABASE IF NOT EXISTS secure_identity_system;
CREATE USER IF NOT EXISTS 'nodeuser'@'%' IDENTIFIED BY 'NodeUser@123';
GRANT ALL PRIVILEGES ON secure_identity_system.* TO 'nodeuser'@'%';
FLUSH PRIVILEGES;
EXIT;
```

```powershell
# 5. Configure environment variables
#    Edit the .env file and set:
#    MYSQL_HOST=127.0.0.1
#    MYSQL_PORT=3306
#    MYSQL_USER=nodeuser
#    MYSQL_PASSWORD=NodeUser@123
#    MYSQL_DATABASE=secure_identity_system

# 6. Initialize the database (creates tables + inserts demo data)
npm run init-db

# 7. Start the server
npm start
```

#### Using **Git Bash** on Windows

```bash
# 1. Navigate to project folder
cd /c/path/to/verification

# 2. Install dependencies
npm install

# 3. Start MySQL service (requires admin Git Bash)
net start MySQL80

# 4. Create database and user (same SQL as above)
mysql -u root -p

# 5. Initialize database
npm run init-db

# 6. Start server
npm start
```

---

### Option B: MySQL installed in WSL (Windows Subsystem for Linux)

This is useful when MySQL is installed inside your WSL (Ubuntu/Debian) environment but Node.js runs on Windows.

#### Step 1 — Start MySQL inside WSL

```powershell
# From PowerShell or Command Prompt:
wsl sudo service mysql start
```

Or open your **WSL terminal** directly and run:

```bash
sudo service mysql start
```

#### Step 2 — Create the database and user (inside WSL)

```bash
# Open WSL terminal
sudo mysql -u root
```

```sql
CREATE DATABASE IF NOT EXISTS secure_identity_system;
CREATE USER IF NOT EXISTS 'nodeuser'@'%' IDENTIFIED BY 'NodeUser@123';
GRANT ALL PRIVILEGES ON secure_identity_system.* TO 'nodeuser'@'%';
FLUSH PRIVILEGES;
EXIT;
```

#### Step 3 — Find the WSL IP address

```powershell
# From PowerShell:
wsl hostname -I
```

This will print something like `192.168.x.x`. Copy the first IP address.

#### Step 4 — Update .env with WSL IP

Edit the `.env` file in the project root:

```env
PORT=3000
SESSION_SECRET=change-this-secret

MYSQL_HOST=192.168.x.x    # ← Replace with your WSL IP from Step 3
MYSQL_PORT=3306
MYSQL_USER=nodeuser
MYSQL_PASSWORD=NodeUser@123
MYSQL_DATABASE=secure_identity_system
```

> ⚠️ **Note:** The WSL IP address can change on every reboot. If the app
> suddenly can't connect, re-run `wsl hostname -I` and update `.env`.

#### Step 5 — Ensure MySQL allows external connections (inside WSL)

```bash
# Check bind-address in MySQL config:
grep bind-address /etc/mysql/mysql.conf.d/mysqld.cnf

# It should say:  bind-address = 0.0.0.0
# If it says 127.0.0.1, edit the file:
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
# Change:  bind-address = 127.0.0.1
# To:      bind-address = 0.0.0.0
# Save and restart MySQL:
sudo service mysql restart
```

#### Step 6 — Initialize and run (from PowerShell / CMD)

```powershell
cd C:\path\to\verification

# Install dependencies (first time only)
npm install

# Initialize database schema and seed data
npm run init-db

# Start the server
npm start
```

---

## 🍎 macOS Setup

### Using **Terminal** (Zsh/Bash)

#### Step 1 — Install prerequisites

```bash
# Install Node.js (using Homebrew)
brew install node

# Install MySQL
brew install mysql

# Start MySQL service
brew services start mysql
```

#### Step 2 — Create database and user

```bash
mysql -u root
```

```sql
CREATE DATABASE IF NOT EXISTS secure_identity_system;
CREATE USER IF NOT EXISTS 'nodeuser'@'localhost' IDENTIFIED BY 'NodeUser@123';
GRANT ALL PRIVILEGES ON secure_identity_system.* TO 'nodeuser'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### Step 3 — Configure, initialize, and run

```bash
# Navigate to project
cd /path/to/verification

# Install dependencies
npm install

# Make sure .env has these values:
# MYSQL_HOST=127.0.0.1
# MYSQL_PORT=3306
# MYSQL_USER=nodeuser
# MYSQL_PASSWORD=NodeUser@123
# MYSQL_DATABASE=secure_identity_system

# Initialize database
npm run init-db

# Start the server
npm start
```

---

## 🐧 Linux Setup (Ubuntu / Debian)

### Using **Terminal** (Bash)

#### Step 1 — Install prerequisites

```bash
# Update package lists
sudo apt update

# Install Node.js (v18+ via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MySQL server
sudo apt install -y mysql-server

# Start and enable MySQL
sudo systemctl start mysql
sudo systemctl enable mysql
```

#### Step 2 — Create database and user

```bash
sudo mysql
```

```sql
CREATE DATABASE IF NOT EXISTS secure_identity_system;
CREATE USER IF NOT EXISTS 'nodeuser'@'localhost' IDENTIFIED BY 'NodeUser@123';
GRANT ALL PRIVILEGES ON secure_identity_system.* TO 'nodeuser'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### Step 3 — Configure, initialize, and run

```bash
# Navigate to project
cd /path/to/verification

# Install dependencies
npm install

# Ensure .env is configured (defaults should work for local MySQL):
# MYSQL_HOST=127.0.0.1
# MYSQL_PORT=3306
# MYSQL_USER=nodeuser
# MYSQL_PASSWORD=NodeUser@123
# MYSQL_DATABASE=secure_identity_system

# Initialize database (creates tables + inserts demo data)
npm run init-db

# Start the server
npm start
```

---

## 🐧 Linux Setup (Fedora / RHEL / CentOS)

### Using **Terminal** (Bash)

```bash
# Install Node.js
sudo dnf install -y nodejs

# Install MySQL
sudo dnf install -y mysql-server

# Start MySQL
sudo systemctl start mysqld
sudo systemctl enable mysqld

# Create database and user (same SQL as Ubuntu section above)
sudo mysql

# Then follow the same steps: npm install → npm run init-db → npm start
```

---

## 🚀 Running the Application

After setup is complete on any OS:

```bash
# Initialize database (first time or to reset demo data)
npm run init-db

# Start the server
npm start
```

The application will be available at: **http://localhost:3000**

---

## 🔑 Demo Login Credentials

| Username   | Password  | Role         |
|------------|-----------|--------------|
| `arjun95`  | `demo123` | Citizen      |
| `priya98`  | `demo123` | Citizen      |
| `rahul92`  | `demo123` | Citizen      |
| `sneha99`  | `demo123` | Citizen      |
| `aman90`   | `demo123` | Citizen      |

---

## 🛠️ NPM Scripts Reference

| Command            | Description                                        |
|--------------------|----------------------------------------------------|
| `npm install`      | Install all Node.js dependencies                   |
| `npm run init-db`  | Create tables + seed demo data (resets existing)    |
| `npm start`        | Start the Express.js server on port 3000            |

---

## ⚙️ Environment Variables (.env)

| Variable          | Default                    | Description                      |
|-------------------|----------------------------|----------------------------------|
| `PORT`            | `3000`                     | Server port                      |
| `SESSION_SECRET`  | `change-this-secret`       | Session encryption secret        |
| `MYSQL_HOST`      | `127.0.0.1`                | MySQL server hostname/IP         |
| `MYSQL_PORT`      | `3306`                     | MySQL server port                |
| `MYSQL_USER`      | `nodeuser`                 | MySQL username                   |
| `MYSQL_PASSWORD`  | `NodeUser@123`             | MySQL password                   |
| `MYSQL_DATABASE`  | `secure_identity_system`   | Database name                    |

---

## ❓ Troubleshooting

### `ECONNREFUSED 127.0.0.1:3306`
- **Cause:** MySQL is not running or not accessible on that address.
- **Fix:** Start MySQL (`sudo service mysql start` on Linux/WSL, `brew services start mysql` on macOS, or start the MySQL service on Windows).
- **WSL users:** Update `MYSQL_HOST` in `.env` to the WSL IP (`wsl hostname -I`).

### `Access denied for user 'nodeuser'`
- **Cause:** The user doesn't exist or password is wrong.
- **Fix:** Re-create the user using the SQL commands in the setup steps above.

### `Unknown database 'secure_identity_system'`
- **Cause:** The database hasn't been created yet.
- **Fix:** Run `CREATE DATABASE secure_identity_system;` in MySQL, then run `npm run init-db`.

### `EADDRINUSE: address already in use :::3000`
- **Cause:** Another process is using port 3000.
- **Fix (Windows):** `Get-NetTCPConnection -LocalPort 3000 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }`
- **Fix (macOS/Linux):** `lsof -ti:3000 | xargs kill -9`

### WSL IP keeps changing
- **Cause:** WSL2 assigns a dynamic IP on each boot.
- **Fix:** Re-run `wsl hostname -I` and update `.env` with the new IP after every reboot.
