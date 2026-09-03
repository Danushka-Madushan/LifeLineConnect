-- ================================================================
-- LifeLineConnect PL/SQL Operations
-- This file contains procedures, functions, cursors, and triggers
-- added incrementally per frontend/backend tasks.
-- ================================================================

-- To be populated as tasks require backend PL/SQL logic.

-- ================================================================
-- [HOME-05] / [HOME-11] / [HOME-13]
-- Function to determine if a camp is publicly visible
-- ================================================================
CREATE OR REPLACE FUNCTION IS_PUBLICLY_VISIBLE(p_camp_id IN NUMBER) RETURN NUMBER IS
    v_status VARCHAR2(20);
    v_public_flag NUMBER;
BEGIN
    SELECT lifecycle_status, is_public_visible 
    INTO v_status, v_public_flag
    FROM donation_camp
    WHERE camp_id = p_camp_id;

    IF v_public_flag = 1 AND v_status IN ('PUBLISHED', 'ONGOING', 'COMPLETED') THEN
        RETURN 1;
    ELSE
        RETURN 0;
    END IF;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RETURN 0;
    END IS_PUBLICLY_VISIBLE;
    /

-- ================================================================
-- [DONOR-01]
-- Procedure to register a new donor (atomically inserts into 
-- APP_USER, DONOR, and USER_ROLE_LINK)
-- ================================================================
CREATE OR REPLACE PROCEDURE REGISTER_DONOR(
    p_username      IN VARCHAR2,
    p_email         IN VARCHAR2,
    p_password_hash IN VARCHAR2,
    p_full_name     IN VARCHAR2,
    p_nic           IN VARCHAR2,
    p_date_of_birth IN DATE,
    p_gender        IN VARCHAR2,
    p_phone         IN VARCHAR2,
    p_address       IN VARCHAR2,
    p_user_id       OUT NUMBER,
    p_donor_id      OUT NUMBER
) AS
BEGIN
    -- 1. Create the base Application User
    INSERT INTO APP_USER (USERNAME, EMAIL, PASSWORD_HASH, ACCOUNT_STATUS)
    VALUES (p_username, p_email, p_password_hash, 'ACTIVE')
    RETURNING USER_ID INTO p_user_id;

    -- 2. Create the Donor Profile
    INSERT INTO DONOR (USER_ID, FULL_NAME, NIC, DATE_OF_BIRTH, GENDER, PHONE, EMAIL, ADDRESS, STATUS)
    VALUES (p_user_id, p_full_name, p_nic, p_date_of_birth, p_gender, p_phone, p_email, p_address, 'ACTIVE')
    RETURNING DONOR_ID INTO p_donor_id;

    -- 3. Link User and Role
    INSERT INTO USER_ROLE_LINK (USER_ID, ROLE_CODE, DONOR_ID)
    VALUES (p_user_id, 'DONOR', p_donor_id);

    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END REGISTER_DONOR;
/

-- ================================================================
-- [AUTH-02]
-- Procedure to retrieve authentication info by username
-- ================================================================
CREATE OR REPLACE PROCEDURE AUTHENTICATE_USER(
    p_username       IN VARCHAR2,
    p_user_id        OUT NUMBER,
    p_password_hash  OUT VARCHAR2,
    p_account_status OUT VARCHAR2,
    p_role_code      OUT VARCHAR2
) AS
BEGIN
    SELECT u.USER_ID, u.PASSWORD_HASH, u.ACCOUNT_STATUS, r.ROLE_CODE
    INTO p_user_id, p_password_hash, p_account_status, p_role_code
    FROM APP_USER u
    JOIN USER_ROLE_LINK r ON u.USER_ID = r.USER_ID
    WHERE u.USERNAME = p_username OR u.EMAIL = p_username;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        p_user_id := NULL;
        p_password_hash := NULL;
        p_account_status := NULL;
        p_role_code := NULL;
END AUTHENTICATE_USER;
/

-- ================================================================
-- [WEBMASTER-01]
-- Procedure to get high-level webmaster dashboard overview
-- ================================================================
CREATE OR REPLACE PROCEDURE GET_WEBMASTER_DASHBOARD(
    p_result_cursor OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_result_cursor FOR
    SELECT 
        (SELECT COUNT(*) FROM DONOR WHERE STATUS = 'ACTIVE') AS TOTAL_DONORS,
        (SELECT COUNT(*) FROM BLOOD_BANK WHERE STATUS = 'ACTIVE') AS TOTAL_BANKS,
        (SELECT COUNT(*) FROM ORGANIZING_COMMITTEE WHERE STATUS = 'ACTIVE') AS TOTAL_COMMITTEES,
        (SELECT COUNT(*) FROM DONATION_CAMP WHERE STATUS = 'ONGOING') AS ONGOING_CAMPS,
        (SELECT COUNT(*) FROM DONATION_CAMP WHERE STATUS = 'COMPLETED') AS COMPLETED_CAMPS,
        (SELECT COUNT(*) FROM DONATION_RECORD WHERE STATUS = 'SUBMITTED') AS TOTAL_DONATIONS,
        (SELECT COUNT(*) FROM HOSPITAL_BLOOD_REQUEST WHERE STATUS = 'PENDING') AS PENDING_REQUESTS
    FROM DUAL;
END GET_WEBMASTER_DASHBOARD;
/
-- ================================================================
-- DONOR-03: Get Profile
-- ================================================================
CREATE OR REPLACE PROCEDURE GET_DONOR_PROFILE(
    p_user_id IN NUMBER,
    p_result_cursor OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_result_cursor FOR
    SELECT DONOR_ID, FULL_NAME, NIC, DATE_OF_BIRTH, GENDER, BLOOD_GROUP, PHONE, EMAIL, ADDRESS, STATUS
    FROM DONOR
    WHERE USER_ID = p_user_id;
END GET_DONOR_PROFILE;
/

-- ================================================================
-- DONOR-03: Update Profile
-- ================================================================
CREATE OR REPLACE PROCEDURE UPDATE_DONOR_PROFILE(
    p_user_id     IN NUMBER,
    p_full_name   IN VARCHAR2,
    p_phone       IN VARCHAR2,
    p_email       IN VARCHAR2,
    p_address     IN VARCHAR2,
    p_blood_group IN VARCHAR2,
    p_gender      IN VARCHAR2
) AS
BEGIN
    UPDATE DONOR
    SET FULL_NAME = NVL(p_full_name, FULL_NAME),
        PHONE = NVL(p_phone, PHONE),
        EMAIL = NVL(p_email, EMAIL),
        ADDRESS = NVL(p_address, ADDRESS),
        BLOOD_GROUP = NVL(p_blood_group, BLOOD_GROUP),
        GENDER = NVL(p_gender, GENDER),
        UPDATED_AT = SYSTIMESTAMP
    WHERE USER_ID = p_user_id;
    
    UPDATE APP_USER
    SET EMAIL = NVL(p_email, EMAIL)
    WHERE USER_ID = p_user_id;
    
    COMMIT;
END UPDATE_DONOR_PROFILE;
/

-- ================================================================
-- DONOR-04 & DONOR-05: Check Eligibility
-- ================================================================
CREATE OR REPLACE PROCEDURE CHECK_DONOR_ELIGIBILITY(
    p_user_id    IN NUMBER,
    p_eligible   OUT NUMBER,
    p_reason     OUT VARCHAR2,
    p_next_date  OUT DATE
) AS
    v_donor_id NUMBER;
    v_last_donation DATE;
    v_days_since NUMBER;
BEGIN
    SELECT DONOR_ID INTO v_donor_id FROM DONOR WHERE USER_ID = p_user_id;
    
    -- Get the most recent SUBMITTED donation date
    BEGIN
        SELECT MAX(DONATION_DATE) INTO v_last_donation
        FROM DONATION_RECORD
        WHERE DONOR_ID = v_donor_id AND STATUS = 'SUBMITTED';
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            v_last_donation := NULL;
    END;
    
    IF v_last_donation IS NULL THEN
        p_eligible := 1;
        p_reason := 'Eligible to donate.';
        p_next_date := TRUNC(SYSDATE);
    ELSE
        v_days_since := TRUNC(SYSDATE) - TRUNC(v_last_donation);
        IF v_days_since >= 90 THEN
            p_eligible := 1;
            p_reason := 'Eligible to donate.';
            p_next_date := TRUNC(SYSDATE);
        ELSE
            p_eligible := 0;
            p_reason := 'You must wait 90 days between donations.';
            p_next_date := TRUNC(v_last_donation) + 90;
        END IF;
    END IF;
END CHECK_DONOR_ELIGIBILITY;
/

-- ================================================================
-- DONOR-02: Dashboard summaries
-- ================================================================
CREATE OR REPLACE PROCEDURE GET_DONOR_DASHBOARD(
    p_user_id IN NUMBER,
    p_result_cursor OUT SYS_REFCURSOR
) AS
    v_donor_id NUMBER;
BEGIN
    SELECT DONOR_ID INTO v_donor_id FROM DONOR WHERE USER_ID = p_user_id;
    
    OPEN p_result_cursor FOR
    SELECT 
        (SELECT COUNT(*) FROM DONATION_RECORD WHERE DONOR_ID = v_donor_id AND STATUS = 'SUBMITTED') AS TOTAL_DONATIONS,
        (SELECT COUNT(*) FROM CAMP_REGISTRATION WHERE DONOR_ID = v_donor_id AND REGISTRATION_STATUS IN ('REGISTERED', 'WAITLISTED')) AS UPCOMING_CAMPS,
        (SELECT MAX(DONATION_DATE) FROM DONATION_RECORD WHERE DONOR_ID = v_donor_id AND STATUS = 'SUBMITTED') AS LAST_DONATION_DATE
    FROM DUAL;
END GET_DONOR_DASHBOARD;
/

-- ================================================================
-- DONOR-08: Register for Camp
-- ================================================================
CREATE OR REPLACE PROCEDURE REGISTER_DONOR_FOR_CAMP(
    p_user_id         IN NUMBER,
    p_camp_id         IN NUMBER,
    p_registration_id OUT NUMBER,
    p_status          OUT VARCHAR2
) AS
    v_donor_id NUMBER;
    v_exists NUMBER;
BEGIN
    SELECT DONOR_ID INTO v_donor_id FROM DONOR WHERE USER_ID = p_user_id;
    
    -- Check if already registered
    SELECT COUNT(*) INTO v_exists FROM CAMP_REGISTRATION 
    WHERE DONOR_ID = v_donor_id AND CAMP_ID = p_camp_id AND REGISTRATION_STATUS != 'CANCELLED';
    
    IF v_exists > 0 THEN
        p_status := 'ALREADY_REGISTERED';
        RETURN;
    END IF;
    
    INSERT INTO CAMP_REGISTRATION (CAMP_ID, DONOR_ID, REGISTRATION_STATUS, ATTENDANCE_STATUS)
    VALUES (p_camp_id, v_donor_id, 'REGISTERED', 'EXPECTED')
    RETURNING REGISTRATION_ID INTO p_registration_id;
    
    p_status := 'SUCCESS';
    COMMIT;
END REGISTER_DONOR_FOR_CAMP;
/

-- ================================================================
-- DONOR-09: Upcoming Registered Camps
-- ================================================================
CREATE OR REPLACE PROCEDURE GET_DONOR_UPCOMING_REGISTRATIONS(
    p_user_id IN NUMBER,
    p_result_cursor OUT SYS_REFCURSOR
) AS
    v_donor_id NUMBER;
BEGIN
    SELECT DONOR_ID INTO v_donor_id FROM DONOR WHERE USER_ID = p_user_id;
    
    OPEN p_result_cursor FOR
    SELECT r.REGISTRATION_ID, r.REGISTRATION_STATUS, c.CAMP_ID, c.CAMP_TITLE, c.CAMP_DATE, c.START_TIME, c.END_TIME, v.VENUE_NAME
    FROM CAMP_REGISTRATION r
    JOIN DONATION_CAMP c ON r.CAMP_ID = c.CAMP_ID
    JOIN VENUE v ON c.VENUE_ID = v.VENUE_ID
    WHERE r.DONOR_ID = v_donor_id 
      AND r.REGISTRATION_STATUS IN ('REGISTERED', 'WAITLISTED')
      AND c.STATUS IN ('PUBLISHED', 'ONGOING')
    ORDER BY c.CAMP_DATE ASC;
END GET_DONOR_UPCOMING_REGISTRATIONS;
/

-- ================================================================
-- DONOR-10 / 11: Donation History
-- ================================================================
CREATE OR REPLACE PROCEDURE GET_DONOR_DONATION_HISTORY(
    p_user_id IN NUMBER,
    p_result_cursor OUT SYS_REFCURSOR
) AS
    v_donor_id NUMBER;
BEGIN
    SELECT DONOR_ID INTO v_donor_id FROM DONOR WHERE USER_ID = p_user_id;
    
    OPEN p_result_cursor FOR
    SELECT d.DONATION_ID, d.DONATION_DATE, d.BLOOD_GROUP, d.UNITS_COLLECTED, d.STATUS, 
           c.CAMP_TITLE, c.CAMP_ID, v.VENUE_NAME
    FROM DONATION_RECORD d
    JOIN DONATION_CAMP c ON d.CAMP_ID = c.CAMP_ID
    JOIN VENUE v ON c.VENUE_ID = v.VENUE_ID
    WHERE d.DONOR_ID = v_donor_id AND d.STATUS = 'SUBMITTED'
    ORDER BY d.DONATION_DATE DESC;
END GET_DONOR_DONATION_HISTORY;
/

-- ================================================================
-- DONOR-13: Can Submit Feedback?
-- ================================================================
CREATE OR REPLACE PROCEDURE CAN_SUBMIT_FEEDBACK(
    p_user_id  IN NUMBER,
    p_camp_id  IN NUMBER,
    p_allowed  OUT NUMBER
) AS
    v_donor_id NUMBER;
    v_count NUMBER;
BEGIN
    SELECT DONOR_ID INTO v_donor_id FROM DONOR WHERE USER_ID = p_user_id;
    
    -- Check if donor has a submitted donation for this camp
    SELECT COUNT(*) INTO v_count 
    FROM DONATION_RECORD 
    WHERE DONOR_ID = v_donor_id AND CAMP_ID = p_camp_id AND STATUS = 'SUBMITTED';
    
    IF v_count > 0 THEN
        p_allowed := 1;
    ELSE
        p_allowed := 0;
    END IF;
END CAN_SUBMIT_FEEDBACK;
/
-- ================================================================
-- Blood Bank Procedures
-- ================================================================

CREATE OR REPLACE PROCEDURE GET_BANK_DASHBOARD(
    p_user_id IN NUMBER,
    p_result_cursor OUT SYS_REFCURSOR
) AS
    v_bank_id NUMBER;
BEGIN
    SELECT BLOOD_BANK_ID INTO v_bank_id FROM USER_ROLE_LINK WHERE USER_ID = p_user_id AND ROLE_CODE = 'BLOOD_BANK';
    
    OPEN p_result_cursor FOR
    SELECT 
        (SELECT COUNT(*) FROM BLOOD_UNIT WHERE BLOOD_BANK_ID = v_bank_id AND STATUS = 'AVAILABLE') AS TOTAL_UNITS,
        (SELECT COUNT(*) FROM DONATION_TRANSFER WHERE BLOOD_BANK_ID = v_bank_id AND STATUS IN ('DISPATCHED', 'IN_TRANSIT')) AS INCOMING_TRANSFERS,
        (SELECT COUNT(*) FROM HOSPITAL_BLOOD_REQUEST WHERE BLOOD_BANK_ID = v_bank_id AND STATUS = 'PENDING') AS PENDING_REQUESTS,
        (SELECT COUNT(*) FROM BLOOD_UNIT WHERE BLOOD_BANK_ID = v_bank_id AND STATUS = 'AVAILABLE' AND EXPIRY_DATE < SYSDATE + 7) AS EXPIRING_SOON
    FROM DUAL;
END GET_BANK_DASHBOARD;
/

CREATE OR REPLACE PROCEDURE GET_BANK_INVENTORY(
    p_user_id IN NUMBER,
    p_result_cursor OUT SYS_REFCURSOR
) AS
    v_bank_id NUMBER;
BEGIN
    SELECT BLOOD_BANK_ID INTO v_bank_id FROM USER_ROLE_LINK WHERE USER_ID = p_user_id AND ROLE_CODE = 'BLOOD_BANK';
    
    -- Auto-expire any units past expiry date
    UPDATE BLOOD_UNIT
    SET STATUS = 'EXPIRED', UPDATED_AT = SYSTIMESTAMP
    WHERE BLOOD_BANK_ID = v_bank_id AND STATUS = 'AVAILABLE' AND EXPIRY_DATE < TRUNC(SYSDATE);
    
    COMMIT;
    
    OPEN p_result_cursor FOR
    SELECT BLOOD_UNIT_ID, UNIT_CODE, BLOOD_GROUP, COLLECTION_DATE, EXPIRY_DATE, STATUS, STORAGE_LOCATION
    FROM BLOOD_UNIT
    WHERE BLOOD_BANK_ID = v_bank_id
    ORDER BY EXPIRY_DATE ASC;
END GET_BANK_INVENTORY;
/

CREATE OR REPLACE PROCEDURE GET_BANK_TRANSFERS(
    p_user_id IN NUMBER,
    p_result_cursor OUT SYS_REFCURSOR
) AS
    v_bank_id NUMBER;
BEGIN
    SELECT BLOOD_BANK_ID INTO v_bank_id FROM USER_ROLE_LINK WHERE USER_ID = p_user_id AND ROLE_CODE = 'BLOOD_BANK';
    
    OPEN p_result_cursor FOR
    SELECT t.TRANSFER_ID, t.TRANSFER_CODE, t.STATUS, t.CREATED_AT, t.DISPATCHED_AT, t.RECEIVED_AT, t.RECEIVED_UNIT_COUNT,
           c.CAMP_TITLE, org.COMMITTEE_NAME
    FROM DONATION_TRANSFER t
    JOIN DONATION_CAMP c ON t.CAMP_ID = c.CAMP_ID
    JOIN ORGANIZING_COMMITTEE org ON t.COMMITTEE_ID = org.COMMITTEE_ID
    WHERE t.BLOOD_BANK_ID = v_bank_id
    ORDER BY t.CREATED_AT DESC;
END GET_BANK_TRANSFERS;
/

CREATE OR REPLACE PROCEDURE RECEIVE_TRANSFER(
    p_user_id IN NUMBER,
    p_transfer_id IN NUMBER
) AS
    v_bank_id NUMBER;
    v_status VARCHAR2(20);
    v_count NUMBER := 0;
    
    CURSOR c_items IS
        SELECT ti.DONATION_ID, dr.BLOOD_GROUP, dr.DONATION_DATE
        FROM DONATION_TRANSFER_ITEM ti
        JOIN DONATION_RECORD dr ON ti.DONATION_ID = dr.DONATION_ID
        WHERE ti.TRANSFER_ID = p_transfer_id;
BEGIN
    SELECT BLOOD_BANK_ID INTO v_bank_id FROM USER_ROLE_LINK WHERE USER_ID = p_user_id AND ROLE_CODE = 'BLOOD_BANK';
    
    SELECT STATUS INTO v_status FROM DONATION_TRANSFER 
    WHERE TRANSFER_ID = p_transfer_id AND BLOOD_BANK_ID = v_bank_id;
    
    IF v_status = 'RECEIVED' THEN
        RETURN;
    END IF;
    
    -- Loop through items and generate blood units
    FOR item IN c_items LOOP
        INSERT INTO BLOOD_UNIT (
            BLOOD_BANK_ID, DONATION_ID, TRANSFER_ID, UNIT_CODE, BLOOD_GROUP, 
            COLLECTION_DATE, RECEIVED_DATE, EXPIRY_DATE, STATUS, STORAGE_LOCATION
        ) VALUES (
            v_bank_id, item.DONATION_ID, p_transfer_id, 
            'UNIT-' || p_transfer_id || '-' || item.DONATION_ID, 
            item.BLOOD_GROUP, item.DONATION_DATE, SYSDATE, 
            item.DONATION_DATE + 42, -- Blood expires 42 days after collection
            'AVAILABLE', 'Main Storage'
        );
        v_count := v_count + 1;
    END LOOP;
    
    UPDATE DONATION_TRANSFER
    SET STATUS = 'RECEIVED', 
        RECEIVED_AT = SYSTIMESTAMP,
        RECEIVED_UNIT_COUNT = v_count
    WHERE TRANSFER_ID = p_transfer_id;
    
    COMMIT;
END RECEIVE_TRANSFER;
/

CREATE OR REPLACE PROCEDURE GET_BANK_HOSPITAL_REQUESTS(
    p_user_id IN NUMBER,
    p_result_cursor OUT SYS_REFCURSOR
) AS
    v_bank_id NUMBER;
BEGIN
    SELECT BLOOD_BANK_ID INTO v_bank_id FROM USER_ROLE_LINK WHERE USER_ID = p_user_id AND ROLE_CODE = 'BLOOD_BANK';
    
    OPEN p_result_cursor FOR
    SELECT r.REQUEST_ID, r.REQUEST_CODE, h.HOSPITAL_NAME, r.BLOOD_GROUP, 
           r.UNITS_REQUIRED, r.UNITS_ALLOCATED, r.UNITS_FULFILLED, 
           r.NEEDED_BY, r.PRIORITY, r.STATUS
    FROM HOSPITAL_BLOOD_REQUEST r
    JOIN HOSPITAL h ON r.HOSPITAL_ID = h.HOSPITAL_ID
    WHERE r.BLOOD_BANK_ID = v_bank_id
    ORDER BY r.NEEDED_BY ASC;
END GET_BANK_HOSPITAL_REQUESTS;
/

CREATE OR REPLACE PROCEDURE GET_BANK_STAFF(
    p_user_id IN NUMBER,
    p_result_cursor OUT SYS_REFCURSOR
) AS
    v_bank_id NUMBER;
BEGIN
    SELECT BLOOD_BANK_ID INTO v_bank_id FROM USER_ROLE_LINK WHERE USER_ID = p_user_id AND ROLE_CODE = 'BLOOD_BANK';
    
    OPEN p_result_cursor FOR
    SELECT s.STAFF_ID, s.FULL_NAME, s.POSITION_TITLE, s.PHONE, s.EMAIL, a.ASSIGNED_FROM, a.STATUS
    FROM BANK_STAFF_ASSIGNMENT a
    JOIN STAFF_MEMBER s ON a.STAFF_ID = s.STAFF_ID
    WHERE a.BLOOD_BANK_ID = v_bank_id;
END GET_BANK_STAFF;
/
-- ================================================================
-- Committee Procedures
-- ================================================================

CREATE OR REPLACE PROCEDURE GET_COMMITTEE_DASHBOARD(
    p_user_id IN NUMBER,
    p_result_cursor OUT SYS_REFCURSOR
) AS
    v_committee_id NUMBER;
BEGIN
    SELECT COMMITTEE_ID INTO v_committee_id FROM USER_ROLE_LINK WHERE USER_ID = p_user_id AND ROLE_CODE = 'ORGANIZING_COMMITTEE';
    
    OPEN p_result_cursor FOR
    SELECT 
        (SELECT COUNT(*) FROM DONATION_CAMP WHERE COMMITTEE_ID = v_committee_id AND STATUS IN ('PUBLISHED', 'ONGOING')) AS ACTIVE_CAMPS,
        (SELECT COUNT(*) FROM DONATION_TRANSFER WHERE COMMITTEE_ID = v_committee_id AND STATUS = 'DISPATCHED') AS PENDING_TRANSFERS,
        (SELECT COUNT(*) FROM CAMP_REGISTRATION r JOIN DONATION_CAMP c ON r.CAMP_ID = c.CAMP_ID WHERE c.COMMITTEE_ID = v_committee_id) AS TOTAL_REGISTRATIONS,
        (SELECT COUNT(*) FROM VENUE WHERE COMMITTEE_ID = v_committee_id AND STATUS = 'ACTIVE') AS ACTIVE_VENUES
    FROM DUAL;
END GET_COMMITTEE_DASHBOARD;
/

CREATE OR REPLACE PROCEDURE GET_COMMITTEE_VENUES(
    p_user_id IN NUMBER,
    p_result_cursor OUT SYS_REFCURSOR
) AS
    v_committee_id NUMBER;
BEGIN
    SELECT COMMITTEE_ID INTO v_committee_id FROM USER_ROLE_LINK WHERE USER_ID = p_user_id AND ROLE_CODE = 'ORGANIZING_COMMITTEE';
    
    OPEN p_result_cursor FOR
    SELECT VENUE_ID, VENUE_NAME, ADDRESS, CAPACITY, STATUS
    FROM VENUE
    WHERE COMMITTEE_ID = v_committee_id
    ORDER BY VENUE_NAME ASC;
END GET_COMMITTEE_VENUES;
/

CREATE OR REPLACE PROCEDURE GET_COMMITTEE_CAMPS(
    p_user_id IN NUMBER,
    p_result_cursor OUT SYS_REFCURSOR
) AS
    v_committee_id NUMBER;
BEGIN
    SELECT COMMITTEE_ID INTO v_committee_id FROM USER_ROLE_LINK WHERE USER_ID = p_user_id AND ROLE_CODE = 'ORGANIZING_COMMITTEE';
    
    OPEN p_result_cursor FOR
    SELECT c.CAMP_ID, c.CAMP_TITLE, c.CAMP_DATE, c.START_TIME, c.END_TIME, c.CAPACITY, c.STATUS, c.PUBLIC_VISIBLE, v.VENUE_NAME
    FROM DONATION_CAMP c
    JOIN VENUE v ON c.VENUE_ID = v.VENUE_ID
    WHERE c.COMMITTEE_ID = v_committee_id
    ORDER BY c.CAMP_DATE DESC;
END GET_COMMITTEE_CAMPS;
/

CREATE OR REPLACE PROCEDURE CREATE_DONATION_CAMP(
    p_user_id IN NUMBER,
    p_venue_id IN NUMBER,
    p_title IN VARCHAR2,
    p_date IN DATE,
    p_start IN TIMESTAMP,
    p_end IN TIMESTAMP,
    p_capacity IN NUMBER,
    p_camp_id OUT NUMBER
) AS
    v_committee_id NUMBER;
BEGIN
    SELECT COMMITTEE_ID INTO v_committee_id FROM USER_ROLE_LINK WHERE USER_ID = p_user_id AND ROLE_CODE = 'ORGANIZING_COMMITTEE';
    
    INSERT INTO DONATION_CAMP (COMMITTEE_ID, VENUE_ID, CAMP_TITLE, CAMP_DATE, START_TIME, END_TIME, CAPACITY, STATUS, PUBLIC_VISIBLE)
    VALUES (v_committee_id, p_venue_id, p_title, p_date, p_start, p_end, p_capacity, 'PUBLISHED', 'Y')
    RETURNING CAMP_ID INTO p_camp_id;
    
    COMMIT;
END CREATE_DONATION_CAMP;
/

CREATE OR REPLACE PROCEDURE GET_CAMP_ATTENDANCE(
    p_user_id IN NUMBER,
    p_camp_id IN NUMBER,
    p_result_cursor OUT SYS_REFCURSOR
) AS
    v_committee_id NUMBER;
    v_camp_exists NUMBER;
BEGIN
    SELECT COMMITTEE_ID INTO v_committee_id FROM USER_ROLE_LINK WHERE USER_ID = p_user_id AND ROLE_CODE = 'ORGANIZING_COMMITTEE';
    
    -- Verify camp belongs to committee
    SELECT COUNT(*) INTO v_camp_exists FROM DONATION_CAMP WHERE CAMP_ID = p_camp_id AND COMMITTEE_ID = v_committee_id;
    IF v_camp_exists = 0 THEN
        RAISE_APPLICATION_ERROR(-20001, 'Unauthorized camp access');
    END IF;
    
    OPEN p_result_cursor FOR
    SELECT r.REGISTRATION_ID, r.DONOR_ID, r.REGISTRATION_STATUS, r.ATTENDANCE_STATUS, 
           d.FULL_NAME, d.NIC, d.BLOOD_GROUP,
           (SELECT COUNT(*) FROM DONATION_RECORD rec WHERE rec.REGISTRATION_ID = r.REGISTRATION_ID) AS HAS_DONATED
    FROM CAMP_REGISTRATION r
    JOIN DONOR d ON r.DONOR_ID = d.DONOR_ID
    WHERE r.CAMP_ID = p_camp_id
    ORDER BY d.FULL_NAME ASC;
END GET_CAMP_ATTENDANCE;
/

CREATE OR REPLACE PROCEDURE RECORD_CAMP_DONATION(
    p_user_id IN NUMBER,
    p_registration_id IN NUMBER,
    p_camp_id IN NUMBER,
    p_donor_id IN NUMBER,
    p_blood_group IN VARCHAR2,
    p_units IN NUMBER
) AS
    v_committee_id NUMBER;
    v_camp_date DATE;
BEGIN
    SELECT COMMITTEE_ID INTO v_committee_id FROM USER_ROLE_LINK WHERE USER_ID = p_user_id AND ROLE_CODE = 'ORGANIZING_COMMITTEE';
    
    SELECT CAMP_DATE INTO v_camp_date FROM DONATION_CAMP WHERE CAMP_ID = p_camp_id AND COMMITTEE_ID = v_committee_id;
    
    INSERT INTO DONATION_RECORD (REGISTRATION_ID, CAMP_ID, DONOR_ID, DONATION_DATE, BLOOD_GROUP, UNITS_COLLECTED, STATUS, SUBMITTED_AT)
    VALUES (p_registration_id, p_camp_id, p_donor_id, v_camp_date, p_blood_group, p_units, 'SUBMITTED', SYSTIMESTAMP);
    
    UPDATE CAMP_REGISTRATION 
    SET ATTENDANCE_STATUS = 'COMPLETED', CHECK_IN_AT = SYSTIMESTAMP, CHECK_OUT_AT = SYSTIMESTAMP
    WHERE REGISTRATION_ID = p_registration_id;
    
    COMMIT;
END RECORD_CAMP_DONATION;
/

CREATE OR REPLACE PROCEDURE DISPATCH_DONATION_TRANSFER(
    p_user_id IN NUMBER,
    p_camp_id IN NUMBER,
    p_blood_bank_id IN NUMBER,
    p_transfer_id OUT NUMBER,
    p_transfer_code OUT VARCHAR2
) AS
    v_committee_id NUMBER;
    v_count NUMBER;
    
    CURSOR c_untransferred IS
        SELECT DONATION_ID FROM DONATION_RECORD 
        WHERE CAMP_ID = p_camp_id AND STATUS = 'SUBMITTED' 
          AND DONATION_ID NOT IN (SELECT DONATION_ID FROM DONATION_TRANSFER_ITEM);
BEGIN
    SELECT COMMITTEE_ID INTO v_committee_id FROM USER_ROLE_LINK WHERE USER_ID = p_user_id AND ROLE_CODE = 'ORGANIZING_COMMITTEE';
    
    p_transfer_code := 'TRF-' || p_camp_id || '-' || TO_CHAR(SYSDATE, 'YYYYMMDDHH24MISS');
    
    INSERT INTO DONATION_TRANSFER (CAMP_ID, COMMITTEE_ID, BLOOD_BANK_ID, TRANSFER_CODE, STATUS, DISPATCHED_AT)
    VALUES (p_camp_id, v_committee_id, p_blood_bank_id, p_transfer_code, 'DISPATCHED', SYSTIMESTAMP)
    RETURNING TRANSFER_ID INTO p_transfer_id;
    
    v_count := 0;
    FOR rec IN c_untransferred LOOP
        INSERT INTO DONATION_TRANSFER_ITEM (TRANSFER_ID, DONATION_ID, UNITS_TRANSFERRED)
        VALUES (p_transfer_id, rec.DONATION_ID, 1);
        v_count := v_count + 1;
    END LOOP;
    
    IF v_count = 0 THEN
        ROLLBACK;
        p_transfer_id := -1;
        p_transfer_code := 'NO_UNITS_FOUND';
    ELSE
        UPDATE DONATION_CAMP SET STATUS = 'COMPLETED' WHERE CAMP_ID = p_camp_id;
        COMMIT;
    END IF;
END DISPATCH_DONATION_TRANSFER;
/

CREATE OR REPLACE PROCEDURE GET_COMMITTEE_STAFF(
    p_user_id IN NUMBER,
    p_result_cursor OUT SYS_REFCURSOR
) AS
    v_committee_id NUMBER;
BEGIN
    SELECT COMMITTEE_ID INTO v_committee_id FROM USER_ROLE_LINK WHERE USER_ID = p_user_id AND ROLE_CODE = 'ORGANIZING_COMMITTEE';
    
    OPEN p_result_cursor FOR
    SELECT s.STAFF_ID, s.FULL_NAME, s.POSITION_TITLE, s.PHONE, s.EMAIL, a.ASSIGNED_FROM, a.STATUS
    FROM COMMITTEE_STAFF_ASSIGNMENT a
    JOIN STAFF_MEMBER s ON a.STAFF_ID = s.STAFF_ID
    WHERE a.COMMITTEE_ID = v_committee_id;
END GET_COMMITTEE_STAFF;
/
