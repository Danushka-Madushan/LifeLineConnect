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
