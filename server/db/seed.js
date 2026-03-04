const bcrypt = require('bcryptjs');

async function truncateAll(pool) {
  // Disable FK checks to truncate safely
  await pool.query('SET FOREIGN_KEY_CHECKS = 0');
  const tables = [
    'DOCUMENT_SHARE_LOG',
    'E_SIGN_RECORD',
    'ACCESS_REQUEST',
    'NOTIFICATION',
    'AUTHENTICATION_LOG',
    'KYC_VERIFICATION',
    'UPLOADED_DOCUMENT',
    'ISSUED_DOCUMENT',
    'REQUESTER_ORGANIZATION',
    'ISSUER_ORGANIZATION',
    'DIGITAL_ACCOUNT',
    'CITIZEN',
  ];
  for (const t of tables) {
    await pool.query(`TRUNCATE TABLE ${t}`);
  }
  await pool.query('SET FOREIGN_KEY_CHECKS = 1');
}

async function seedAll(pool) {
  const demoPassword = 'demo123';
  const passwordHash = await bcrypt.hash(demoPassword, 10);

  // CITIZEN
  await pool.execute(
    `INSERT INTO CITIZEN (citizen_id, aadhaar_number, full_name, date_of_birth, gender, mobile_number, email_address, profile_picture_url, account_status, created_at, last_login)
     VALUES
     (1,?,?,?,?,?,?,?,?,?,?),
     (2,?,?,?,?,?,?,?,?,?,?),
     (3,?,?,?,?,?,?,?,?,?,?),
     (4,?,?,?,?,?,?,?,?,?,?),
     (5,?,?,?,?,?,?,?,?,?,?)`,
    [
      '123456789012','Arjun Sharma','1995-04-12','Male','9876543210','arjun.sharma@example.com',null,'Active','2024-01-10','2024-03-01',
      '987654321098','Priya Nair','1998-07-22','Female','9123456780','priya.nair@example.com',null,'Active','2024-02-15','2024-03-02',
      '456789123456','Rahul Verma','1992-11-05','Male','9012345678','rahul.verma@example.com',null,'Active','2023-12-01','2024-02-28',
      '654321987654','Sneha Iyer','1999-01-19','Female','9090909090','sneha.iyer@example.com',null,'Suspended','2024-01-20',null,
      '321654987321','Aman Gupta','1990-08-30','Male','9988776655','aman.gupta@example.com',null,'Active','2023-11-11','2024-03-01',
    ]
  );

  // DIGITAL_ACCOUNT (all demo users share password: demo123)
  await pool.execute(
    `INSERT INTO DIGITAL_ACCOUNT (account_id, citizen_id, username, password_hash, pin_hash, storage_used_mb, storage_limit_mb, is_aadhaar_verified, is_mobile_verified, account_tier, created_at)
     VALUES
     (1,1,'arjun95',?, '123456',120,2048,1,1,'Premium','2024-01-10'),
     (2,2,'priya98',?, '654321',80,1024,1,1,'Basic','2024-02-15'),
     (3,3,'rahul92',?, '111111',300,4096,1,0,'Gold','2023-12-01'),
     (4,4,'sneha99',?, '222222',20,512,0,1,'Basic','2024-01-20'),
     (5,5,'aman90',?, '333333',50,1024,0,0,'Basic','2023-11-11')`,
    [passwordHash, passwordHash, passwordHash, passwordHash, passwordHash]
  );

  // ISSUER_ORGANIZATION
  await pool.execute(
    `INSERT INTO ISSUER_ORGANIZATION (issuer_id, issuer_name, issuer_code, issuer_type, state, api_endpoint_url, is_active, registered_date, contact_email)
     VALUES
     (1,'CBSE Board','CBSE001','Education','Delhi','https://cbse.api.gov.in',1,'2020-01-01','support@cbse.gov.in'),
     (2,'RTO Maharashtra','RTO-MH01','Transport','Maharashtra','https://rto.mh.api.gov.in',1,'2019-06-15','helpdesk@rto-mh.gov.in'),
     (3,'Income Tax Dept','ITD-GOV','Tax','Delhi','https://incometax.gov.in/api',1,'2018-04-01','contact@incometax.gov.in'),
     (4,'State University Mumbai','UNI-MUM01','University','Maharashtra','https://uni.mum.api.gov.in',1,'2021-07-10','admin@mumuniversity.edu'),
     (5,'Passport Seva','PASS-IND','Passport','Pan-India','https://passport.api.gov.in',1,'2017-05-20','support@passportindia.gov.in')`
  );

  // ISSUED_DOCUMENT
  await pool.execute(
    `INSERT INTO ISSUED_DOCUMENT (document_id, account_id, issuer_id, document_name, document_type, document_number, issue_date, expiry_date, document_uri, file_format, is_valid, issued_at)
     VALUES
     (1,1,1,'Class 12 Marksheet','Marksheet','CBSE2024-0001','2024-05-20',NULL,'da://CBSE001/2024/0001','PDF',1,'2024-05-20'),
     (2,1,2,'Driving Licence','Driving Licence','MH14-DL-2021-1234','2021-03-10','2031-03-09','da://RTO-MH01/DL/2021/1234','PDF',1,'2021-03-10'),
     (3,2,4,'B.Tech Degree Certificate','Degree','MUMUNI-2019-BTECH-0099','2019-08-15',NULL,'da://UNI-MUM01/DEGREE/2019/0099','PDF',1,'2019-08-15'),
     (4,3,3,'PAN Card','Identity','ABCDE1234F','2016-01-01',NULL,'da://ITD-GOV/PAN/ABCDE1234F','PNG',1,'2016-01-01'),
     (5,3,5,'Passport','Passport','P1234567','2020-06-01','2030-05-31','da://PASS-IND/PP/2020/P1234567','PDF',1,'2020-06-01'),
     (6,4,2,'Learner Licence','Driving Licence','MH14-LL-2024-5678','2024-01-25','2024-07-24','da://RTO-MH01/LL/2024/5678','PDF',1,'2024-01-25')`
  );

  // UPLOADED_DOCUMENT
  await pool.execute(
    `INSERT INTO UPLOADED_DOCUMENT (upload_id, account_id, file_name, file_type, file_size_kb, description, upload_timestamp, is_verified, sha256_checksum, storage_path)
     VALUES
     (1,1,'Rent_Agreement_2024.pdf','PDF',450,'Current Bangalore rent agreement','2024-02-01 10:00:00',0,'sha256_rent_arjun','/user/1/uploads/rent_2024.pdf'),
     (2,1,'Passport_Photo.jpg','Image',120,'Recent passport size photo','2024-01-15 09:30:00',1,'sha256_photo_arjun','/user/1/uploads/photo.jpg'),
     (3,2,'Bank_Statement_Jan.pdf','PDF',320,'Savings account statement Jan 2024','2024-02-05 18:20:00',0,'sha256_stmt_priya','/user/2/uploads/bank_jan.pdf'),
     (4,3,'Office_ID_Card.png','Image',210,'Current employer ID card','2024-01-10 14:10:00',1,'sha256_id_rahul','/user/3/uploads/id_card.png'),
     (5,3,'Address_Proof.pdf','PDF',280,'Electricity bill as address proof','2024-02-12 16:45:00',0,'sha256_addr_rahul','/user/3/uploads/address_proof.pdf'),
     (6,4,'Aadhaar_Scan.pdf','PDF',190,'Scanned Aadhaar card','2024-01-26 08:00:00',0,'sha256_aadhaar_sneha','/user/4/uploads/aadhaar_scan.pdf')`
  );

  // REQUESTER_ORGANIZATION
  await pool.execute(
    `INSERT INTO REQUESTER_ORGANIZATION (requester_id, org_name, org_type, registration_number, contact_email, api_key_hash, is_approved, approved_date, website_url)
     VALUES
     (1,'HDFC Bank','Bank','HDFC-REG-001','kyc@hdfcbank.com','api_hdfc_hash',1,'2022-01-10','https://www.hdfcbank.com'),
     (2,'Infosys Ltd','Employer','INFY-REG-778','hrbgv@infosys.com','api_infy_hash',1,'2021-09-15','https://www.infosys.com'),
     (3,'FinTech Credit','FinTech','FTC-REG-555','onboarding@fintechcredit.in','api_ftc_hash',0,NULL,'https://www.fintechcredit.in'),
     (4,'State Govt Scholarship Cell','Government','SGSC-REG-009','verify@scholarship.gov.in','api_scholar_hash',1,'2020-05-05','https://scholarships.gov.in'),
     (5,'Housing Co-op Society','Housing','HCS-REG-777','office@housingsociety.in','api_housing_hash',0,NULL,'https://www.housingsociety.in')`
  );

  // ACCESS_REQUEST
  await pool.execute(
    `INSERT INTO ACCESS_REQUEST (access_request_id, requester_id, account_id, document_id, purpose, request_timestamp, expiry_timestamp, consent_status, citizen_response_at, access_token_hash)
     VALUES
     (1,1,1,4,'Open savings account KYC','2024-02-20 11:00:00','2024-03-20 11:00:00','Approved','2024-02-20 11:30:00','token_hash_1'),
     (2,2,3,5,'Employee background verification','2024-01-05 09:15:00','2024-02-05 09:15:00','Approved','2024-01-05 10:00:00','token_hash_2'),
     (3,3,2,1,'Instant credit eligibility check','2024-02-25 15:45:00','2024-03-10 15:45:00','Pending',NULL,NULL),
     (4,4,1,1,'Scholarship application verification','2024-01-18 08:30:00','2024-04-18 08:30:00','Rejected','2024-01-18 09:00:00',NULL),
     (5,1,4,6,'KYC refresh for dormant account','2024-02-28 19:00:00','2024-03-30 19:00:00','Expired',NULL,'token_hash_expired')`
  );

  // AUTHENTICATION_LOG
  await pool.execute(
    `INSERT INTO AUTHENTICATION_LOG (auth_id, account_id, auth_method, auth_timestamp, ip_address, device_info, location, auth_status, failure_reason, session_token_hash)
     VALUES
     (1,1,'Password','2024-03-01 09:00:00','49.207.12.10','Chrome on Windows','Bengaluru','Success',NULL,'sess_hash_1'),
     (2,1,'Password','2024-02-28 23:10:00','49.207.12.10','Chrome on Windows','Bengaluru','Failed','Wrong password','sess_hash_2'),
     (3,2,'OTP','2024-03-02 10:15:00','106.51.23.89','Safari on iOS','Kochi','Success',NULL,'sess_hash_3'),
     (4,3,'Password','2024-02-27 08:40:00','157.40.100.5','Firefox on Linux','Pune','Blocked','Too many failed attempts','sess_hash_4'),
     (5,3,'Password','2024-02-27 08:35:00','157.40.100.5','Firefox on Linux','Pune','Failed','Wrong password','sess_hash_5'),
     (6,4,'Password','2024-02-26 21:20:00','120.60.33.44','Chrome on Android','Mumbai','Success',NULL,'sess_hash_6')`
  );

  // E_SIGN_RECORD
  await pool.execute(
    `INSERT INTO E_SIGN_RECORD (esign_id, account_id, document_id, signed_at, aadhaar_verified, signature_hash, signing_authority, certificate_url, is_valid, revoked_at)
     VALUES
     (1,1,1,'2024-05-21 10:00:00',1,'sign_hash_1','Arjun Sharma','https://esign.gov.in/cert/ARJUN-1',1,NULL),
     (2,1,2,'2021-03-11 09:30:00',1,'sign_hash_2','Arjun Sharma','https://esign.gov.in/cert/ARJUN-2',1,NULL),
     (3,2,3,'2019-08-16 12:00:00',0,'sign_hash_3','Registrar - Mumbai University','https://esign.gov.in/cert/PRIYA-1',1,NULL),
     (4,3,4,'2016-01-02 14:20:00',1,'sign_hash_4','Income Tax Dept','https://esign.gov.in/cert/RAHUL-1',1,NULL),
     (5,3,5,'2024-01-03 16:45:00',1,'sign_hash_5','Passport Officer','https://esign.gov.in/cert/RAHUL-2',0,'2025-01-01 00:00:00')`
  );

  // NOTIFICATION
  await pool.execute(
    `INSERT INTO NOTIFICATION (notification_id, account_id, event_type, channel, message_body, sent_at, delivery_status, retry_count, is_read)
     VALUES
     (1,1,'Login Alert','SMS','New login from Chrome on Windows','2024-03-01 09:01:00','Sent',0,0),
     (2,1,'KYC Request','Email','HDFC Bank has requested access to your PAN','2024-02-20 11:01:00','Sent',0,1),
     (3,2,'Document Uploaded','Push','Your bank statement has been uploaded successfully','2024-02-05 18:21:00','Sent',0,0),
     (4,3,'Security Warning','Email','Multiple failed login attempts detected','2024-02-27 08:41:00','Sent',1,0),
     (5,4,'Account Suspended','SMS','Your account is temporarily suspended due to KYC pending','2024-02-26 21:25:00','Delivered',0,0),
     (6,3,'Signature Revoked','Email','Your e-Sign on Passport has been revoked','2025-01-01 00:10:00','Sent',0,1)`
  );

  // KYC_VERIFICATION
  await pool.execute(
    `INSERT INTO KYC_VERIFICATION (kyc_id, citizen_id, account_id, kyc_method, kyc_status, verified_at, verified_by, uidai_response_code, kyc_score, next_review_date, remarks)
     VALUES
     (1,1,1,'Aadhaar OTP','Verified','2024-01-10 10:00:00','UIDAI Gateway','UIDAI-200',92.50,'2026-01-10','Initial onboarding KYC'),
     (2,2,2,'Offline XML','Verified','2024-02-16 11:20:00','UIDAI Offline','UIDAI-200',88.00,'2026-02-16','XML based eKYC'),
     (3,3,3,'Aadhaar OTP','Pending',NULL,NULL,NULL,NULL,NULL,'KYC refresh pending'),
     (4,4,4,'Paper Based','Failed','2024-01-25 16:30:00','Branch Officer','UIDAI-403',40.00,'2024-02-25','Signature mismatch'),
     (5,5,5,'Video KYC','Verified','2023-11-12 15:45:00','KYC Officer','UIDAI-200',90.00,'2025-11-12','Video KYC completed')`
  );

  // DOCUMENT_SHARE_LOG
  await pool.execute(
    `INSERT INTO DOCUMENT_SHARE_LOG (share_id, account_id, document_id, requester_id, share_timestamp, share_method, share_expiry, is_revoked, revoked_at, access_count, shared_ip)
     VALUES
     (1,1,4,1,'2024-02-20 11:30:00','Secure Link','2024-03-20 11:30:00',0,NULL,3,'49.207.12.10'),
     (2,3,5,2,'2024-01-05 10:00:00','API','2024-02-05 10:00:00',0,NULL,5,'157.40.100.5'),
     (3,2,1,4,'2024-01-18 09:00:00','Secure Link','2024-04-18 09:00:00',1,'2024-02-01 12:00:00',1,'106.51.23.89'),
     (4,4,6,1,'2024-02-28 19:10:00','API','2024-03-30 19:10:00',0,NULL,0,'120.60.33.44'),
     (5,1,2,3,'2024-02-25 16:00:00','Secure Link','2024-03-10 16:00:00',0,NULL,2,'49.207.12.10')`
  );

  return {
    demoUsers: [
      { username: 'arjun95', password: demoPassword },
      { username: 'priya98', password: demoPassword },
      { username: 'rahul92', password: demoPassword },
      { username: 'sneha99', password: demoPassword },
      { username: 'aman90', password: demoPassword },
    ],
  };
}

module.exports = { truncateAll, seedAll };

