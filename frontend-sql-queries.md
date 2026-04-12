# SQL Queries in Frontend (Secure Identity System)

This document lists all SQL queries executed from the frontend via the backend's SQL proxy API (`/api/sql/query` and `/api/sql/exec`). Each query is tied to a specific file and purpose, including which tables and attributes are affected.

---

## `dashboard.html` (Dashboard Page)

### 1. Document Statistics
```sql
SELECT
  (SELECT COUNT(*) FROM ISSUED_DOCUMENT) AS issued_count,
  (SELECT COUNT(*) FROM UPLOADED_DOCUMENT) AS uploaded_count,
  (SELECT COUNT(*) FROM ISSUED_DOCUMENT WHERE is_valid = 1) AS valid_issued,
  (SELECT COUNT(*) FROM UPLOADED_DOCUMENT WHERE is_verified = 1) AS verified_uploaded
```
- **Purpose**: Counts total issued/uploaded documents and their verification status for dashboard cards.
- **Tables/Attributes Affected**: Reads from `ISSUED_DOCUMENT` (all records, `is_valid`) and `UPLOADED_DOCUMENT` (all records, `is_verified`).

### 2. KYC Statistics
```sql
SELECT
  (SELECT COUNT(*) FROM KYC_VERIFICATION WHERE kyc_status = 'Verified') AS verified,
  (SELECT COUNT(*) FROM KYC_VERIFICATION WHERE kyc_status = 'Pending') AS pending,
  (SELECT COUNT(*) FROM KYC_VERIFICATION WHERE kyc_status = 'Failed') AS failed
```
- **Purpose**: Aggregates KYC verification statuses for dashboard overview.
- **Tables/Attributes Affected**: Reads from `KYC_VERIFICATION` (all records, `kyc_status`).

### 3. Pending Access Requests Count
```sql
SELECT COUNT(*) AS pending FROM ACCESS_REQUEST WHERE consent_status = 'Pending'
```
- **Purpose**: Shows count of pending consent requests in dashboard card.
- **Tables/Attributes Affected**: Reads from `ACCESS_REQUEST` (all records, `consent_status`).

### 4. Storage Usage
```sql
SELECT
  SUM(storage_used_mb) AS used_mb,
  SUM(storage_limit_mb) AS limit_mb
FROM DIGITAL_ACCOUNT
```
- **Purpose**: Calculates total storage used/limit across all accounts for progress bar.
- **Tables/Attributes Affected**: Reads from `DIGITAL_ACCOUNT` (all records, `storage_used_mb`, `storage_limit_mb`).

### 5. Recent Authentication Activity
```sql
SELECT
  'AUTH' AS kind,
  auth_timestamp AS ts,
  auth_method AS title,
  auth_status AS status,
  ip_address AS detail
FROM AUTHENTICATION_LOG
ORDER BY auth_timestamp DESC
LIMIT 5
```
- **Purpose**: Fetches recent login attempts for timeline display.
- **Tables/Attributes Affected**: Reads from `AUTHENTICATION_LOG` (all records, `auth_timestamp`, `auth_method`, `auth_status`, `ip_address`).

### 6. Recent Access Requests
```sql
SELECT
  'ACCESS' AS kind,
  request_timestamp AS ts,
  CONCAT(r.org_name, ' - ', d.document_name) AS title,
  a.consent_status AS status,
  a.purpose AS detail
FROM ACCESS_REQUEST a
JOIN REQUESTER_ORGANIZATION r ON a.requester_id = r.requester_id
JOIN ISSUED_DOCUMENT d ON a.document_id = d.document_id
ORDER BY a.request_timestamp DESC
LIMIT 5
```
- **Purpose**: Lists recent document access requests for timeline.
- **Tables/Attributes Affected**: Reads from `ACCESS_REQUEST` (all records, `request_timestamp`, `consent_status`, `purpose`, `requester_id`, `document_id`), `REQUESTER_ORGANIZATION` (all records, `requester_id`, `org_name`), `ISSUED_DOCUMENT` (all records, `document_id`, `document_name`).

### 7. Recent Notifications
```sql
SELECT
  'NOTIF' AS kind,
  sent_at AS ts,
  event_type AS title,
  'Success' AS status,
  message_body AS detail
FROM NOTIFICATION
WHERE event_type IN ('KYC Submitted', 'KYC Status Updated', 'Document Approved', 'Document Rejected')
ORDER BY sent_at DESC
LIMIT 5
```
- **Purpose**: Fetches recent notifications for timeline.
- **Tables/Attributes Affected**: Reads from `NOTIFICATION` (all records, `sent_at`, `event_type`, `message_body`).

### 8. Failed Authentication Count
```sql
SELECT COUNT(*) AS failed_count
FROM AUTHENTICATION_LOG
WHERE auth_status IN ('Failed','Blocked')
```
- **Purpose**: Shows aggregate failed login attempts meta info.
- **Tables/Attributes Affected**: Reads from `AUTHENTICATION_LOG` (all records, `auth_status`).

### 9. Document Type Distribution
```sql
SELECT document_type, COUNT(*) AS cnt
FROM ISSUED_DOCUMENT
GROUP BY document_type
ORDER BY cnt DESC
```
- **Purpose**: Data for doughnut chart showing document types.
- **Tables/Attributes Affected**: Reads from `ISSUED_DOCUMENT` (all records, `document_type`).

---

## `documents.html` (Document Management)

### 10. Issued Documents List
```sql
SELECT d.document_id,
       d.document_name,
       d.document_type,
       i.issuer_name,
       d.issue_date,
       d.is_valid
FROM ISSUED_DOCUMENT d
JOIN ISSUER_ORGANIZATION i ON d.issuer_id = i.issuer_id
WHERE d.document_type LIKE ?
ORDER BY d.issue_date DESC
```
- **Purpose**: Lists issued documents with filtering by type.
- **Tables/Attributes Affected**: Reads from `ISSUED_DOCUMENT` (all records, `document_id`, `document_name`, `document_type`, `issue_date`, `is_valid`, `issuer_id`), `ISSUER_ORGANIZATION` (all records, `issuer_id`, `issuer_name`).

### 11. Uploaded Documents List
```sql
SELECT upload_id,
       file_name,
       file_type,
       file_size_kb,
       upload_timestamp,
       is_verified
FROM UPLOADED_DOCUMENT
WHERE file_name LIKE ?
ORDER BY upload_timestamp DESC
```
- **Purpose**: Lists user-uploaded documents with search filtering.
- **Tables/Attributes Affected**: Reads from `UPLOADED_DOCUMENT` (all records, `upload_id`, `file_name`, `file_type`, `file_size_kb`, `upload_timestamp`, `is_verified`).

### 12. Delete Uploaded Document
```sql
DELETE FROM UPLOADED_DOCUMENT WHERE upload_id = ?
```
- **Purpose**: Removes an uploaded document record.
- **Tables/Attributes Affected**: Deletes from `UPLOADED_DOCUMENT` (entire row where `upload_id` matches).

### 13. Insert New Uploaded Document
```sql
INSERT INTO UPLOADED_DOCUMENT
  (account_id, file_name, file_type, file_size_kb, description, sha256_checksum, storage_path)
VALUES (?, ?, ?, ?, ?, 'demo_checksum', ?)
```
- **Purpose**: Adds a new uploaded document entry.
- **Tables/Attributes Affected**: Inserts into `UPLOADED_DOCUMENT` (new row with `account_id`, `file_name`, `file_type`, `file_size_kb`, `description`, `sha256_checksum`, `storage_path`; auto-generates `upload_id`, `upload_timestamp`).

---

## `access-requests.html` (Access Requests)

### 14. Pending Access Requests
```sql
SELECT a.access_request_id,
       r.org_name,
       d.document_name,
       a.purpose,
       a.request_timestamp,
       a.expiry_timestamp,
       a.consent_status
FROM ACCESS_REQUEST a
JOIN REQUESTER_ORGANIZATION r ON a.requester_id = r.requester_id
JOIN ISSUED_DOCUMENT d ON a.document_id = d.document_id
WHERE a.consent_status = 'Pending'
ORDER BY a.request_timestamp DESC
```
- **Purpose**: Lists pending requests for citizen approval.
- **Tables/Attributes Affected**: Reads from `ACCESS_REQUEST` (all records, `access_request_id`, `requester_id`, `document_id`, `purpose`, `request_timestamp`, `expiry_timestamp`, `consent_status`), `REQUESTER_ORGANIZATION` (all records, `requester_id`, `org_name`), `ISSUED_DOCUMENT` (all records, `document_id`, `document_name`).

### 15. Access Request History
```sql
SELECT a.access_request_id,
       r.org_name,
       d.document_name,
       a.purpose,
       a.request_timestamp,
       a.expiry_timestamp,
       a.consent_status,
       a.citizen_response_at
FROM ACCESS_REQUEST a
JOIN REQUESTER_ORGANIZATION r ON a.requester_id = r.requester_id
JOIN ISSUED_DOCUMENT d ON a.document_id = d.document_id
WHERE a.consent_status LIKE ?
ORDER BY a.request_timestamp DESC
```
- **Purpose**: Lists all access requests with status filtering.
- **Tables/Attributes Affected**: Reads from `ACCESS_REQUEST` (all records, `access_request_id`, `requester_id`, `document_id`, `purpose`, `request_timestamp`, `expiry_timestamp`, `consent_status`, `citizen_response_at`), `REQUESTER_ORGANIZATION` (all records, `requester_id`, `org_name`), `ISSUED_DOCUMENT` (all records, `document_id`, `document_name`).

### 16. Update Consent Status
```sql
UPDATE ACCESS_REQUEST
SET consent_status = ?,
    citizen_response_at = CURRENT_TIMESTAMP
WHERE access_request_id = ?
```
- **Purpose**: Approves or rejects an access request.
- **Tables/Attributes Affected**: Updates `ACCESS_REQUEST` (changes `consent_status` and `citizen_response_at` where `access_request_id` matches).

### 17. Get Request Details for Notification
```sql
SELECT r.org_name, d.document_name
FROM ACCESS_REQUEST a
JOIN REQUESTER_ORGANIZATION r ON a.requester_id = r.requester_id
JOIN ISSUED_DOCUMENT d ON a.document_id = d.document_id
WHERE a.access_request_id = ?
```
- **Purpose**: Fetches org/document names for notification message.
- **Tables/Attributes Affected**: Reads from `ACCESS_REQUEST` (all records, `access_request_id`, `requester_id`, `document_id`), `REQUESTER_ORGANIZATION` (all records, `requester_id`, `org_name`), `ISSUED_DOCUMENT` (all records, `document_id`, `document_name`).

### 18. Insert Notification on Consent Change
```sql
INSERT INTO NOTIFICATION (account_id, event_type, channel, message_body)
VALUES (?, CONCAT('Document ', ?), 'Portal', CONCAT('You ', LOWER(?), ' access to ', ?, ' for ', ?))
```
- **Purpose**: Creates a notification when consent is given/denied.
- **Tables/Attributes Affected**: Inserts into `NOTIFICATION` (new row with `account_id`, `event_type`, `channel`, `message_body`; auto-generates `notification_id`, `sent_at`, `delivery_status`, `retry_count`, `is_read`).

---

## `audit-log.html` (Authentication Log)

### 19. Authentication Log Entries
```sql
SELECT auth_id,
       auth_method,
       auth_timestamp,
       ip_address,
       device_info,
       location,
       auth_status,
       failure_reason
FROM AUTHENTICATION_LOG
WHERE auth_method LIKE ?
ORDER BY auth_timestamp DESC
```
- **Purpose**: Lists authentication attempts with method filtering.
- **Tables/Attributes Affected**: Reads from `AUTHENTICATION_LOG` (all records, `auth_id`, `auth_method`, `auth_timestamp`, `ip_address`, `device_info`, `location`, `auth_status`, `failure_reason`).

### 20. Failed Attempts per Account
```sql
SELECT account_id,
       COUNT(*) AS failed_attempts
FROM AUTHENTICATION_LOG
WHERE auth_status IN ('Failed','Blocked')
GROUP BY account_id
ORDER BY failed_attempts DESC
```
- **Purpose**: Aggregates failed logins by account for security overview.
- **Tables/Attributes Affected**: Reads from `AUTHENTICATION_LOG` (all records, `account_id`, `auth_status`).

---

## `kyc.html` (KYC Verification)

### 21. Latest KYC Status
```sql
SELECT *
FROM KYC_VERIFICATION
WHERE account_id = ?
ORDER BY COALESCE(verified_at, '9999-12-31') DESC, kyc_id DESC
LIMIT 1
```
- **Purpose**: Gets the most recent KYC record for banner display.
- **Tables/Attributes Affected**: Reads from `KYC_VERIFICATION` (all attributes for matching `account_id`).

### 22. KYC History Table
```sql
SELECT *
FROM KYC_VERIFICATION
WHERE account_id = ?
ORDER BY COALESCE(verified_at, '9999-12-31') DESC, kyc_id DESC
```
- **Purpose**: Lists all KYC attempts for the account.
- **Tables/Attributes Affected**: Reads from `KYC_VERIFICATION` (all attributes for matching `account_id`).

---

## `esign.html` (e-Sign Records)

### 23. e-Sign Records Table
```sql
SELECT e.esign_id,
       d.document_name,
       e.signed_at,
       e.aadhaar_verified,
       e.is_valid,
       e.revoked_at,
       e.certificate_url,
       e.signature_hash,
       e.signing_authority
FROM E_SIGN_RECORD e
JOIN ISSUED_DOCUMENT d ON e.document_id = d.document_id
ORDER BY e.signed_at DESC
```
- **Purpose**: Lists all electronic signatures with document details.
- **Tables/Attributes Affected**: Reads from `E_SIGN_RECORD` (all records, `esign_id`, `document_id`, `signed_at`, `aadhaar_verified`, `is_valid`, `revoked_at`, `certificate_url`, `signature_hash`, `signing_authority`), `ISSUED_DOCUMENT` (all records, `document_id`, `document_name`).

### 24. Unsigned Documents
```sql
SELECT d.document_id, d.document_name
FROM ISSUED_DOCUMENT d
WHERE NOT EXISTS (
  SELECT 1 FROM E_SIGN_RECORD e
  WHERE e.document_id = d.document_id
)
ORDER BY d.document_name
```
- **Purpose**: Lists documents that haven't been signed yet.
- **Tables/Attributes Affected**: Reads from `ISSUED_DOCUMENT` (all records, `document_id`, `document_name`) and checks existence in `E_SIGN_RECORD` (all records, `document_id`).

---

## `notifications.html` (Notifications)

### 25. Notification List
```sql
SELECT notification_id,
       event_type,
       channel,
       message_body,
       sent_at,
       delivery_status,
       retry_count,
       is_read
FROM NOTIFICATION
WHERE channel LIKE ?
ORDER BY sent_at DESC
```
- **Purpose**: Lists notifications with channel filtering.
- **Tables/Attributes Affected**: Reads from `NOTIFICATION` (all records, `notification_id`, `event_type`, `channel`, `message_body`, `sent_at`, `delivery_status`, `retry_count`, `is_read`).

### 26. Mark Notification as Read
```sql
UPDATE NOTIFICATION
SET is_read = 1
WHERE notification_id = ?
```
- **Purpose**: Marks a notification as read.
- **Tables/Attributes Affected**: Updates `NOTIFICATION` (changes `is_read` where `notification_id` matches).

### 27. Delete Notification
```sql
DELETE FROM NOTIFICATION WHERE notification_id = ?
```
- **Purpose**: Removes a notification from the inbox.
- **Tables/Attributes Affected**: Deletes from `NOTIFICATION` (entire row where `notification_id` matches).

---

## `admin.html` (Admin Panel)

### 28. Issuer Organizations
```sql
SELECT issuer_id,
       issuer_name,
       issuer_code,
       issuer_type,
       state,
       is_active,
       registered_date
FROM ISSUER_ORGANIZATION
ORDER BY issuer_name
```
- **Purpose**: Lists all document issuers for admin management.
- **Tables/Attributes Affected**: Reads from `ISSUER_ORGANIZATION` (all records, `issuer_id`, `issuer_name`, `issuer_code`, `issuer_type`, `state`, `is_active`, `registered_date`).

### 29. Requester Organizations
```sql
SELECT requester_id,
       org_name,
       org_type,
       registration_number,
       contact_email,
       is_approved,
       approved_date
FROM REQUESTER_ORGANIZATION
ORDER BY org_name
```
- **Purpose**: Lists organizations requesting access, with approval status.
- **Tables/Attributes Affected**: Reads from `REQUESTER_ORGANIZATION` (all records, `requester_id`, `org_name`, `org_type`, `registration_number`, `contact_email`, `is_approved`, `approved_date`).

### 30. Document Share Logs
```sql
SELECT s.share_id,
       d.document_name,
       r.org_name,
       s.share_timestamp,
       s.share_method,
       s.share_expiry,
       s.is_revoked,
       s.access_count
FROM DOCUMENT_SHARE_LOG s
JOIN ISSUED_DOCUMENT d ON s.document_id = d.document_id
JOIN REQUESTER_ORGANIZATION r ON s.requester_id = r.requester_id
ORDER BY s.share_timestamp DESC
```
- **Purpose**: Audit log of document shares for admin oversight.
- **Tables/Attributes Affected**: Reads from `DOCUMENT_SHARE_LOG` (all records, `share_id`, `document_id`, `requester_id`, `share_timestamp`, `share_method`, `share_expiry`, `is_revoked`, `access_count`), `ISSUED_DOCUMENT` (all records, `document_id`, `document_name`), `REQUESTER_ORGANIZATION` (all records, `requester_id`, `org_name`).

---

> **Note**: All queries use parameterized inputs where applicable to prevent SQL injection. The frontend calls `/api/sql/query` for SELECTs and `/api/sql/exec` for INSERT/UPDATE/DELETE operations.