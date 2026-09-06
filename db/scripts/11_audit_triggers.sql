CREATE OR REPLACE TRIGGER TRG_AUDIT_APP_USER
AFTER INSERT OR UPDATE OR DELETE ON APP_USER
FOR EACH ROW
DECLARE
    v_action AUDIT_LOG.ACTION_CODE%TYPE;
    v_details VARCHAR2(255);
    v_id AUDIT_LOG.ENTITY_ID%TYPE;
BEGIN
    IF INSERTING THEN
        v_action := 'USER_CREATED';
        v_details := 'Username: ' || :NEW.USERNAME;
        v_id := :NEW.USER_ID;
    ELSIF UPDATING THEN
        v_action := 'USER_UPDATED';
        v_details := 'Username: ' || :NEW.USERNAME;
        v_id := :NEW.USER_ID;
    ELSIF DELETING THEN
        v_action := 'USER_DELETED';
        v_details := 'Username: ' || :OLD.USERNAME;
        v_id := :OLD.USER_ID;
    END IF;
    
    INSERT INTO AUDIT_LOG (ACTOR_ROLE_CODE, ACTION_CODE, ENTITY_TYPE, ENTITY_ID, DETAILS)
    VALUES ('DB_TRIGGER', v_action, 'APP_USER', v_id, v_details);
END;
/

CREATE OR REPLACE TRIGGER TRG_AUDIT_DONATION_CAMP
AFTER INSERT OR UPDATE OR DELETE ON DONATION_CAMP
FOR EACH ROW
DECLARE
    v_action AUDIT_LOG.ACTION_CODE%TYPE;
    v_details VARCHAR2(255);
    v_id AUDIT_LOG.ENTITY_ID%TYPE;
BEGIN
    IF INSERTING THEN
        v_action := 'CAMP_CREATED';
        v_details := 'Camp Title: ' || :NEW.CAMP_TITLE;
        v_id := :NEW.CAMP_ID;
    ELSIF UPDATING THEN
        v_action := 'CAMP_UPDATED';
        v_details := 'Camp Title: ' || :NEW.CAMP_TITLE;
        v_id := :NEW.CAMP_ID;
    ELSIF DELETING THEN
        v_action := 'CAMP_DELETED';
        v_details := 'Camp Title: ' || :OLD.CAMP_TITLE;
        v_id := :OLD.CAMP_ID;
    END IF;
    
    INSERT INTO AUDIT_LOG (ACTOR_ROLE_CODE, ACTION_CODE, ENTITY_TYPE, ENTITY_ID, DETAILS)
    VALUES ('DB_TRIGGER', v_action, 'DONATION_CAMP', v_id, v_details);
END;
/

CREATE OR REPLACE TRIGGER TRG_AUDIT_BLOOD_UNIT
AFTER INSERT OR UPDATE OR DELETE ON BLOOD_UNIT
FOR EACH ROW
DECLARE
    v_action AUDIT_LOG.ACTION_CODE%TYPE;
    v_details VARCHAR2(255);
    v_id AUDIT_LOG.ENTITY_ID%TYPE;
BEGIN
    IF INSERTING THEN
        v_action := 'UNIT_CREATED';
        v_details := 'Unit Code: ' || :NEW.UNIT_CODE || ' Group: ' || :NEW.BLOOD_GROUP;
        v_id := :NEW.BLOOD_UNIT_ID;
    ELSIF UPDATING THEN
        v_action := 'UNIT_UPDATED';
        v_details := 'Unit Code: ' || :NEW.UNIT_CODE || ' Group: ' || :NEW.BLOOD_GROUP;
        v_id := :NEW.BLOOD_UNIT_ID;
    ELSIF DELETING THEN
        v_action := 'UNIT_DELETED';
        v_details := 'Unit Code: ' || :OLD.UNIT_CODE || ' Group: ' || :OLD.BLOOD_GROUP;
        v_id := :OLD.BLOOD_UNIT_ID;
    END IF;
    
    INSERT INTO AUDIT_LOG (ACTOR_ROLE_CODE, ACTION_CODE, ENTITY_TYPE, ENTITY_ID, DETAILS)
    VALUES ('DB_TRIGGER', v_action, 'BLOOD_UNIT', v_id, v_details);
END;
/

CREATE OR REPLACE FUNCTION FN_GET_SYSTEM_AUDIT_LOGS
RETURN SYS_REFCURSOR AS
    v_cursor SYS_REFCURSOR;
BEGIN
    OPEN v_cursor FOR
    SELECT * FROM (
        SELECT AUDIT_ID, ACTOR_ROLE_CODE, ACTOR_USER_ID, ACTION_CODE, ENTITY_TYPE, ENTITY_ID, DETAILS, CREATED_AT
        FROM AUDIT_LOG
        ORDER BY CREATED_AT DESC
    ) WHERE ROWNUM <= 200;
    RETURN v_cursor;
END;
/
