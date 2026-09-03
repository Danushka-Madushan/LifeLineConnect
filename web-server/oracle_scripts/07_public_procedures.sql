-- ================================================================
-- Public Catalog Procedures
-- Blood Donation System — Oracle 21c PL/SQL
-- ================================================================

CREATE OR REPLACE PROCEDURE GET_PUBLIC_CAMPS (
    p_status        IN  VARCHAR2,
    p_lat           IN  NUMBER,
    p_lng           IN  NUMBER,
    p_result_cursor OUT SYS_REFCURSOR
) AS
    v_sql VARCHAR2(4000);
BEGIN
    v_sql := 'SELECT c.CAMP_ID, c.COMMITTEE_ID, c.VENUE_ID, c.CAMP_TITLE, c.CAMP_DESCRIPTION, ' ||
             'c.CAMP_DATE, c.START_TIME, c.END_TIME, c.CAPACITY, c.STATUS, c.PUBLIC_VISIBLE, ' ||
             'v.LATITUDE, v.LONGITUDE ' ||
             'FROM DONATION_CAMP c ' ||
             'JOIN VENUE v ON c.VENUE_ID = v.VENUE_ID ' ||
             'WHERE c.PUBLIC_VISIBLE = ''Y'' ';
             
    IF p_status IS NOT NULL THEN
        v_sql := v_sql || ' AND c.STATUS = ''' || REPLACE(p_status, '''', '''''') || ''' ';
    ELSE
        v_sql := v_sql || ' AND c.STATUS IN (''PUBLISHED'', ''ONGOING'', ''COMPLETED'') ';
    END IF;
    
    IF p_lat IS NOT NULL AND p_lng IS NOT NULL THEN
        v_sql := v_sql || ' ORDER BY SQRT(POWER(v.LATITUDE - (' || p_lat || '), 2) + POWER(v.LONGITUDE - (' || p_lng || '), 2)) ASC';
    ELSE
        v_sql := v_sql || ' ORDER BY c.CAMP_DATE DESC';
    END IF;

    OPEN p_result_cursor FOR v_sql;
END GET_PUBLIC_CAMPS;
/

CREATE OR REPLACE PROCEDURE GET_PUBLIC_STATS (
    p_result_cursor OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_result_cursor FOR
        SELECT
            (SELECT COUNT(*) FROM DONOR WHERE STATUS = 'ACTIVE') AS TOTAL_DONORS,
            (SELECT COUNT(*) FROM DONATION_CAMP WHERE STATUS IN ('PUBLISHED', 'ONGOING')) AS ACTIVE_CAMPS,
            (SELECT NVL(SUM(UNITS_COLLECTED), 0) FROM DONATION_RECORD WHERE STATUS = 'SUBMITTED') AS TOTAL_UNITS
        FROM DUAL;
END GET_PUBLIC_STATS;
/
