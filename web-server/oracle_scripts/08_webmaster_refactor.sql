-- ================================================================
-- Webmaster Refactor Procedures
-- Blood Donation System — Oracle 21c PL/SQL
-- ================================================================

-- Seed Webmaster
CREATE OR REPLACE PROCEDURE SEED_WEBMASTER (
    p_password_hash IN VARCHAR2
) AS
    v_count NUMBER;
    v_user_id NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM USER_ROLE_LINK WHERE ROLE_CODE = 'WEBMASTER';
    IF v_count > 0 THEN
        RAISE_APPLICATION_ERROR(-20001, 'Webmaster already exists.');
    END IF;

    INSERT INTO APP_USER (USERNAME, EMAIL, PASSWORD_HASH, ACCOUNT_STATUS)
    VALUES ('admin', 'admin@lifeline.com', p_password_hash, 'ACTIVE')
    RETURNING USER_ID INTO v_user_id;

    INSERT INTO USER_ROLE_LINK (USER_ID, ROLE_CODE)
    VALUES (v_user_id, 'WEBMASTER');

    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END SEED_WEBMASTER;
/

-- Register Blood Bank
CREATE OR REPLACE PROCEDURE REGISTER_BLOOD_BANK (
    p_username   IN VARCHAR2,
    p_email      IN VARCHAR2,
    p_hash       IN VARCHAR2,
    p_bank_code  IN VARCHAR2,
    p_name       IN VARCHAR2,
    p_phone      IN VARCHAR2,
    p_address    IN VARCHAR2
) AS
    v_user_id NUMBER;
    v_bank_id NUMBER;
BEGIN
    INSERT INTO APP_USER (USERNAME, EMAIL, PASSWORD_HASH, ACCOUNT_STATUS)
    VALUES (p_username, p_email, p_hash, 'ACTIVE')
    RETURNING USER_ID INTO v_user_id;

    INSERT INTO BLOOD_BANK (BANK_CODE, BANK_NAME, PHONE, EMAIL, ADDRESS)
    VALUES (p_bank_code, p_name, p_phone, p_email, p_address)
    RETURNING BLOOD_BANK_ID INTO v_bank_id;

    INSERT INTO USER_ROLE_LINK (USER_ID, ROLE_CODE, BLOOD_BANK_ID)
    VALUES (v_user_id, 'BLOOD_BANK', v_bank_id);

    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END REGISTER_BLOOD_BANK;
/

-- Register Committee
CREATE OR REPLACE PROCEDURE REGISTER_COMMITTEE (
    p_username       IN VARCHAR2,
    p_email          IN VARCHAR2,
    p_hash           IN VARCHAR2,
    p_committee_code IN VARCHAR2,
    p_name           IN VARCHAR2,
    p_phone          IN VARCHAR2,
    p_address        IN VARCHAR2
) AS
    v_user_id NUMBER;
    v_comm_id NUMBER;
BEGIN
    INSERT INTO APP_USER (USERNAME, EMAIL, PASSWORD_HASH, ACCOUNT_STATUS)
    VALUES (p_username, p_email, p_hash, 'ACTIVE')
    RETURNING USER_ID INTO v_user_id;

    INSERT INTO ORGANIZING_COMMITTEE (COMMITTEE_CODE, COMMITTEE_NAME, PHONE, EMAIL, ADDRESS)
    VALUES (p_committee_code, p_name, p_phone, p_email, p_address)
    RETURNING COMMITTEE_ID INTO v_comm_id;

    INSERT INTO USER_ROLE_LINK (USER_ID, ROLE_CODE, COMMITTEE_ID)
    VALUES (v_user_id, 'ORGANIZING_COMMITTEE', v_comm_id);

    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END REGISTER_COMMITTEE;
/

-- Delete User (Soft Delete)
CREATE OR REPLACE PROCEDURE DELETE_USER (
    p_user_id IN NUMBER
) AS
BEGIN
    -- Remove the role link so they can no longer act as that role
    DELETE FROM USER_ROLE_LINK WHERE USER_ID = p_user_id;
    
    -- Mark user as deleted
    UPDATE APP_USER
    SET ACCOUNT_STATUS = 'DELETED'
    WHERE USER_ID = p_user_id;

    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END DELETE_USER;
/
