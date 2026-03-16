# Database Normalization

This document outlines the normalization steps (1NF, 2NF, 3NF) applied to the Secure Identity System database to avoid data anomalies and ensure data integrity.

## 1. First Normal Form (1NF)

**Rule:** Ensure atomicity. Each column must contain atomic (single) values. There should be no repeating groups or arrays. Every table must have a Primary Key.

**Example: `UPLOADED_DOCUMENT` Table**

If unnormalized, a single row might contain a list of document names.

**❌ BEFORE 1NF:**
```
citizen_id | doc_names
1          | Aadhaar Card, PAN Card, Passport
```

**✅ AFTER 1NF (Our implementation):**
```
UPLOADED_DOCUMENT
+-----------+------------+----------------+
| upload_id | account_id | file_name      |
+-----------+------------+----------------+
|     1     |     1      | Aadhaar Card   |
|     2     |     1      | PAN Card       |
|     3     |     1      | Passport       |
+-----------+------------+----------------+
```
*   **Result:** Each row now holds a single document. `upload_id` serves as the primary key. Repeating groups are eliminated.

---

## 2. Second Normal Form (2NF)

**Rule:** Ensure 1NF and eliminate partial dependencies. Every non-key attribute must depend on the *entire* primary key (this primarily applies to composite primary keys).

**Example: `ACCESS_REQUEST` and `REQUESTER_ORGANIZATION` Tables**

Suppose we initially tracked access requests and the requesting organization's details in a single table with a composite key.

**❌ BEFORE 2NF (Hypothetical):**
Imagine a table with PK (`request_id`, `requester_id`):
```
request_id | requester_id | upload_id | org_name   | status
1          | 2            | 3         | DigiLocker | Pending
```
*   *Problem:* `org_name` depends only on `requester_id`, not on the full composite key (`request_id`, `requester_id`). This is a partial dependency.

**✅ AFTER 2NF (Our implementation):**
We separated the organization details into its own table.

**`ACCESS_REQUEST`**
```
+-------------------+--------------+-------------+---------+
| access_request_id | requester_id | document_id | status  |
+-------------------+--------------+-------------+---------+
|         1         |      2       |      3      | Pending |
+-------------------+--------------+-------------+---------+
```

**`REQUESTER_ORGANIZATION`**
```
+--------------+------------+
| requester_id | org_name   |
+--------------+------------+
|      2       | DigiLocker |
+--------------+------------+
```
*   **Result:** `org_name` now resides in `REQUESTER_ORGANIZATION` and depends entirely on its primary key, `requester_id`.

---

## 3. Third Normal Form (3NF)

**Rule:** Ensure 2NF and eliminate transitive dependencies. No non-key attribute should depend on another non-key attribute.

**Example: `DIGITAL_ACCOUNT` and `CITIZEN` Tables**

**❌ BEFORE 3NF:**
```
DIGITAL_ACCOUNT
+------------+------------+----------+--------------+---------+
| account_id | citizen_id | username | citizen_name | aadhaar |
+------------+------------+----------+--------------+---------+
|     1      |     1      | arjun95  | Arjun Sharma | 123456  |
+------------+------------+----------+--------------+---------+
```
*   *Problem:* `citizen_name` and `aadhaar` depend on `citizen_id` (a non-key attribute in this table), not directly on `account_id` (the primary key). (`account_id` -> `citizen_id` -> `citizen_name`).

**✅ AFTER 3NF (Our implementation):**
We split personal details into the `CITIZEN` table.

**`DIGITAL_ACCOUNT`**
```
+------------+------------+----------+
| account_id | citizen_id | username |
+------------+------------+----------+
|     1      |     1      | arjun95  |
+------------+------------+----------+
```

**`CITIZEN`**
```
+------------+--------------+---------+
| citizen_id | full_name    | aadhaar |
+------------+--------------+---------+
|     1      | Arjun Sharma | 123456  |
+------------+--------------+---------+
```
*   **Result:** Transitive dependencies are removed. Personal details reside in the `CITIZEN` table, depending solely on `citizen_id`.

---

## 4. Avoiding Data Anomalies

Normalization eliminates these common database anomalies:

### 1. Insert Anomaly (Avoided)

*   **Problem:** If `org_name` was stored inside `ACCESS_REQUEST`, you could not add a new requesting organization to the system until they made at least one access request.
*   **Solution (Our implementation):** We have a separate `REQUESTER_ORGANIZATION` table. We can insert a new organization independently of any access requests.
    ```sql
    INSERT INTO REQUESTER_ORGANIZATION (org_name, org_type)
    VALUES ('New Bank', 'Private');
    ```

### 2. Update Anomaly (Avoided)

*   **Problem:** If "DigiLocker" was stored in 50 rows of a monolithic `ACCESS_REQUEST` table, changing the organization's name would require updating all 50 rows, risking inconsistencies.
*   **Solution (Our implementation):** The name is stored exactly once in `REQUESTER_ORGANIZATION`.
    ```sql
    UPDATE REQUESTER_ORGANIZATION
    SET org_name = 'DigiLocker India'
    WHERE requester_id = 2;
    ```
    This single update is instantly reflected across all related access requests.

### 3. Delete Anomaly (Avoided)

*   **Problem:** If citizen details, account details, and uploaded documents were all stored in one table, deleting a document might accidentally delete the user's personal information.
*   **Solution (Our implementation):** Entities are cleanly separated.
    ```sql
    DELETE FROM UPLOADED_DOCUMENT
    WHERE upload_id = 7;
    ```
    This command securely deletes *only* the specific uploaded document. The corresponding `CITIZEN` and `DIGITAL_ACCOUNT` records remain perfectly intact.
