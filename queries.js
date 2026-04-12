export const QUERIES = {
  // dashboard.html
  DASHBOARD_DOC_STATS: `
          SELECT
            (SELECT COUNT(*) FROM ISSUED_DOCUMENT) AS issued_count,
            (SELECT COUNT(*) FROM UPLOADED_DOCUMENT) AS uploaded_count,
            (SELECT COUNT(*) FROM ISSUED_DOCUMENT WHERE is_valid = 1) AS valid_issued,
            (SELECT COUNT(*) FROM UPLOADED_DOCUMENT WHERE is_verified = 1) AS verified_uploaded
        `,
  DASHBOARD_KYC_STATS: `
          SELECT
            (SELECT COUNT(*) FROM KYC_VERIFICATION WHERE kyc_status = 'Verified') AS verified,
            (SELECT COUNT(*) FROM KYC_VERIFICATION WHERE kyc_status = 'Pending') AS pending,
            (SELECT COUNT(*) FROM KYC_VERIFICATION WHERE kyc_status = 'Failed') AS failed
        `,
  DASHBOARD_PENDING_REQUESTS: `SELECT COUNT(*) AS pending FROM ACCESS_REQUEST WHERE consent_status = 'Pending'`,
  DASHBOARD_STORAGE: `
          SELECT
            SUM(storage_used_mb) AS used_mb,
            SUM(storage_limit_mb) AS limit_mb
          FROM DIGITAL_ACCOUNT
        `,
  DASHBOARD_ACTIVITY_AUTH: `
          SELECT
            'AUTH' AS kind,
            auth_timestamp AS ts,
            auth_method AS title,
            auth_status AS status,
            ip_address AS detail
          FROM AUTHENTICATION_LOG
          ORDER BY auth_timestamp DESC
          LIMIT 5
        `,
  DASHBOARD_ACTIVITY_ACCESS: `
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
        `,
  DASHBOARD_ACTIVITY_NOTIF: `
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
        `,
  DASHBOARD_FAILED_AUTH: `
          SELECT COUNT(*) AS failed_count
          FROM AUTHENTICATION_LOG
          WHERE auth_status IN ('Failed','Blocked')
        `,
  DASHBOARD_DOC_MIX: `
          SELECT document_type, COUNT(*) AS cnt
          FROM ISSUED_DOCUMENT
          GROUP BY document_type
          ORDER BY cnt DESC
        `,

  // documents.html
  DOCS_LOAD_ISSUED: `
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
      `,
  DOCS_LOAD_UPLOADED: `
        SELECT upload_id,
               file_name,
               file_type,
               file_size_kb,
               upload_timestamp,
               is_verified
        FROM UPLOADED_DOCUMENT
        WHERE file_name LIKE ?
        ORDER BY upload_timestamp DESC
      `,
  DOCS_DELETE_UPLOADED: `DELETE FROM UPLOADED_DOCUMENT WHERE upload_id = ?`,
  DOCS_INSERT_UPLOADED: `
        INSERT INTO UPLOADED_DOCUMENT
          (account_id, file_name, file_type, file_size_kb, description, sha256_checksum, storage_path)
        VALUES (?, ?, ?, ?, ?, 'demo_checksum', ?)
      `,

  // kyc.html
  KYC_BANNER_LATEST: `
        SELECT *
        FROM KYC_VERIFICATION
        WHERE account_id = ?
        ORDER BY COALESCE(verified_at, '9999-12-31') DESC, kyc_id DESC
        LIMIT 1
      `,
  KYC_LOAD_TABLE: `
        SELECT *
        FROM KYC_VERIFICATION
        WHERE account_id = ?
        ORDER BY COALESCE(verified_at, '9999-12-31') DESC, kyc_id DESC
      `,
  KYC_INSERT_NEW: `
        INSERT INTO KYC_VERIFICATION
          (citizen_id, account_id, kyc_method, kyc_status, verified_at, verified_by, uidai_response_code, kyc_score, next_review_date, remarks)
        VALUES (?, ?, ?, 'Pending', NULL, NULL, NULL, NULL, NULL, ?)
      `,
  KYC_INSERT_NOTIF: `
        INSERT INTO NOTIFICATION (account_id, event_type, channel, message_body)
        VALUES (?, 'KYC Submitted', 'Portal', CONCAT('New KYC verification submitted via ', ?))
      `,
  KYC_UPDATE_STATUS: `
        UPDATE KYC_VERIFICATION
        SET kyc_status = ?,
            verified_at = CASE WHEN ? IN ('Verified','Failed') THEN CURRENT_TIMESTAMP ELSE verified_at END,
            verified_by = CASE WHEN ? IN ('Verified','Failed') THEN 'Demo KYC Officer' ELSE verified_by END,
            uidai_response_code = CASE WHEN ? = 'Verified' THEN 'UIDAI-200' WHEN ? = 'Failed' THEN 'UIDAI-403' ELSE uidai_response_code END,
            kyc_score = COALESCE(?, kyc_score)
        WHERE kyc_id = ?
      `,
  KYC_UPDATE_NOTIF: `
        INSERT INTO NOTIFICATION (account_id, event_type, channel, message_body)
        VALUES (?, 'KYC Status Updated', 'Portal', CONCAT('KYC request #', ?, ' updated to ', ?))
      `,

  // access-requests.html
  ACCESS_LOAD_PENDING: `
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
      `,
  ACCESS_LOAD_HISTORY: `
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
      `,
  ACCESS_UPDATE_CONSENT: `
        UPDATE ACCESS_REQUEST
        SET consent_status = ?,
            citizen_response_at = CURRENT_TIMESTAMP
        WHERE access_request_id = ?
      `,
  ACCESS_GET_REQ_INFO: `
        SELECT r.org_name, d.document_name
        FROM ACCESS_REQUEST a
        JOIN REQUESTER_ORGANIZATION r ON a.requester_id = r.requester_id
        JOIN ISSUED_DOCUMENT d ON a.document_id = d.document_id
        WHERE a.access_request_id = ?
      `,
  ACCESS_INSERT_NOTIF: `
          INSERT INTO NOTIFICATION (account_id, event_type, channel, message_body)
          VALUES (?, CONCAT('Document ', ?), 'Portal', CONCAT('You ', LOWER(?), ' access to ', ?, ' for ', ?))
        `,

  // esign.html
  ESIGN_LOAD_TABLE: `
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
      `,
  ESIGN_LOAD_UNSIGNED: `
        SELECT d.document_id, d.document_name
        FROM ISSUED_DOCUMENT d
        WHERE NOT EXISTS (
          SELECT 1 FROM E_SIGN_RECORD e
          WHERE e.document_id = d.document_id
        )
        ORDER BY d.document_name
      `,
  ESIGN_REVOKE: `
        UPDATE E_SIGN_RECORD
        SET is_valid = 0,
            revoked_at = CURRENT_TIMESTAMP
        WHERE esign_id = ?
      `,
  ESIGN_INSERT_RECORD: `
        INSERT INTO E_SIGN_RECORD
          (account_id, document_id, aadhaar_verified, signature_hash, signing_authority, certificate_url, is_valid)
        VALUES (?, ?, 1, 'demo_signature_hash', ?, 'https://esign.gov.in/demo-cert', 1)
      `,

  // notifications.html
  NOTIF_LOAD_ALL: `
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
      `,
  NOTIF_MARK_READ: `
        UPDATE NOTIFICATION
        SET is_read = 1
        WHERE notification_id = ?
      `,
  NOTIF_DELETE: `DELETE FROM NOTIFICATION WHERE notification_id = ?`,

  // audit-log.html
  AUDIT_LOAD_LOG: `
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
      `,
  AUDIT_LOAD_AGGREGATE: `
        SELECT account_id,
               COUNT(*) AS failed_attempts
        FROM AUTHENTICATION_LOG
        WHERE auth_status IN ('Failed','Blocked')
        GROUP BY account_id
        ORDER BY failed_attempts DESC
      `,

  // admin.html
  ADMIN_LOAD_ISSUERS: `
        SELECT issuer_id,
               issuer_name,
               issuer_code,
               issuer_type,
               state,
               is_active,
               registered_date
        FROM ISSUER_ORGANIZATION
        ORDER BY issuer_name
      `,
  ADMIN_LOAD_REQUESTERS: `
        SELECT requester_id,
               org_name,
               org_type,
               registration_number,
               contact_email,
               is_approved,
               approved_date
        FROM REQUESTER_ORGANIZATION
        ORDER BY org_name
      `,
  ADMIN_LOAD_SHARE_LOGS: `
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
      `,
  ADMIN_APPROVE_REQUESTER: `
        UPDATE REQUESTER_ORGANIZATION
        SET is_approved = 1,
            approved_date = CURDATE()
        WHERE requester_id = ?
      `,
  ADMIN_INSERT_ORG: `
        INSERT INTO REQUESTER_ORGANIZATION
          (org_name, org_type, registration_number, contact_email, api_key_hash, is_approved, website_url)
        VALUES (?, ?, ?, ?, 'demo_api_key', 0, ?)
      `
};
