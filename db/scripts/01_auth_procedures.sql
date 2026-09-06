-- Register a new donor account

CREATE OR REPLACE PROCEDURE REGISTER_DONOR (
    p_username       IN  VARCHAR2,
    p_email          IN  VARCHAR2,
    p_password_hash  IN  VARCHAR2,
    p_full_name      IN  VARCHAR2,
    p_nic            IN  VARCHAR2,
    p_date_of_birth  IN  DATE,
    p_gender         IN  VARCHAR2,
    p_phone          IN  VARCHAR2,
    p_address        IN  VARCHAR2,
    p_user_id        OUT NUMBER,
    p_donor_id       OUT NUMBER
)
IS
BEGIN
    /* Create the APP_USER row */
    INSERT INTO APP_USER (USERNAME, EMAIL, PASSWORD_HASH, ACCOUNT_STATUS)
    VALUES (p_username, p_email, p_password_hash, 'ACTIVE')
    RETURNING USER_ID INTO p_user_id;

    /* Create the DONOR row */
    INSERT INTO DONOR (USER_ID, FULL_NAME, NIC, DATE_OF_BIRTH, GENDER, PHONE, ADDRESS)
    VALUES (p_user_id, p_full_name, p_nic, p_date_of_birth, p_gender, p_phone, p_address)
    RETURNING DONOR_ID INTO p_donor_id;

    /* Create the role link */
    INSERT INTO USER_ROLE_LINK (USER_ID, ROLE_CODE, DONOR_ID)
    VALUES (p_user_id, 'DONOR', p_donor_id);
END REGISTER_DONOR;
/

/* Authenticate a user by username */
CREATE OR REPLACE PROCEDURE AUTHENTICATE_USER (
    p_username        IN  VARCHAR2,
    p_user_id         OUT NUMBER,
    p_password_hash   OUT VARCHAR2,
    p_account_status  OUT VARCHAR2,
    p_role_code       OUT VARCHAR2
)
IS
    v_user APP_USER%ROWTYPE;
    v_role USER_ROLE_LINK.ROLE_CODE%TYPE;
BEGIN
    BEGIN
        /* email or username */
        SELECT * INTO v_user FROM APP_USER WHERE USERNAME = p_username OR EMAIL = p_username;
        SELECT ROLE_CODE INTO v_role FROM USER_ROLE_LINK WHERE USER_ID = v_user.USER_ID;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20001, 'Invalid username or password.');
    END;

    IF v_user.ACCOUNT_STATUS != 'ACTIVE' THEN
        RAISE_APPLICATION_ERROR(-20002, 'Account is not active.');
    END IF;

    p_user_id := v_user.USER_ID;
    p_password_hash := v_user.PASSWORD_HASH;
    p_account_status := v_user.ACCOUNT_STATUS;
    p_role_code := v_role;

    /* Update last login timestamp */
    UPDATE APP_USER SET LAST_LOGIN_AT = SYSTIMESTAMP WHERE USER_ID = p_user_id;

EXCEPTION
    WHEN NO_DATA_FOUND THEN
        p_user_id := -1;
        p_password_hash := NULL;
        p_account_status := NULL;
        p_role_code := NULL;
END AUTHENTICATE_USER;
/
