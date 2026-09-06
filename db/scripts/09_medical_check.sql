/* Submit Medical Check */
CREATE OR REPLACE PROCEDURE SUBMIT_MEDICAL_CHECK(
    p_user_id IN NUMBER,
    p_feeling_well IN NUMBER,
    p_recent_antibiotics IN NUMBER,
    p_recent_tattoo IN NUMBER,
    p_status OUT VARCHAR2
)
IS
BEGIN
    IF p_feeling_well = 1 AND p_recent_antibiotics = 0 AND p_recent_tattoo = 0 THEN
        p_status := 'PASSED';
    ELSE
        p_status := 'FAILED';
    END IF;

    UPDATE DONOR
    SET MEDICAL_CHECK_STATUS = p_status,
        LAST_MEDICAL_CHECK_AT = CURRENT_TIMESTAMP
    WHERE USER_ID = p_user_id;

END SUBMIT_MEDICAL_CHECK;
/
