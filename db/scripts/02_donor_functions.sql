/* Check if donor can submit feedback for a camp */
CREATE OR REPLACE FUNCTION FN_CAN_SUBMIT_FEEDBACK (
    p_user_id  IN  NUMBER,
    p_camp_id  IN  NUMBER
) RETURN NUMBER
IS
    v_donor_id NUMBER;
    v_count    NUMBER;
    v_allowed  NUMBER;
BEGIN
    SELECT DONOR_ID INTO v_donor_id FROM DONOR WHERE USER_ID = p_user_id;

    SELECT COUNT(*) INTO v_count
    FROM DONATION_RECORD
    WHERE DONOR_ID = v_donor_id
      AND CAMP_ID = p_camp_id
      AND STATUS = 'SUBMITTED';

    IF v_count > 0 THEN
        v_allowed := 1;
    ELSE
        v_allowed := 0;
    END IF;
    RETURN v_allowed;
END FN_CAN_SUBMIT_FEEDBACK;
/
