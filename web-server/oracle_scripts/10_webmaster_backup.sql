CREATE OR REPLACE PROCEDURE GENERATE_SCHEMA_BACKUP (
    p_dump_file OUT VARCHAR2,
    p_dir_path OUT VARCHAR2
) AS
    v_schema VARCHAR2(100);
    v_dp_job NUMBER;
    v_job_state VARCHAR2(30);
BEGIN
    v_schema := SYS_CONTEXT('USERENV', 'CURRENT_SCHEMA');
    p_dump_file := 'LIFELINE_BKP_' || TO_CHAR(SYSDATE, 'YYYYMMDD_HH24MISS') || '.dmp';
    
    SELECT DIRECTORY_PATH INTO p_dir_path 
    FROM ALL_DIRECTORIES 
    WHERE DIRECTORY_NAME = 'DATA_PUMP_DIR';

    v_dp_job := DBMS_DATAPUMP.OPEN(
        operation => 'EXPORT',
        job_mode => 'SCHEMA',
        remote_link => NULL,
        job_name => NULL,
        version => 'COMPATIBLE'
    );
    
    DBMS_DATAPUMP.ADD_FILE(
        handle => v_dp_job,
        filename => p_dump_file,
        directory => 'DATA_PUMP_DIR'
    );
    
    DBMS_DATAPUMP.METADATA_FILTER(
        handle => v_dp_job,
        name => 'SCHEMA_EXPR',
        value => 'IN (''' || v_schema || ''')'
    );
    
    DBMS_DATAPUMP.START_JOB(v_dp_job);
    DBMS_DATAPUMP.WAIT_FOR_JOB(v_dp_job, v_job_state);
END;
/
