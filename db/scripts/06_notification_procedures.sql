-- ================================================================
-- Notification Procedures
-- Blood Donation System — Oracle 21c PL/SQL
-- ================================================================

-- Get user notifications
CREATE OR REPLACE PROCEDURE GET_USER_NOTIFICATIONS (
    p_user_id       IN  NUMBER,
    p_result_cursor OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_result_cursor FOR
        SELECT NOTIFICATION_ID, NOTIFICATION_TYPE, TITLE, MESSAGE, ACTION_PATH, IS_READ, CREATED_AT
        FROM NOTIFICATION
        WHERE USER_ID = p_user_id
        ORDER BY CREATED_AT DESC
        FETCH FIRST 50 ROWS ONLY;
END GET_USER_NOTIFICATIONS;
/

-- Mark notification as read
CREATE OR REPLACE PROCEDURE MARK_NOTIFICATION_READ (
    p_user_id       IN NUMBER,
    p_notification_id IN NUMBER
) AS
BEGIN
    UPDATE NOTIFICATION
    SET IS_READ = 'Y', READ_AT = SYSTIMESTAMP
    WHERE NOTIFICATION_ID = p_notification_id AND USER_ID = p_user_id;

    COMMIT;
END MARK_NOTIFICATION_READ;
/
