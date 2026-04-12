# Secure Identity System (DBMS Project) – Presentation Notes

## Slide 1: What is this project? (Overview)
- **Project name**: Secure Identity System (Digital Document Wallet)
- **Purpose**: Provide a secure, auditable system to store, issue, share, and verify digital documents (IDs, certificates, KYC records, signed docs) tied to a citizen’s identity.
- **Scope for evaluation**: Backend + database design (tables, relationships, normalization, constraints, and SQL operations).

---

## Slide 2: What does it do? (Core features)
- **User registration & login** (digital account with password hashing and session authentication)
- **Citizen profile management** (Aadhaar number, personal details, KYC status)
- **Digital document issuance** (issuers can issue documents linked to an account)
- **Document upload & sharing** (users can upload documents and share with requesting organizations)
- **Access request workflow** (external organizations request access to documents; citizens grant/revoke consent)
- **Audit & logs** (authentication logs, share logs, notifications, e-sign records)

---

## Slide 3: Key entities (Tables)
1. **CITIZEN** – master record for a person (Aadhaar, name, DOB, contact info)
2. **DIGITAL_ACCOUNT** – login account tied to a citizen (username, password hash, tier, verification flags)
3. **ISSUER_ORGANIZATION** – entities that issue documents (govt agencies, banks, etc.)
4. **ISSUED_DOCUMENT** – documents issued to an account by an issuer (IDs, certificates, etc.)
5. **UPLOADED_DOCUMENT** – user-uploaded files stored in the system
6. **REQUESTER_ORGANIZATION** – external organizations requesting access (employers, banks)
7. **ACCESS_REQUEST** – a permission request from a requester to view a specific document
8. **AUTHENTICATION_LOG** – audit log of login attempts (time, status, device, IP)
9. **E_SIGN_RECORD** – records of electronic signing of documents
10. **NOTIFICATION** – messages sent to users (email/SMS-style), status tracked
11. **KYC_VERIFICATION** – KYC status history and verification outcomes
12. **DOCUMENT_SHARE_LOG** – audit trail of shared documents (who, when, how)

---

## Slide 4: Entity relationships (ER connections)
- **CITIZEN → DIGITAL_ACCOUNT**: 1-to-many (a citizen can have multiple accounts, but typical is 1)
- **DIGITAL_ACCOUNT → ISSUED_DOCUMENT**: 1-to-many (an account can hold many documents)
- **DIGITAL_ACCOUNT → UPLOADED_DOCUMENT**: 1-to-many
- **DIGITAL_ACCOUNT → AUTHENTICATION_LOG**: 1-to-many
- **DIGITAL_ACCOUNT → NOTIFICATION**: 1-to-many
- **DIGITAL_ACCOUNT → KYC_VERIFICATION**: 1-to-many
- **DIGITAL_ACCOUNT → ACCESS_REQUEST**: 1-to-many (requests made or received, depending on view)
- **REQUESTER_ORGANIZATION → ACCESS_REQUEST**: 1-to-many
- **ISSUER_ORGANIZATION → ISSUED_DOCUMENT**: 1-to-many
- **ISSUED_DOCUMENT → ACCESS_REQUEST**: 1-to-many
- **ISSUED_DOCUMENT → E_SIGN_RECORD**: 1-to-many
- **REQUESTER_ORGANIZATION + ISSUED_DOCUMENT + DIGITAL_ACCOUNT → DOCUMENT_SHARE_LOG** (tracks a document shared from an account to a requester)

> ✅ The database schema uses **foreign key constraints** to enforce referential integrity.

---

## Slide 5: Normalization & design decisions (DBMS concepts)
### 1NF (First Normal Form)
- All tables store atomic values.
- Repeating groups avoided (each attribute stored in its own column).

### 2NF (Second Normal Form)
- No partial dependencies: tables use single-column primary keys (auto-increment int) so every non-key column depends on the full key.
- Example: `ISSUED_DOCUMENT` has `account_id` and `issuer_id` as foreign keys; document attributes depend on the document row.

### 3NF (Third Normal Form)
- Removes transitive dependencies.
- Example: Citizen personal info stored in `CITIZEN`; account data is stored in `DIGITAL_ACCOUNT` rather than mixing them.
- Organization contact info is stored in separate tables (`ISSUER_ORGANIZATION`, `REQUESTER_ORGANIZATION`) rather than embedding into other records.

> 💡 Result: tables are **focused on a single concept**, reducing redundancy and improving data consistency.

---

## Slide 6: Backend implementation (Node + Express + MySQL)
- **Server**: `server/server.js`
  - Uses **Express** for HTTP API routes.
  - Manages sessions with `express-session`.
  - Authentication uses **bcryptjs** for password hashing.
  - Provides a simple **SQL proxy** (`/api/sql/query` and `/api/sql/exec`) for the frontend to run parameterized queries.
- **Database connection**: `server/db/pool.js` (MySQL connection pool)
- **Seed script**: `server/db/seed.js` (initial demo data)
- **Schema**: `server/db/schema.mysql.sql` (DDL for all tables and constraints)

---

## Slide 7: Example workflows (SQL + relations)
### Login (auth + sessions)
1. Frontend calls `/api/auth/login` with username/password.
2. Server queries `DIGITAL_ACCOUNT` for matching username.
3. Server validates password via bcrypt, then stores `accountId` in session.

### Document issuance
1. Issuer record in `ISSUER_ORGANIZATION` exists.
2. A new row inserted into `ISSUED_DOCUMENT` linking `account_id` + `issuer_id`.
3. `document_uri` points to stored file location.

### Access request / consent
1. Requester makes request --> `ACCESS_REQUEST` created (links `requester_id`, `account_id`, `document_id`).
2. Citizen responds (consent status updated).
3. Shared access captured via `DOCUMENT_SHARE_LOG` and optionally `NOTIFICATION`.

---

## Slide 8: Evaluation points & future improvements
### What to highlight for DBMS grading
- **ER diagram correctness**: clear entities, keys, and relationships.
- **Constraints**: primary keys, foreign keys, unique constraints (e.g., `aadhaar_number`, `username`, `issuer_code`).
- **Normalization**: separation of concerns (citizen vs account vs document vs organization) and no redundant storage.
- **SQL integrity**: use of `InnoDB` for transaction safety and FK enforcement.

### Potential enhancements (for extra credit)
- Add explicit **roles/permissions** for requester vs issuer.
- Enforce **tenant isolation** (per-account access checks) beyond the demo SQL proxy.
- Add **audit triggers** or versioning for sensitive updates.
- Introduce a **stronger authentication flow** (OTP, 2FA) and `session` expiry management.

---

> ✅ This file can be used as the basis for an 8‑slide presentation; each slide corresponds to a section above.
