-- ================================================================
-- Blood Bank Procedures
-- Blood Donation System — Oracle 21c PL/SQL
-- ================================================================

-- Get blood bank dashboard stats
CREATE OR REPLACE PROCEDURE GET_BANK_DASHBOARD (
    p_user_id       IN  NUMBER,
    p_result_cursor OUT SYS_REFCURSOR
) AS
    v_bank_id NUMBER;
BEGIN
    SELECT BLOOD_BANK_ID INTO v_bank_id
    FROM USER_ROLE_LINK WHERE USER_ID = p_user_id AND ROLE_CODE = 'BLOOD_BANK';

    OPEN p_result_cursor FOR
        SELECT
            (SELECT COUNT(*) FROM BLOOD_UNIT WHERE BLOOD_BANK_ID = v_bank_id AND STATUS = 'AVAILABLE') AS TOTAL_UNITS,
            (SELECT COUNT(*) FROM DONATION_TRANSFER WHERE BLOOD_BANK_ID = v_bank_id AND STATUS IN ('DISPATCHED', 'IN_TRANSIT')) AS INCOMING_TRANSFERS,
            (SELECT COUNT(*) FROM HOSPITAL_BLOOD_REQUEST WHERE BLOOD_BANK_ID = v_bank_id AND STATUS = 'PENDING') AS PENDING_REQUESTS,
            (SELECT COUNT(*) FROM BLOOD_UNIT WHERE BLOOD_BANK_ID = v_bank_id AND STATUS = 'AVAILABLE' AND EXPIRY_DATE <= TRUNC(SYSDATE) + 7) AS EXPIRING_SOON
        FROM DUAL;
END GET_BANK_DASHBOARD;
/

-- Get blood bank inventory
CREATE OR REPLACE PROCEDURE GET_BANK_INVENTORY (
    p_user_id       IN  NUMBER,
    p_result_cursor OUT SYS_REFCURSOR
) AS
    v_bank_id NUMBER;
BEGIN
    SELECT BLOOD_BANK_ID INTO v_bank_id
    FROM USER_ROLE_LINK WHERE USER_ID = p_user_id AND ROLE_CODE = 'BLOOD_BANK';

    OPEN p_result_cursor FOR
        SELECT BLOOD_UNIT_ID, UNIT_CODE, BLOOD_GROUP, COLLECTION_DATE,
               EXPIRY_DATE, STATUS, STORAGE_LOCATION
        FROM BLOOD_UNIT
        WHERE BLOOD_BANK_ID = v_bank_id
        ORDER BY EXPIRY_DATE ASC;
END GET_BANK_INVENTORY;
/

-- Get blood bank transfers
CREATE OR REPLACE PROCEDURE GET_BANK_TRANSFERS (
    p_user_id       IN  NUMBER,
    p_result_cursor OUT SYS_REFCURSOR
) AS
    v_bank_id NUMBER;
BEGIN
    SELECT BLOOD_BANK_ID INTO v_bank_id
    FROM USER_ROLE_LINK WHERE USER_ID = p_user_id AND ROLE_CODE = 'BLOOD_BANK';

    OPEN p_result_cursor FOR
        SELECT dt.TRANSFER_ID, dt.TRANSFER_CODE, dt.STATUS,
               dt.CREATED_AT, dt.DISPATCHED_AT, dt.RECEIVED_AT, dt.RECEIVED_UNIT_COUNT,
               dc.CAMP_TITLE,
               oc.COMMITTEE_NAME
        FROM DONATION_TRANSFER dt
        JOIN DONATION_CAMP dc ON dt.CAMP_ID = dc.CAMP_ID
        JOIN ORGANIZING_COMMITTEE oc ON dt.COMMITTEE_ID = oc.COMMITTEE_ID
        WHERE dt.BLOOD_BANK_ID = v_bank_id
        ORDER BY dt.CREATED_AT DESC;
END GET_BANK_TRANSFERS;
/

-- Receive a transfer (mark as RECEIVED)
CREATE OR REPLACE PROCEDURE RECEIVE_TRANSFER (
    p_user_id     IN NUMBER,
    p_transfer_id IN NUMBER
) AS
    v_bank_id NUMBER;
BEGIN
    SELECT BLOOD_BANK_ID INTO v_bank_id
    FROM USER_ROLE_LINK WHERE USER_ID = p_user_id AND ROLE_CODE = 'BLOOD_BANK';

    UPDATE DONATION_TRANSFER
    SET STATUS = 'RECEIVED',
        RECEIVED_AT = SYSTIMESTAMP
    WHERE TRANSFER_ID = p_transfer_id
      AND BLOOD_BANK_ID = v_bank_id
      AND STATUS IN ('DISPATCHED', 'IN_TRANSIT');

    COMMIT;
END RECEIVE_TRANSFER;
/

-- Get hospital blood requests for a bank
CREATE OR REPLACE PROCEDURE GET_BANK_HOSPITAL_REQUESTS (
    p_user_id       IN  NUMBER,
    p_result_cursor OUT SYS_REFCURSOR
) AS
    v_bank_id NUMBER;
BEGIN
    SELECT BLOOD_BANK_ID INTO v_bank_id
    FROM USER_ROLE_LINK WHERE USER_ID = p_user_id AND ROLE_CODE = 'BLOOD_BANK';

    OPEN p_result_cursor FOR
        SELECT hr.REQUEST_ID, hr.REQUEST_CODE,
               h.HOSPITAL_NAME,
               hr.BLOOD_GROUP, hr.UNITS_REQUIRED, hr.UNITS_ALLOCATED, hr.UNITS_FULFILLED,
               hr.NEEDED_BY, hr.PRIORITY, hr.STATUS
        FROM HOSPITAL_BLOOD_REQUEST hr
        JOIN HOSPITAL h ON hr.HOSPITAL_ID = h.HOSPITAL_ID
        WHERE hr.BLOOD_BANK_ID = v_bank_id
        ORDER BY CASE hr.PRIORITY
            WHEN 'CRITICAL' THEN 1
            WHEN 'HIGH' THEN 2
            WHEN 'NORMAL' THEN 3
            WHEN 'LOW' THEN 4
            ELSE 5
        END, hr.NEEDED_BY ASC;
END GET_BANK_HOSPITAL_REQUESTS;
/

-- Get staff assigned to a blood bank
CREATE OR REPLACE PROCEDURE GET_BANK_STAFF (
    p_user_id       IN  NUMBER,
    p_result_cursor OUT SYS_REFCURSOR
) AS
    v_bank_id NUMBER;
BEGIN
    SELECT BLOOD_BANK_ID INTO v_bank_id
    FROM USER_ROLE_LINK WHERE USER_ID = p_user_id AND ROLE_CODE = 'BLOOD_BANK';

    OPEN p_result_cursor FOR
        SELECT sm.STAFF_ID, sm.FULL_NAME, sm.POSITION_TITLE,
               sm.PHONE, sm.EMAIL,
               bsa.ASSIGNED_FROM, bsa.STATUS
        FROM BANK_STAFF_ASSIGNMENT bsa
        JOIN STAFF_MEMBER sm ON bsa.STAFF_ID = sm.STAFF_ID
        WHERE bsa.BLOOD_BANK_ID = v_bank_id
        ORDER BY bsa.ASSIGNED_FROM DESC;
END GET_BANK_STAFF;
/

-- Update blood unit status
CREATE OR REPLACE PROCEDURE UPDATE_UNIT_STATUS (
    p_user_id  IN NUMBER,
    p_unit_id  IN NUMBER,
    p_status   IN VARCHAR2
) AS
    v_bank_id NUMBER;
BEGIN
    SELECT BLOOD_BANK_ID INTO v_bank_id
    FROM USER_ROLE_LINK WHERE USER_ID = p_user_id AND ROLE_CODE = 'BLOOD_BANK';

    UPDATE BLOOD_UNIT
    SET STATUS = p_status, UPDATED_AT = SYSTIMESTAMP
    WHERE BLOOD_UNIT_ID = p_unit_id AND BLOOD_BANK_ID = v_bank_id;

    COMMIT;
END UPDATE_UNIT_STATUS;
/

-- Update hospital request status
CREATE OR REPLACE PROCEDURE UPDATE_REQUEST_STATUS (
    p_user_id    IN NUMBER,
    p_request_id IN NUMBER,
    p_status     IN VARCHAR2
) AS
    v_bank_id NUMBER;
BEGIN
    SELECT BLOOD_BANK_ID INTO v_bank_id
    FROM USER_ROLE_LINK WHERE USER_ID = p_user_id AND ROLE_CODE = 'BLOOD_BANK';

    UPDATE HOSPITAL_BLOOD_REQUEST
    SET STATUS = p_status, UPDATED_AT = SYSTIMESTAMP
    WHERE REQUEST_ID = p_request_id AND BLOOD_BANK_ID = v_bank_id;

    COMMIT;
END UPDATE_REQUEST_STATUS;
/

-- Add a staff member to a blood bank
CREATE OR REPLACE PROCEDURE ADD_BANK_STAFF (
    p_user_id    IN  NUMBER,
    p_full_name  IN  VARCHAR2,
    p_position   IN  VARCHAR2,
    p_phone      IN  VARCHAR2,
    p_email      IN  VARCHAR2,
    p_staff_id   OUT NUMBER
) AS
    v_bank_id NUMBER;
BEGIN
    SELECT BLOOD_BANK_ID INTO v_bank_id
    FROM USER_ROLE_LINK WHERE USER_ID = p_user_id AND ROLE_CODE = 'BLOOD_BANK';

    INSERT INTO STAFF_MEMBER (FULL_NAME, POSITION_TITLE, PHONE, EMAIL, STATUS)
    VALUES (p_full_name, p_position, p_phone, p_email, 'ACTIVE')
    RETURNING STAFF_ID INTO p_staff_id;

    INSERT INTO BANK_STAFF_ASSIGNMENT (STAFF_ID, BLOOD_BANK_ID, ASSIGNED_FROM, STATUS)
    VALUES (p_staff_id, v_bank_id, TRUNC(SYSDATE), 'ACTIVE');

    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END ADD_BANK_STAFF;
/

-- Remove (deactivate) a staff member from a blood bank
CREATE OR REPLACE PROCEDURE REMOVE_BANK_STAFF (
    p_user_id   IN NUMBER,
    p_staff_id  IN NUMBER
) AS
    v_bank_id NUMBER;
BEGIN
    SELECT BLOOD_BANK_ID INTO v_bank_id
    FROM USER_ROLE_LINK WHERE USER_ID = p_user_id AND ROLE_CODE = 'BLOOD_BANK';

    UPDATE BANK_STAFF_ASSIGNMENT
    SET STATUS = 'INACTIVE', ASSIGNED_TO = TRUNC(SYSDATE)
    WHERE STAFF_ID = p_staff_id AND BLOOD_BANK_ID = v_bank_id;

    UPDATE STAFF_MEMBER
    SET STATUS = 'INACTIVE'
    WHERE STAFF_ID = p_staff_id;

    COMMIT;
END REMOVE_BANK_STAFF;
/
