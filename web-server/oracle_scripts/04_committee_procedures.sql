-- ================================================================
-- Committee Procedures
-- Blood Donation System — Oracle 21c PL/SQL
-- ================================================================

-- Get committee dashboard stats
CREATE OR REPLACE PROCEDURE GET_COMMITTEE_DASHBOARD (
    p_user_id       IN  NUMBER,
    p_result_cursor OUT SYS_REFCURSOR
) AS
    v_committee_id NUMBER;
BEGIN
    SELECT COMMITTEE_ID INTO v_committee_id
    FROM USER_ROLE_LINK WHERE USER_ID = p_user_id AND ROLE_CODE = 'ORGANIZING_COMMITTEE';

    OPEN p_result_cursor FOR
        SELECT
            (SELECT COUNT(*) FROM DONATION_CAMP WHERE COMMITTEE_ID = v_committee_id AND STATUS IN ('PUBLISHED', 'ONGOING')) AS ACTIVE_CAMPS,
            (SELECT COUNT(*) FROM DONATION_TRANSFER WHERE COMMITTEE_ID = v_committee_id AND STATUS IN ('PREPARED', 'DISPATCHED', 'IN_TRANSIT')) AS PENDING_TRANSFERS,
            (SELECT COUNT(*) FROM CAMP_REGISTRATION cr JOIN DONATION_CAMP dc ON cr.CAMP_ID = dc.CAMP_ID WHERE dc.COMMITTEE_ID = v_committee_id) AS TOTAL_REGISTRATIONS,
            (SELECT COUNT(*) FROM VENUE WHERE COMMITTEE_ID = v_committee_id AND STATUS = 'ACTIVE') AS ACTIVE_VENUES
        FROM DUAL;
END GET_COMMITTEE_DASHBOARD;
/

-- Get committee venues
CREATE OR REPLACE PROCEDURE GET_COMMITTEE_VENUES (
    p_user_id       IN  NUMBER,
    p_result_cursor OUT SYS_REFCURSOR
) AS
    v_committee_id NUMBER;
BEGIN
    SELECT COMMITTEE_ID INTO v_committee_id
    FROM USER_ROLE_LINK WHERE USER_ID = p_user_id AND ROLE_CODE = 'ORGANIZING_COMMITTEE';

    OPEN p_result_cursor FOR
        SELECT VENUE_ID, VENUE_NAME, ADDRESS, CAPACITY, STATUS
        FROM VENUE
        WHERE COMMITTEE_ID = v_committee_id
        ORDER BY VENUE_NAME;
END GET_COMMITTEE_VENUES;
/

-- Get committee camps
CREATE OR REPLACE PROCEDURE GET_COMMITTEE_CAMPS (
    p_user_id       IN  NUMBER,
    p_result_cursor OUT SYS_REFCURSOR
) AS
    v_committee_id NUMBER;
BEGIN
    SELECT COMMITTEE_ID INTO v_committee_id
    FROM USER_ROLE_LINK WHERE USER_ID = p_user_id AND ROLE_CODE = 'ORGANIZING_COMMITTEE';

    OPEN p_result_cursor FOR
        SELECT dc.CAMP_ID, dc.CAMP_TITLE, dc.CAMP_DATE,
               dc.START_TIME, dc.END_TIME, dc.CAPACITY,
               dc.STATUS, dc.PUBLIC_VISIBLE,
               v.VENUE_NAME
        FROM DONATION_CAMP dc
        JOIN VENUE v ON dc.VENUE_ID = v.VENUE_ID
        WHERE dc.COMMITTEE_ID = v_committee_id
        ORDER BY dc.CAMP_DATE DESC;
END GET_COMMITTEE_CAMPS;
/

-- Create a new donation camp
CREATE OR REPLACE PROCEDURE CREATE_DONATION_CAMP (
    p_user_id   IN  NUMBER,
    p_venue_id  IN  NUMBER,
    p_title     IN  VARCHAR2,
    p_date      IN  DATE,
    p_start     IN  TIMESTAMP,
    p_end       IN  TIMESTAMP,
    p_capacity  IN  NUMBER,
    p_camp_id   OUT NUMBER
) AS
    v_committee_id NUMBER;
BEGIN
    SELECT COMMITTEE_ID INTO v_committee_id
    FROM USER_ROLE_LINK WHERE USER_ID = p_user_id AND ROLE_CODE = 'ORGANIZING_COMMITTEE';

    INSERT INTO DONATION_CAMP (COMMITTEE_ID, VENUE_ID, CAMP_TITLE, CAMP_DATE, START_TIME, END_TIME, CAPACITY, STATUS, PUBLIC_VISIBLE)
    VALUES (v_committee_id, p_venue_id, p_title, p_date, p_start, p_end, p_capacity, 'PUBLISHED', 'Y')
    RETURNING CAMP_ID INTO p_camp_id;

    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END CREATE_DONATION_CAMP;
/

-- Get camp attendance list
CREATE OR REPLACE PROCEDURE GET_CAMP_ATTENDANCE (
    p_user_id       IN  NUMBER,
    p_camp_id       IN  NUMBER,
    p_result_cursor OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_result_cursor FOR
        SELECT cr.REGISTRATION_ID, cr.DONOR_ID,
               cr.REGISTRATION_STATUS, cr.ATTENDANCE_STATUS,
               d.FULL_NAME, d.NIC, d.BLOOD_GROUP,
               CASE WHEN EXISTS (
                   SELECT 1 FROM DONATION_RECORD dr
                   WHERE dr.REGISTRATION_ID = cr.REGISTRATION_ID AND dr.STATUS IN ('DRAFT', 'SUBMITTED')
               ) THEN 1 ELSE 0 END AS HAS_DONATED
        FROM CAMP_REGISTRATION cr
        JOIN DONOR d ON cr.DONOR_ID = d.DONOR_ID
        WHERE cr.CAMP_ID = p_camp_id
        ORDER BY cr.REGISTERED_AT;
END GET_CAMP_ATTENDANCE;
/

-- Record a donation at a camp
CREATE OR REPLACE PROCEDURE RECORD_CAMP_DONATION (
    p_user_id         IN NUMBER,
    p_registration_id IN NUMBER,
    p_camp_id         IN NUMBER,
    p_donor_id        IN NUMBER,
    p_blood_group     IN VARCHAR2,
    p_units           IN NUMBER
) AS
BEGIN
    INSERT INTO DONATION_RECORD (REGISTRATION_ID, CAMP_ID, DONOR_ID, DONATION_DATE, BLOOD_GROUP, UNITS_COLLECTED, STATUS)
    VALUES (p_registration_id, p_camp_id, p_donor_id, TRUNC(SYSDATE), p_blood_group, p_units, 'SUBMITTED');

    -- Update attendance status
    UPDATE CAMP_REGISTRATION
    SET ATTENDANCE_STATUS = 'COMPLETED'
    WHERE REGISTRATION_ID = p_registration_id;

    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END RECORD_CAMP_DONATION;
/

-- Dispatch donation transfer to blood bank
CREATE OR REPLACE PROCEDURE DISPATCH_DONATION_TRANSFER (
    p_user_id       IN  NUMBER,
    p_camp_id       IN  NUMBER,
    p_blood_bank_id IN  NUMBER,
    p_transfer_id   OUT NUMBER,
    p_transfer_code OUT VARCHAR2
) AS
    v_committee_id NUMBER;
    v_count        NUMBER;
BEGIN
    SELECT COMMITTEE_ID INTO v_committee_id
    FROM USER_ROLE_LINK WHERE USER_ID = p_user_id AND ROLE_CODE = 'ORGANIZING_COMMITTEE';

    -- Check if there are submitted donations not yet transferred
    SELECT COUNT(*) INTO v_count
    FROM DONATION_RECORD dr
    WHERE dr.CAMP_ID = p_camp_id
      AND dr.STATUS = 'SUBMITTED'
      AND NOT EXISTS (SELECT 1 FROM DONATION_TRANSFER_ITEM dti WHERE dti.DONATION_ID = dr.DONATION_ID);

    IF v_count = 0 THEN
        p_transfer_id := -1;
        p_transfer_code := NULL;
        RETURN;
    END IF;

    -- Generate transfer code
    p_transfer_code := 'TRF-' || TO_CHAR(SYSDATE, 'YYYYMMDD') || '-' || TO_CHAR(DBMS_RANDOM.VALUE(1000, 9999), 'FM9999');

    -- Create transfer
    INSERT INTO DONATION_TRANSFER (CAMP_ID, COMMITTEE_ID, BLOOD_BANK_ID, TRANSFER_CODE, STATUS, DISPATCHED_AT)
    VALUES (p_camp_id, v_committee_id, p_blood_bank_id, p_transfer_code, 'DISPATCHED', SYSTIMESTAMP)
    RETURNING TRANSFER_ID INTO p_transfer_id;

    -- Link all untransferred donations
    INSERT INTO DONATION_TRANSFER_ITEM (TRANSFER_ID, DONATION_ID, UNITS_TRANSFERRED)
    SELECT p_transfer_id, dr.DONATION_ID, dr.UNITS_COLLECTED
    FROM DONATION_RECORD dr
    WHERE dr.CAMP_ID = p_camp_id
      AND dr.STATUS = 'SUBMITTED'
      AND NOT EXISTS (SELECT 1 FROM DONATION_TRANSFER_ITEM dti WHERE dti.DONATION_ID = dr.DONATION_ID);

    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END DISPATCH_DONATION_TRANSFER;
/

-- Update camp status
CREATE OR REPLACE PROCEDURE UPDATE_CAMP_STATUS (
    p_user_id  IN NUMBER,
    p_camp_id  IN NUMBER,
    p_status   IN VARCHAR2
) AS
    v_committee_id NUMBER;
BEGIN
    SELECT COMMITTEE_ID INTO v_committee_id
    FROM USER_ROLE_LINK WHERE USER_ID = p_user_id AND ROLE_CODE = 'ORGANIZING_COMMITTEE';

    UPDATE DONATION_CAMP
    SET STATUS = p_status, UPDATED_AT = SYSTIMESTAMP
    WHERE CAMP_ID = p_camp_id AND COMMITTEE_ID = v_committee_id;

    COMMIT;
END UPDATE_CAMP_STATUS;
/

-- Create a new venue
CREATE OR REPLACE PROCEDURE CREATE_VENUE (
    p_user_id    IN  NUMBER,
    p_venue_name IN  VARCHAR2,
    p_address    IN  VARCHAR2,
    p_capacity   IN  NUMBER,
    p_venue_id   OUT NUMBER
) AS
    v_committee_id NUMBER;
BEGIN
    SELECT COMMITTEE_ID INTO v_committee_id
    FROM USER_ROLE_LINK WHERE USER_ID = p_user_id AND ROLE_CODE = 'ORGANIZING_COMMITTEE';

    INSERT INTO VENUE (COMMITTEE_ID, VENUE_NAME, ADDRESS, CAPACITY, STATUS)
    VALUES (v_committee_id, p_venue_name, p_address, p_capacity, 'ACTIVE')
    RETURNING VENUE_ID INTO p_venue_id;

    COMMIT;
END CREATE_VENUE;
/

-- Get committee transfers
CREATE OR REPLACE PROCEDURE GET_COMMITTEE_TRANSFERS (
    p_user_id       IN  NUMBER,
    p_result_cursor OUT SYS_REFCURSOR
) AS
    v_committee_id NUMBER;
BEGIN
    SELECT COMMITTEE_ID INTO v_committee_id
    FROM USER_ROLE_LINK WHERE USER_ID = p_user_id AND ROLE_CODE = 'ORGANIZING_COMMITTEE';

    OPEN p_result_cursor FOR
        SELECT TRANSFER_ID, TRANSFER_CODE, STATUS, DISPATCHED_AT, RECEIVED_AT
        FROM DONATION_TRANSFER
        WHERE COMMITTEE_ID = v_committee_id
        ORDER BY DISPATCHED_AT DESC;
END GET_COMMITTEE_TRANSFERS;
/

-- Get committee staff
CREATE OR REPLACE PROCEDURE GET_COMMITTEE_STAFF (
    p_user_id       IN  NUMBER,
    p_result_cursor OUT SYS_REFCURSOR
) AS
    v_committee_id NUMBER;
BEGIN
    SELECT COMMITTEE_ID INTO v_committee_id
    FROM USER_ROLE_LINK WHERE USER_ID = p_user_id AND ROLE_CODE = 'ORGANIZING_COMMITTEE';

    OPEN p_result_cursor FOR
        SELECT sm.STAFF_ID, sm.FULL_NAME, sm.POSITION_TITLE,
               sm.PHONE, sm.EMAIL,
               csa.ASSIGNED_FROM, csa.STATUS
        FROM COMMITTEE_STAFF_ASSIGNMENT csa
        JOIN STAFF_MEMBER sm ON csa.STAFF_ID = sm.STAFF_ID
        WHERE csa.COMMITTEE_ID = v_committee_id
        ORDER BY csa.ASSIGNED_FROM DESC;
END GET_COMMITTEE_STAFF;
/

-- Add a staff member to a committee
CREATE OR REPLACE PROCEDURE ADD_COMMITTEE_STAFF (
    p_user_id    IN  NUMBER,
    p_full_name  IN  VARCHAR2,
    p_position   IN  VARCHAR2,
    p_phone      IN  VARCHAR2,
    p_email      IN  VARCHAR2,
    p_staff_id   OUT NUMBER
) AS
    v_committee_id NUMBER;
BEGIN
    SELECT COMMITTEE_ID INTO v_committee_id
    FROM USER_ROLE_LINK WHERE USER_ID = p_user_id AND ROLE_CODE = 'ORGANIZING_COMMITTEE';

    INSERT INTO STAFF_MEMBER (FULL_NAME, POSITION_TITLE, PHONE, EMAIL, STATUS)
    VALUES (p_full_name, p_position, p_phone, p_email, 'ACTIVE')
    RETURNING STAFF_ID INTO p_staff_id;

    INSERT INTO COMMITTEE_STAFF_ASSIGNMENT (STAFF_ID, COMMITTEE_ID, ASSIGNED_FROM, STATUS)
    VALUES (p_staff_id, v_committee_id, TRUNC(SYSDATE), 'ACTIVE');

    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END ADD_COMMITTEE_STAFF;
/

-- Remove (deactivate) a staff member from a committee
CREATE OR REPLACE PROCEDURE REMOVE_COMMITTEE_STAFF (
    p_user_id   IN NUMBER,
    p_staff_id  IN NUMBER
) AS
    v_committee_id NUMBER;
BEGIN
    SELECT COMMITTEE_ID INTO v_committee_id
    FROM USER_ROLE_LINK WHERE USER_ID = p_user_id AND ROLE_CODE = 'ORGANIZING_COMMITTEE';

    UPDATE COMMITTEE_STAFF_ASSIGNMENT
    SET STATUS = 'INACTIVE', ASSIGNED_TO = TRUNC(SYSDATE)
    WHERE STAFF_ID = p_staff_id AND COMMITTEE_ID = v_committee_id;

    UPDATE STAFF_MEMBER
    SET STATUS = 'INACTIVE'
    WHERE STAFF_ID = p_staff_id;

    COMMIT;
END REMOVE_COMMITTEE_STAFF;
/
