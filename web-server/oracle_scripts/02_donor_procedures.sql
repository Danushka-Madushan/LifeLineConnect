-- ================================================================
-- Donor Procedures
-- Blood Donation System — Oracle 21c PL/SQL
-- ================================================================

-- Get donor dashboard summary
CREATE OR REPLACE PROCEDURE GET_DONOR_DASHBOARD (
    p_user_id       IN  NUMBER,
    p_result_cursor OUT SYS_REFCURSOR
) AS
    v_donor_id NUMBER;
BEGIN
    SELECT DONOR_ID INTO v_donor_id FROM DONOR WHERE USER_ID = p_user_id;

    OPEN p_result_cursor FOR
        SELECT
            (SELECT COUNT(*) FROM DONATION_RECORD WHERE DONOR_ID = v_donor_id AND STATUS = 'SUBMITTED') AS TOTAL_DONATIONS,
            (SELECT COUNT(*) FROM CAMP_REGISTRATION cr
             JOIN DONATION_CAMP dc ON cr.CAMP_ID = dc.CAMP_ID
             WHERE cr.DONOR_ID = v_donor_id
               AND cr.REGISTRATION_STATUS = 'REGISTERED'
               AND dc.CAMP_DATE >= TRUNC(SYSDATE)) AS UPCOMING_CAMPS,
            (SELECT MAX(DONATION_DATE) FROM DONATION_RECORD WHERE DONOR_ID = v_donor_id AND STATUS = 'SUBMITTED') AS LAST_DONATION_DATE
        FROM DUAL;
END GET_DONOR_DASHBOARD;
/

-- Check donor eligibility (56-day rule)
CREATE OR REPLACE PROCEDURE CHECK_DONOR_ELIGIBILITY (
    p_user_id   IN  NUMBER,
    p_eligible  OUT NUMBER,
    p_reason    OUT VARCHAR2,
    p_next_date OUT DATE
) AS
    v_donor_id       NUMBER;
    v_last_donation  DATE;
    v_days_since     NUMBER;
BEGIN
    SELECT DONOR_ID INTO v_donor_id FROM DONOR WHERE USER_ID = p_user_id;

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
        p_reason := 'No previous donations on record. You are eligible.';
        p_next_date := TRUNC(SYSDATE);
    ELSE
        v_days_since := TRUNC(SYSDATE) - TRUNC(v_last_donation);
        IF v_days_since >= 56 THEN
            p_eligible := 1;
            p_reason := 'You are eligible to donate.';
            p_next_date := TRUNC(SYSDATE);
        ELSE
            p_eligible := 0;
            p_next_date := TRUNC(v_last_donation) + 56;
            p_reason := 'You must wait ' || (56 - v_days_since) || ' more days. Next eligible date: ' || TO_CHAR(p_next_date, 'YYYY-MM-DD');
        END IF;
    END IF;
END CHECK_DONOR_ELIGIBILITY;
/

-- Get donor profile
CREATE OR REPLACE PROCEDURE GET_DONOR_PROFILE (
    p_user_id       IN  NUMBER,
    p_result_cursor OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_result_cursor FOR
        SELECT d.DONOR_ID, d.FULL_NAME, d.NIC, d.DATE_OF_BIRTH, d.GENDER,
               d.BLOOD_GROUP, d.PHONE, d.EMAIL, d.ADDRESS, d.STATUS
        FROM DONOR d
        WHERE d.USER_ID = p_user_id;
END GET_DONOR_PROFILE;
/

-- Update donor profile
CREATE OR REPLACE PROCEDURE UPDATE_DONOR_PROFILE (
    p_user_id     IN VARCHAR2,
    p_full_name   IN VARCHAR2,
    p_phone       IN VARCHAR2,
    p_email       IN VARCHAR2,
    p_address     IN VARCHAR2,
    p_blood_group IN VARCHAR2,
    p_gender      IN VARCHAR2
) AS
BEGIN
    UPDATE DONOR
    SET FULL_NAME   = p_full_name,
        PHONE       = p_phone,
        EMAIL       = p_email,
        ADDRESS     = p_address,
        BLOOD_GROUP = p_blood_group,
        GENDER      = p_gender,
        UPDATED_AT  = SYSTIMESTAMP
    WHERE USER_ID = p_user_id;
    COMMIT;
END UPDATE_DONOR_PROFILE;
/

-- Register donor for a camp
CREATE OR REPLACE PROCEDURE REGISTER_DONOR_FOR_CAMP (
    p_user_id         IN  NUMBER,
    p_camp_id         IN  NUMBER,
    p_registration_id OUT NUMBER,
    p_status          OUT VARCHAR2
) AS
    v_donor_id NUMBER;
    v_existing NUMBER;
BEGIN
    SELECT DONOR_ID INTO v_donor_id FROM DONOR WHERE USER_ID = p_user_id;

    -- Check for duplicate registration
    SELECT COUNT(*) INTO v_existing
    FROM CAMP_REGISTRATION
    WHERE CAMP_ID = p_camp_id AND DONOR_ID = v_donor_id;

    IF v_existing > 0 THEN
        p_registration_id := -1;
        p_status := 'ALREADY_REGISTERED';
        RETURN;
    END IF;

    INSERT INTO CAMP_REGISTRATION (CAMP_ID, DONOR_ID, REGISTRATION_STATUS, ATTENDANCE_STATUS)
    VALUES (p_camp_id, v_donor_id, 'REGISTERED', 'EXPECTED')
    RETURNING REGISTRATION_ID INTO p_registration_id;

    p_status := 'REGISTERED';
    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END REGISTER_DONOR_FOR_CAMP;
/

-- Get donor upcoming registrations
CREATE OR REPLACE PROCEDURE GET_DONOR_UPCOMING_REGISTRATIONS (
    p_user_id       IN  NUMBER,
    p_result_cursor OUT SYS_REFCURSOR
) AS
    v_donor_id NUMBER;
BEGIN
    SELECT DONOR_ID INTO v_donor_id FROM DONOR WHERE USER_ID = p_user_id;

    OPEN p_result_cursor FOR
        SELECT cr.REGISTRATION_ID, cr.REGISTRATION_STATUS,
               dc.CAMP_ID, dc.CAMP_TITLE, dc.CAMP_DATE,
               v.VENUE_NAME
        FROM CAMP_REGISTRATION cr
        JOIN DONATION_CAMP dc ON cr.CAMP_ID = dc.CAMP_ID
        JOIN VENUE v ON dc.VENUE_ID = v.VENUE_ID
        WHERE cr.DONOR_ID = v_donor_id
          AND cr.REGISTRATION_STATUS = 'REGISTERED'
          AND dc.CAMP_DATE >= TRUNC(SYSDATE)
        ORDER BY dc.CAMP_DATE ASC;
END GET_DONOR_UPCOMING_REGISTRATIONS;
/

-- Get donor donation history
CREATE OR REPLACE PROCEDURE GET_DONOR_DONATION_HISTORY (
    p_user_id       IN  NUMBER,
    p_result_cursor OUT SYS_REFCURSOR
) AS
    v_donor_id NUMBER;
BEGIN
    SELECT DONOR_ID INTO v_donor_id FROM DONOR WHERE USER_ID = p_user_id;

    OPEN p_result_cursor FOR
        SELECT dr.DONATION_ID, dr.DONATION_DATE, dr.BLOOD_GROUP,
               dr.UNITS_COLLECTED, dr.STATUS,
               dc.CAMP_ID, dc.CAMP_TITLE,
               v.VENUE_NAME
        FROM DONATION_RECORD dr
        JOIN DONATION_CAMP dc ON dr.CAMP_ID = dc.CAMP_ID
        JOIN VENUE v ON dc.VENUE_ID = v.VENUE_ID
        WHERE dr.DONOR_ID = v_donor_id
        ORDER BY dr.DONATION_DATE DESC;
END GET_DONOR_DONATION_HISTORY;
/

-- Check if donor can submit feedback for a camp
CREATE OR REPLACE PROCEDURE CAN_SUBMIT_FEEDBACK (
    p_user_id  IN  NUMBER,
    p_camp_id  IN  NUMBER,
    p_allowed  OUT NUMBER
) AS
    v_donor_id NUMBER;
    v_count    NUMBER;
BEGIN
    SELECT DONOR_ID INTO v_donor_id FROM DONOR WHERE USER_ID = p_user_id;

    SELECT COUNT(*) INTO v_count
    FROM DONATION_RECORD
    WHERE DONOR_ID = v_donor_id
      AND CAMP_ID = p_camp_id
      AND STATUS = 'SUBMITTED';

    IF v_count > 0 THEN
        p_allowed := 1;
    ELSE
        p_allowed := 0;
    END IF;
END CAN_SUBMIT_FEEDBACK;
/
