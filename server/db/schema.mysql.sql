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

