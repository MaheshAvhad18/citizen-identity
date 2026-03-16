# SQL Commands by File Location

This README contains all the SQL DDL and DML commands grouped exactly by the file in which they appear.

## server/db/schema.mysql.sql

```sql
-- MySQL schema for Secure Identity System
-- Note: create the database separately and set MYSQL_DATABASE in .env

SET sql_mode = 'STRICT_ALL_TABLES';

CREATE TABLE IF NOT EXISTS CITIZEN (
  citizen_id INT PRIMARY KEY AUTO_INCREMENT,
  aadhaar_number VARCHAR(12) UNIQUE NOT NULL,
  full_name VARCHAR(100),
  date_of_birth DATE,
  gender ENUM('Male','Female','Other'),
  mobile_number VARCHAR(15),
  email_address VARCHAR(100),
  profile_picture_url TEXT,
  account_status VARCHAR(20) DEFAULT 'Active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS DIGITAL_ACCOUNT (
  account_id INT PRIMARY KEY AUTO_INCREMENT,
  citizen_id INT,
  username VARCHAR(50) UNIQUE,
  password_hash VARCHAR(255),
  pin_hash VARCHAR(255),
  storage_used_mb DECIMAL(10,2) DEFAULT 0,
  storage_limit_mb DECIMAL(10,2) DEFAULT 1024,
  is_aadhaar_verified TINYINT(1) DEFAULT 0,
  is_mobile_verified TINYINT(1) DEFAULT 0,
  account_tier VARCHAR(20) DEFAULT 'Basic',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_account_citizen FOREIGN KEY (citizen_id) REFERENCES CITIZEN(citizen_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ISSUER_ORGANIZATION (
  issuer_id INT PRIMARY KEY AUTO_INCREMENT,
  issuer_name VARCHAR(150),
  issuer_code VARCHAR(30) UNIQUE,
  issuer_type VARCHAR(50),
  state VARCHAR(50),
  api_endpoint_url TEXT,
  is_active TINYINT(1) DEFAULT 1,
  registered_date DATE,
  contact_email VARCHAR(100)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ISSUED_DOCUMENT (
  document_id INT PRIMARY KEY AUTO_INCREMENT,
  account_id INT,
  issuer_id INT,
  document_name VARCHAR(150),
  document_type VARCHAR(80),
  document_number VARCHAR(100),
  issue_date DATE,
  expiry_date DATE NULL,
  document_uri TEXT,
  file_format VARCHAR(20),
  is_valid TINYINT(1) DEFAULT 1,
  issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_issued_account FOREIGN KEY (account_id) REFERENCES DIGITAL_ACCOUNT(account_id),
  CONSTRAINT fk_issued_issuer FOREIGN KEY (issuer_id) REFERENCES ISSUER_ORGANIZATION(issuer_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS UPLOADED_DOCUMENT (
  upload_id INT PRIMARY KEY AUTO_INCREMENT,
  account_id INT,
  file_name VARCHAR(200),
  file_type VARCHAR(50),
  file_size_kb DECIMAL(10,2),
  description TEXT,
  upload_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_verified TINYINT(1) DEFAULT 0,
  sha256_checksum VARCHAR(128),
  storage_path TEXT,
  CONSTRAINT fk_uploaded_account FOREIGN KEY (account_id) REFERENCES DIGITAL_ACCOUNT(account_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS REQUESTER_ORGANIZATION (
  requester_id INT PRIMARY KEY AUTO_INCREMENT,
  org_name VARCHAR(150),
  org_type VARCHAR(60),
  registration_number VARCHAR(100),
  contact_email VARCHAR(100),
  api_key_hash VARCHAR(255),
  is_approved TINYINT(1) DEFAULT 0,
  approved_date DATE NULL,
  website_url VARCHAR(200)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ACCESS_REQUEST (
  access_request_id INT PRIMARY KEY AUTO_INCREMENT,
  requester_id INT,
  account_id INT,
  document_id INT,
  purpose TEXT,
  request_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  expiry_timestamp DATETIME NULL,
  consent_status VARCHAR(20) DEFAULT 'Pending',
  citizen_response_at DATETIME NULL,
  access_token_hash VARCHAR(255),
  CONSTRAINT fk_access_requester FOREIGN KEY (requester_id) REFERENCES REQUESTER_ORGANIZATION(requester_id),
  CONSTRAINT fk_access_account FOREIGN KEY (account_id) REFERENCES DIGITAL_ACCOUNT(account_id),
  CONSTRAINT fk_access_document FOREIGN KEY (document_id) REFERENCES ISSUED_DOCUMENT(document_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS AUTHENTICATION_LOG (
  auth_id INT PRIMARY KEY AUTO_INCREMENT,
  account_id INT,
  auth_method VARCHAR(40),
  auth_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  device_info VARCHAR(200),
  location VARCHAR(100),
  auth_status VARCHAR(20),
  failure_reason VARCHAR(200),
  session_token_hash VARCHAR(255),
  CONSTRAINT fk_auth_account FOREIGN KEY (account_id) REFERENCES DIGITAL_ACCOUNT(account_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS E_SIGN_RECORD (
  esign_id INT PRIMARY KEY AUTO_INCREMENT,
  account_id INT,
  document_id INT,
  signed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  aadhaar_verified TINYINT(1) DEFAULT 0,
  signature_hash VARCHAR(255),
  signing_authority VARCHAR(100),
  certificate_url TEXT,
  is_valid TINYINT(1) DEFAULT 1,
  revoked_at DATETIME NULL,
  CONSTRAINT fk_esign_account FOREIGN KEY (account_id) REFERENCES DIGITAL_ACCOUNT(account_id),
  CONSTRAINT fk_esign_document FOREIGN KEY (document_id) REFERENCES ISSUED_DOCUMENT(document_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS NOTIFICATION (
  notification_id INT PRIMARY KEY AUTO_INCREMENT,
  account_id INT,
  event_type VARCHAR(80),
  channel VARCHAR(20),
  message_body TEXT,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  delivery_status VARCHAR(30) DEFAULT 'Sent',
  retry_count INT DEFAULT 0,
  is_read TINYINT(1) DEFAULT 0,
  CONSTRAINT fk_notification_account FOREIGN KEY (account_id) REFERENCES DIGITAL_ACCOUNT(account_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS KYC_VERIFICATION (
  kyc_id INT PRIMARY KEY AUTO_INCREMENT,
  citizen_id INT,
  account_id INT,
  kyc_method VARCHAR(60),
  kyc_status VARCHAR(20) DEFAULT 'Pending',
  verified_at DATETIME NULL,
  verified_by VARCHAR(100),
  uidai_response_code VARCHAR(50),
  kyc_score DECIMAL(5,2),
  next_review_date DATE NULL,
  remarks TEXT,
  CONSTRAINT fk_kyc_citizen FOREIGN KEY (citizen_id) REFERENCES CITIZEN(citizen_id),
  CONSTRAINT fk_kyc_account FOREIGN KEY (account_id) REFERENCES DIGITAL_ACCOUNT(account_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS DOCUMENT_SHARE_LOG (
  share_id INT PRIMARY KEY AUTO_INCREMENT,
  account_id INT,
  document_id INT,
  requester_id INT,
  share_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  share_method VARCHAR(50),
  share_expiry DATETIME NULL,
  is_revoked TINYINT(1) DEFAULT 0,
  revoked_at DATETIME NULL,
  access_count INT DEFAULT 0,
  shared_ip VARCHAR(45),
  CONSTRAINT fk_share_account FOREIGN KEY (account_id) REFERENCES DIGITAL_ACCOUNT(account_id),
  CONSTRAINT fk_share_document FOREIGN KEY (document_id) REFERENCES ISSUED_DOCUMENT(document_id),
  CONSTRAINT fk_share_requester FOREIGN KEY (requester_id) REFERENCES REQUESTER_ORGANIZATION(requester_id)
) ENGINE=InnoDB;
```

## server/db/seed.js

```sql
TRUNCATE TABLE ${t}
```

```sql
INSERT INTO CITIZEN (citizen_id, aadhaar_number, full_name, date_of_birth, gender, mobile_number, email_address, profile_picture_url, account_status, created_at, last_login)
VALUES
(1,?,?,?,?,?,?,?,?,?,?),
(2,?,?,?,?,?,?,?,?,?,?),
(3,?,?,?,?,?,?,?,?,?,?),
(4,?,?,?,?,?,?,?,?,?,?),
(5,?,?,?,?,?,?,?,?,?,?)
```

```sql
INSERT INTO DIGITAL_ACCOUNT (account_id, citizen_id, username, password_hash, pin_hash, storage_used_mb, storage_limit_mb, is_aadhaar_verified, is_mobile_verified, account_tier, created_at)
VALUES
(1,1,'arjun95',?, '123456',120,2048,1,1,'Premium','2024-01-10'),
(2,2,'priya98',?, '654321',80,1024,1,1,'Basic','2024-02-15'),
(3,3,'rahul92',?, '111111',300,4096,1,0,'Gold','2023-12-01'),
(4,4,'sneha99',?, '222222',20,512,0,1,'Basic','2024-01-20'),
(5,5,'aman90',?, '333333',50,1024,0,0,'Basic','2023-11-11')
```

```sql
INSERT INTO ISSUER_ORGANIZATION (issuer_id, issuer_name, issuer_code, issuer_type, state, api_endpoint_url, is_active, registered_date, contact_email)
VALUES
(1,'CBSE Board','CBSE001','Education','Delhi','https://cbse.api.gov.in',1,'2020-01-01','support@cbse.gov.in'),
(2,'RTO Maharashtra','RTO-MH01','Transport','Maharashtra','https://rto.mh.api.gov.in',1,'2019-06-15','helpdesk@rto-mh.gov.in'),
(3,'Income Tax Dept','ITD-GOV','Tax','Delhi','https://incometax.gov.in/api',1,'2018-04-01','contact@incometax.gov.in'),
(4,'State University Mumbai','UNI-MUM01','University','Maharashtra','https://uni.mum.api.gov.in',1,'2021-07-10','admin@mumuniversity.edu'),
(5,'Passport Seva','PASS-IND','Passport','Pan-India','https://passport.api.gov.in',1,'2017-05-20','support@passportindia.gov.in')
```

```sql
INSERT INTO ISSUED_DOCUMENT (document_id, account_id, issuer_id, document_name, document_type, document_number, issue_date, expiry_date, document_uri, file_format, is_valid, issued_at)
VALUES
(1,1,1,'Class 12 Marksheet','Marksheet','CBSE2024-0001','2024-05-20',NULL,'da://CBSE001/2024/0001','PDF',1,'2024-05-20'),
(2,1,2,'Driving Licence','Driving Licence','MH14-DL-2021-1234','2021-03-10','2031-03-09','da://RTO-MH01/DL/2021/1234','PDF',1,'2021-03-10'),
(3,2,4,'B.Tech Degree Certificate','Degree','MUMUNI-2019-BTECH-0099','2019-08-15',NULL,'da://UNI-MUM01/DEGREE/2019/0099','PDF',1,'2019-08-15'),
(4,3,3,'PAN Card','Identity','ABCDE1234F','2016-01-01',NULL,'da://ITD-GOV/PAN/ABCDE1234F','PNG',1,'2016-01-01'),
(5,3,5,'Passport','Passport','P1234567','2020-06-01','2030-05-31','da://PASS-IND/PP/2020/P1234567','PDF',1,'2020-06-01'),
(6,4,2,'Learner Licence','Driving Licence','MH14-LL-2024-5678','2024-01-25','2024-07-24','da://RTO-MH01/LL/2024/5678','PDF',1,'2024-01-25')
```

```sql
INSERT INTO UPLOADED_DOCUMENT (upload_id, account_id, file_name, file_type, file_size_kb, description, upload_timestamp, is_verified, sha256_checksum, storage_path)
VALUES
(1,1,'Rent_Agreement_2024.pdf','PDF',450,'Current Bangalore rent agreement','2024-02-01 10:00:00',0,'sha256_rent_arjun','/user/1/uploads/rent_2024.pdf'),
(2,1,'Passport_Photo.jpg','Image',120,'Recent passport size photo','2024-01-15 09:30:00',1,'sha256_photo_arjun','/user/1/uploads/photo.jpg'),
(3,2,'Bank_Statement_Jan.pdf','PDF',320,'Savings account statement Jan 2024','2024-02-05 18:20:00',0,'sha256_stmt_priya','/user/2/uploads/bank_jan.pdf'),
(4,3,'Office_ID_Card.png','Image',210,'Current employer ID card','2024-01-10 14:10:00',1,'sha256_id_rahul','/user/3/uploads/id_card.png'),
(5,3,'Address_Proof.pdf','PDF',280,'Electricity bill as address proof','2024-02-12 16:45:00',0,'sha256_addr_rahul','/user/3/uploads/address_proof.pdf'),
(6,4,'Aadhaar_Scan.pdf','PDF',190,'Scanned Aadhaar card','2024-01-26 08:00:00',0,'sha256_aadhaar_sneha','/user/4/uploads/aadhaar_scan.pdf')
```

```sql
INSERT INTO REQUESTER_ORGANIZATION (requester_id, org_name, org_type, registration_number, contact_email, api_key_hash, is_approved, approved_date, website_url)
VALUES
(1,'HDFC Bank','Bank','HDFC-REG-001','kyc@hdfcbank.com','api_hdfc_hash',1,'2022-01-10','https://www.hdfcbank.com'),
(2,'Infosys Ltd','Employer','INFY-REG-778','hrbgv@infosys.com','api_infy_hash',1,'2021-09-15','https://www.infosys.com'),
(3,'FinTech Credit','FinTech','FTC-REG-555','onboarding@fintechcredit.in','api_ftc_hash',0,NULL,'https://www.fintechcredit.in'),
(4,'State Govt Scholarship Cell','Government','SGSC-REG-009','verify@scholarship.gov.in','api_scholar_hash',1,'2020-05-05','https://scholarships.gov.in'),
(5,'Housing Co-op Society','Housing','HCS-REG-777','office@housingsociety.in','api_housing_hash',0,NULL,'https://www.housingsociety.in')
```

```sql
INSERT INTO ACCESS_REQUEST (access_request_id, requester_id, account_id, document_id, purpose, request_timestamp, expiry_timestamp, consent_status, citizen_response_at, access_token_hash)
VALUES
(1,1,1,4,'Open savings account KYC','2024-02-20 11:00:00','2024-03-20 11:00:00','Approved','2024-02-20 11:30:00','token_hash_1'),
(2,2,3,5,'Employee background verification','2024-01-05 09:15:00','2024-02-05 09:15:00','Approved','2024-01-05 10:00:00','token_hash_2'),
(3,3,2,1,'Instant credit eligibility check','2024-02-25 15:45:00','2024-03-10 15:45:00','Pending',NULL,NULL),
(4,4,1,1,'Scholarship application verification','2024-01-18 08:30:00','2024-04-18 08:30:00','Rejected','2024-01-18 09:00:00',NULL),
(5,1,4,6,'KYC refresh for dormant account','2024-02-28 19:00:00','2024-03-30 19:00:00','Expired',NULL,'token_hash_expired')
```

```sql
INSERT INTO AUTHENTICATION_LOG (auth_id, account_id, auth_method, auth_timestamp, ip_address, device_info, location, auth_status, failure_reason, session_token_hash)
VALUES
(1,1,'Password','2024-03-01 09:00:00','49.207.12.10','Chrome on Windows','Bengaluru','Success',NULL,'sess_hash_1'),
(2,1,'Password','2024-02-28 23:10:00','49.207.12.10','Chrome on Windows','Bengaluru','Failed','Wrong password','sess_hash_2'),
(3,2,'OTP','2024-03-02 10:15:00','106.51.23.89','Safari on iOS','Kochi','Success',NULL,'sess_hash_3'),
(4,3,'Password','2024-02-27 08:40:00','157.40.100.5','Firefox on Linux','Pune','Blocked','Too many failed attempts','sess_hash_4'),
(5,3,'Password','2024-02-27 08:35:00','157.40.100.5','Firefox on Linux','Pune','Failed','Wrong password','sess_hash_5'),
(6,4,'Password','2024-02-26 21:20:00','120.60.33.44','Chrome on Android','Mumbai','Success',NULL,'sess_hash_6')
```

```sql
INSERT INTO E_SIGN_RECORD (esign_id, account_id, document_id, signed_at, aadhaar_verified, signature_hash, signing_authority, certificate_url, is_valid, revoked_at)
VALUES
(1,1,1,'2024-05-21 10:00:00',1,'sign_hash_1','Arjun Sharma','https://esign.gov.in/cert/ARJUN-1',1,NULL),
(2,1,2,'2021-03-11 09:30:00',1,'sign_hash_2','Arjun Sharma','https://esign.gov.in/cert/ARJUN-2',1,NULL),
(3,2,3,'2019-08-16 12:00:00',0,'sign_hash_3','Registrar - Mumbai University','https://esign.gov.in/cert/PRIYA-1',1,NULL),
(4,3,4,'2016-01-02 14:20:00',1,'sign_hash_4','Income Tax Dept','https://esign.gov.in/cert/RAHUL-1',1,NULL),
(5,3,5,'2024-01-03 16:45:00',1,'sign_hash_5','Passport Officer','https://esign.gov.in/cert/RAHUL-2',0,'2025-01-01 00:00:00')
```

```sql
INSERT INTO NOTIFICATION (notification_id, account_id, event_type, channel, message_body, sent_at, delivery_status, retry_count, is_read)
VALUES
(1,1,'Login Alert','SMS','New login from Chrome on Windows','2024-03-01 09:01:00','Sent',0,0),
(2,1,'KYC Request','Email','HDFC Bank has requested access to your PAN','2024-02-20 11:01:00','Sent',0,1),
(3,2,'Document Uploaded','Push','Your bank statement has been uploaded successfully','2024-02-05 18:21:00','Sent',0,0),
(4,3,'Security Warning','Email','Multiple failed login attempts detected','2024-02-27 08:41:00','Sent',1,0),
(5,4,'Account Suspended','SMS','Your account is temporarily suspended due to KYC pending','2024-02-26 21:25:00','Delivered',0,0),
(6,3,'Signature Revoked','Email','Your e-Sign on Passport has been revoked','2025-01-01 00:10:00','Sent',0,1)
```

```sql
INSERT INTO KYC_VERIFICATION (kyc_id, citizen_id, account_id, kyc_method, kyc_status, verified_at, verified_by, uidai_response_code, kyc_score, next_review_date, remarks)
VALUES
(1,1,1,'Aadhaar OTP','Verified','2024-01-10 10:00:00','UIDAI Gateway','UIDAI-200',92.50,'2026-01-10','Initial onboarding KYC'),
(2,2,2,'Offline XML','Verified','2024-02-16 11:20:00','UIDAI Offline','UIDAI-200',88.00,'2026-02-16','XML based eKYC'),
(3,3,3,'Aadhaar OTP','Pending',NULL,NULL,NULL,NULL,NULL,'KYC refresh pending'),
(4,4,4,'Paper Based','Failed','2024-01-25 16:30:00','Branch Officer','UIDAI-403',40.00,'2024-02-25','Signature mismatch'),
(5,5,5,'Video KYC','Verified','2023-11-12 15:45:00','KYC Officer','UIDAI-200',90.00,'2025-11-12','Video KYC completed')
```

```sql
INSERT INTO DOCUMENT_SHARE_LOG (share_id, account_id, document_id, requester_id, share_timestamp, share_method, share_expiry, is_revoked, revoked_at, access_count, shared_ip)
VALUES
(1,1,4,1,'2024-02-20 11:30:00','Secure Link','2024-03-20 11:30:00',0,NULL,3,'49.207.12.10'),
(2,3,5,2,'2024-01-05 10:00:00','API','2024-02-05 10:00:00',0,NULL,5,'157.40.100.5'),
(3,2,1,4,'2024-01-18 09:00:00','Secure Link','2024-04-18 09:00:00',1,'2024-02-01 12:00:00',1,'106.51.23.89'),
(4,4,6,1,'2024-02-28 19:10:00','API','2024-03-30 19:10:00',0,NULL,0,'120.60.33.44'),
(5,1,2,3,'2024-02-25 16:00:00','Secure Link','2024-03-10 16:00:00',0,NULL,2,'49.207.12.10')
```

## server/server.js

```sql
SELECT account_id, citizen_id, username, password_hash
FROM DIGITAL_ACCOUNT
WHERE username = ?
LIMIT 1
```

```sql
SELECT account_id, citizen_id, username
FROM DIGITAL_ACCOUNT
WHERE username = 'arjun95'
LIMIT 1
```

## dashboard.html

```sql
SELECT
(SELECT COUNT(*) FROM ISSUED_DOCUMENT) AS issued_count,
(SELECT COUNT(*) FROM UPLOADED_DOCUMENT) AS uploaded_count,
(SELECT COUNT(*) FROM ISSUED_DOCUMENT WHERE is_valid = 1) AS valid_issued,
(SELECT COUNT(*) FROM UPLOADED_DOCUMENT WHERE is_verified = 1) AS verified_uploaded
```

```sql
SELECT
(SELECT COUNT(*) FROM KYC_VERIFICATION WHERE kyc_status = 'Verified') AS verified,
(SELECT COUNT(*) FROM KYC_VERIFICATION WHERE kyc_status = 'Pending') AS pending,
(SELECT COUNT(*) FROM KYC_VERIFICATION WHERE kyc_status = 'Failed') AS failed
```

```sql
SELECT COUNT(*) AS pending FROM ACCESS_REQUEST WHERE consent_status = 'Pending'
```

```sql
SELECT COUNT(*) AS failed_count
FROM AUTHENTICATION_LOG
WHERE auth_status IN ('Failed','Blocked')
```

```sql
SELECT document_type, COUNT(*) AS cnt
FROM ISSUED_DOCUMENT
GROUP BY document_type
ORDER BY cnt DESC
```

## documents.html

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

```sql
DELETE FROM UPLOADED_DOCUMENT WHERE upload_id = ?
```

```sql
INSERT INTO UPLOADED_DOCUMENT
(account_id, file_name, file_type, file_size_kb, description, sha256_checksum, storage_path)
VALUES (?, ?, ?, ?, ?, 'demo_checksum', ?)
```

## esign.html

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

```sql
SELECT d.document_id, d.document_name
FROM ISSUED_DOCUMENT d
WHERE NOT EXISTS (
SELECT 1 FROM E_SIGN_RECORD e
WHERE e.document_id = d.document_id
)
ORDER BY d.document_name
```

```sql
UPDATE E_SIGN_RECORD
SET is_valid = 0,
revoked_at = CURRENT_TIMESTAMP
WHERE esign_id = ?
```

```sql
INSERT INTO E_SIGN_RECORD
(account_id, document_id, aadhaar_verified, signature_hash, signing_authority, certificate_url, is_valid)
VALUES (?, ?, 1, 'demo_signature_hash', ?, 'https://esign.gov.in/demo-cert', 1)
```

## access-requests.html

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

```sql
UPDATE ACCESS_REQUEST
SET consent_status = ?,
citizen_response_at = CURRENT_TIMESTAMP
WHERE access_request_id = ?
```

```sql
SELECT r.org_name, d.document_name
FROM ACCESS_REQUEST a
JOIN REQUESTER_ORGANIZATION r ON a.requester_id = r.requester_id
JOIN ISSUED_DOCUMENT d ON a.document_id = d.document_id
WHERE a.access_request_id = ?
```

```sql
INSERT INTO NOTIFICATION (account_id, event_type, channel, message_body)
VALUES (?, CONCAT('Document ', ?), 'Portal', CONCAT('You ', LOWER(?), ' access to ', ?, ' for ', ?))
```

## kyc.html

```sql
SELECT *
FROM KYC_VERIFICATION
WHERE account_id = ?
ORDER BY COALESCE(verified_at, '9999-12-31') DESC, kyc_id DESC
LIMIT 1
```

```sql
SELECT *
FROM KYC_VERIFICATION
WHERE account_id = ?
ORDER BY COALESCE(verified_at, '9999-12-31') DESC, kyc_id DESC
```

```sql
INSERT INTO KYC_VERIFICATION
(citizen_id, account_id, kyc_method, kyc_status, verified_at, verified_by, uidai_response_code, kyc_score, next_review_date, remarks)
VALUES (?, ?, ?, 'Pending', NULL, NULL, NULL, NULL, NULL, ?)
```

```sql
INSERT INTO NOTIFICATION (account_id, event_type, channel, message_body)
VALUES (?, 'KYC Submitted', 'Portal', CONCAT('New KYC verification submitted via ', ?))
```

```sql
UPDATE KYC_VERIFICATION
SET kyc_status = ?,
verified_at = CASE WHEN ? IN ('Verified','Failed') THEN CURRENT_TIMESTAMP ELSE verified_at END,
verified_by = CASE WHEN ? IN ('Verified','Failed') THEN 'Demo KYC Officer' ELSE verified_by END,
uidai_response_code = CASE WHEN ? = 'Verified' THEN 'UIDAI-200' WHEN ? = 'Failed' THEN 'UIDAI-403' ELSE uidai_response_code END,
kyc_score = COALESCE(?, kyc_score)
WHERE kyc_id = ?
```

```sql
INSERT INTO NOTIFICATION (account_id, event_type, channel, message_body)
VALUES (?, 'KYC Status Updated', 'Portal', CONCAT('KYC request #', ?, ' updated to ', ?))
```

## notifications.html

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

```sql
UPDATE NOTIFICATION
SET is_read = 1
WHERE notification_id = ?
```

```sql
DELETE FROM NOTIFICATION WHERE notification_id = ?
```

## admin.html

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

```sql
UPDATE REQUESTER_ORGANIZATION
SET is_approved = 1,
approved_date = CURDATE()
WHERE requester_id = ?
```

```sql
INSERT INTO REQUESTER_ORGANIZATION
(org_name, org_type, registration_number, contact_email, api_key_hash, is_approved, website_url)
VALUES (?, ?, ?, ?, 'demo_api_key', 0, ?)
```

## audit-log.html

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

```sql
SELECT account_id,
COUNT(*) AS failed_attempts
FROM AUTHENTICATION_LOG
WHERE auth_status IN ('Failed','Blocked')
GROUP BY account_id
ORDER BY failed_attempts DESC
```
