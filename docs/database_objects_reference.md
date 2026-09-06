# LifeLineConnect Database Objects Reference

This document provides a comprehensive reference of every PL/SQL object (Procedures, Functions, and Triggers) in the LifeLineConnect system, grouped by logical module.

## 1. Authentication & Authorization (Auth)

### `REGISTER_DONOR`
- **Type:** Procedure
- **Parameters:** 
  - `IN`: `p_username`, `p_email`, `p_password_hash`, `p_full_name`, `p_nic`, `p_date_of_birth`, `p_gender`, `p_phone`, `p_address`
  - `OUT`: `p_user_id`, `p_donor_id`
- **Business Logic:** Inserts a new user record into `APP_USER`, creates the corresponding `DONOR` profile, and links them via `USER_ROLE_LINK`.
- **Application Feature:** Powers the new donor registration form.

### `AUTHENTICATE_USER`
- **Type:** Procedure
- **Parameters:** 
  - `IN`: `p_username`
  - `OUT`: `p_user_id`, `p_password_hash`, `p_account_status`, `p_role_code`
- **Business Logic:** Retrieves user info by username or email, validates account status, and updates the last login timestamp.
- **Application Feature:** Powers the system login flow and authentication.

---

## 2. Donor Management

### `GET_DONOR_DASHBOARD`
- **Type:** Procedure
- **Parameters:** `IN: p_user_id`, `OUT: p_result_cursor`
- **Business Logic:** Calculates donor summary stats (total donations, upcoming camps, last donation date).
- **Application Feature:** Powers the Donor Dashboard landing page.

### `CHECK_DONOR_ELIGIBILITY`
- **Type:** Procedure
- **Parameters:** `IN: p_user_id`, `OUT: p_eligible, p_reason, p_next_date`
- **Business Logic:** Checks if 56 days have passed since the last donation and verifies if the pre-donation medical check is passed.
- **Application Feature:** Calculates Donor 56-day eligibility rule for donating.

### `GET_DONOR_PROFILE`
- **Type:** Procedure
- **Parameters:** `IN: p_user_id`, `OUT: p_result_cursor`
- **Business Logic:** Retrieves the donor's personal and contact information.
- **Application Feature:** Powers the Donor Profile viewing page.

### `UPDATE_DONOR_PROFILE`
- **Type:** Procedure
- **Parameters:** `IN: p_user_id, p_full_name, p_phone, p_email, p_address, p_blood_group, p_gender`
- **Business Logic:** Updates the donor's record in the `DONOR` table.
- **Application Feature:** Powers the update functionality on the Donor Profile settings.

### `REGISTER_DONOR_FOR_CAMP`
- **Type:** Procedure
- **Parameters:** `IN: p_user_id, p_camp_id`, `OUT: p_registration_id, p_status`
- **Business Logic:** Inserts a camp registration record for the donor, ensuring no duplicate registrations exist for the same camp.
- **Application Feature:** Powers the camp registration button on public camp listings.

### `GET_DONOR_UPCOMING_REGISTRATIONS`
- **Type:** Procedure
- **Parameters:** `IN: p_user_id`, `OUT: p_result_cursor`
- **Business Logic:** Retrieves a list of future camps the donor is registered to attend.
- **Application Feature:** Powers the "Upcoming Camps" list on the Donor Dashboard.

### `GET_DONOR_DONATION_HISTORY`
- **Type:** Procedure
- **Parameters:** `IN: p_user_id`, `OUT: p_result_cursor`
- **Business Logic:** Retrieves past submitted donations along with camp and venue details.
- **Application Feature:** Powers the Donor Donation History page.

### `FN_CAN_SUBMIT_FEEDBACK`
- **Type:** Function
- **Parameters:** `IN: p_user_id, p_camp_id`
- **Returns:** `NUMBER`
- **Business Logic:** Checks if the donor has a completed/submitted donation for the specified camp.
- **Application Feature:** Determines if the "Submit Feedback" button should be visible to the donor.

### `GET_DONOR_STATUS_HISTORY`
- **Type:** Procedure
- **Parameters:** `IN: p_user_id`, `OUT: p_result_cursor`
- **Business Logic:** Unions registrations and donations to build a unified timeline of donor activities.
- **Application Feature:** Powers the activity timeline view on the Donor profile.

### `SUBMIT_MEDICAL_CHECK`
- **Type:** Procedure
- **Parameters:** `IN: p_user_id, p_status`
- **Business Logic:** Updates the donor's medical check status and timestamp.
- **Application Feature:** Powers the pre-donation health questionnaire submission.

---

## 3. Blood Bank Operations

### `GET_BANK_DASHBOARD`
- **Type:** Procedure
- **Parameters:** `IN: p_user_id`, `OUT: p_result_cursor`
- **Business Logic:** Calculates blood bank inventory metrics, incoming transfer counts, pending requests, and low stock warnings.
- **Application Feature:** Powers the Blood Bank Dashboard overview.

### `GET_BANK_INVENTORY`
- **Type:** Procedure
- **Parameters:** `IN: p_user_id`, `OUT: p_result_cursor`
- **Business Logic:** Retrieves the list of available blood units stored at the blood bank.
- **Application Feature:** Powers the Blood Bank Inventory tab.

### `GET_BANK_TRANSFERS`
- **Type:** Procedure
- **Parameters:** `IN: p_user_id`, `OUT: p_result_cursor`
- **Business Logic:** Retrieves the history of donation transfers sent to the blood bank by committees.
- **Application Feature:** Powers the Blood Bank Transfers view.

### `RECEIVE_TRANSFER`
- **Type:** Procedure
- **Parameters:** `IN: p_user_id, p_transfer_id`
- **Business Logic:** Updates the status of an incoming transfer to 'RECEIVED' and sets the received timestamp.
- **Application Feature:** Powers the "Receive" button on incoming blood unit transfers.

### `GET_BANK_HOSPITAL_REQUESTS`
- **Type:** Procedure
- **Parameters:** `IN: p_user_id`, `OUT: p_result_cursor`
- **Business Logic:** Retrieves pending hospital blood requests assigned to the bank, ordered by priority and needed date.
- **Application Feature:** Powers the Hospital Requests queue for blood bank staff.

### `GET_BANK_STAFF`
- **Type:** Procedure
- **Parameters:** `IN: p_user_id`, `OUT: p_result_cursor`
- **Business Logic:** Retrieves the list of active staff assigned to the blood bank.
- **Application Feature:** Powers the Blood Bank Staff Management page.

### `UPDATE_UNIT_STATUS`
- **Type:** Procedure
- **Parameters:** `IN: p_user_id, p_unit_id, p_status`
- **Business Logic:** Updates the status of a specific blood unit (e.g., to discarded or reserved).
- **Application Feature:** Allows blood bank staff to manage individual blood unit statuses.

### `UPDATE_REQUEST_STATUS`
- **Type:** Procedure
- **Parameters:** `IN: p_user_id, p_request_id, p_status`
- **Business Logic:** Updates the state of a hospital blood request.
- **Application Feature:** Allows staff to approve, reject, or process hospital requests.

### `ADD_BANK_STAFF`
- **Type:** Procedure
- **Parameters:** `IN: p_user_id, p_full_name, p_position, p_phone, p_email`, `OUT: p_staff_id`
- **Business Logic:** Creates a new staff member and assigns them to the blood bank.
- **Application Feature:** Powers the "Add Staff" form in the blood bank module.

### `REMOVE_BANK_STAFF`
- **Type:** Procedure
- **Parameters:** `IN: p_user_id, p_staff_id`
- **Business Logic:** Sets the staff member and their bank assignment to 'INACTIVE' (soft delete).
- **Application Feature:** Powers the "Remove" button on the blood bank staff list.

### `ALLOCATE_UNITS_TO_REQUEST`
- **Type:** Procedure
- **Parameters:** `IN: p_user_id, p_request_id`, `OUT: p_units_to_allocate`
- **Business Logic:** Finds available blood units matching the requested blood group and reserves them, updating the request allocation count automatically.
- **Application Feature:** Automates blood unit allocation to fulfill hospital requests.

---

## 4. Organizing Committee

### `GET_COMMITTEE_DASHBOARD`
- **Type:** Procedure
- **Parameters:** `IN: p_user_id`, `OUT: p_result_cursor`
- **Business Logic:** Retrieves statistics on active camps, pending transfers, total registrations, and active venues for the committee.
- **Application Feature:** Powers the Organizing Committee Dashboard.

### `FN_GET_COMMITTEE_VENUES`
- **Type:** Function
- **Parameters:** `IN: p_user_id`
- **Returns:** `SYS_REFCURSOR`
- **Business Logic:** Retrieves all active venues managed by the committee.
- **Application Feature:** Powers the venues dropdown selection during camp creation.

### `GET_COMMITTEE_CAMPS`
- **Type:** Procedure
- **Parameters:** `IN: p_user_id`, `OUT: p_result_cursor`
- **Business Logic:** Retrieves the list of donation camps organized by the committee.
- **Application Feature:** Powers the Committee Camps data table.

### `CREATE_DONATION_CAMP`
- **Type:** Procedure
- **Parameters:** `IN: p_user_id, p_venue_id, p_title, p_date, p_start, p_end, p_capacity`, `OUT: p_camp_id`
- **Business Logic:** Inserts a new donation camp record.
- **Application Feature:** Powers the Create Camp form.

### `GET_CAMP_ATTENDANCE`
- **Type:** Procedure
- **Parameters:** `IN: p_user_id, p_camp_id`, `OUT: p_result_cursor`
- **Business Logic:** Retrieves the list of registered donors for a camp and checks if they have already donated.
- **Application Feature:** Powers the Camp Attendance and Check-in tracking page.

### `RECORD_CAMP_DONATION`
- **Type:** Procedure
- **Parameters:** `IN: p_user_id, p_registration_id, p_camp_id, p_donor_id, p_blood_group, p_units`
- **Business Logic:** Inserts a donation record, updates attendance status to 'COMPLETED', and updates the donor's blood group if missing.
- **Application Feature:** Powers the Donation Recording form during an active camp.

### `DISPATCH_DONATION_TRANSFER`
- **Type:** Procedure
- **Parameters:** `IN: p_user_id, p_camp_id, p_blood_bank_id`, `OUT: p_transfer_id, p_transfer_code`
- **Business Logic:** Groups all untransferred submitted donations from a camp and creates a dispatch record to a blood bank.
- **Application Feature:** Powers the "Dispatch Blood Units" action to send collected blood to banks.

### `UPDATE_CAMP_STATUS`
- **Type:** Procedure
- **Parameters:** `IN: p_user_id, p_camp_id, p_status`
- **Business Logic:** Updates the lifecycle status of a donation camp.
- **Application Feature:** Allows committees to mark camps as ONGOING or COMPLETED.

### `CREATE_VENUE`
- **Type:** Procedure
- **Parameters:** `IN: p_user_id, p_venue_name, p_address, p_capacity`, `OUT: p_venue_id`
- **Business Logic:** Inserts a new venue record for the committee.
- **Application Feature:** Powers the Add Venue form.

### `GET_COMMITTEE_TRANSFERS`
- **Type:** Procedure
- **Parameters:** `IN: p_user_id`, `OUT: p_result_cursor`
- **Business Logic:** Retrieves the history of transfers dispatched by the committee.
- **Application Feature:** Powers the Committee Transfers history list.

### `GET_COMMITTEE_STAFF`
- **Type:** Procedure
- **Parameters:** `IN: p_user_id`, `OUT: p_result_cursor`
- **Business Logic:** Retrieves the list of staff members assigned to the committee.
- **Application Feature:** Powers the Committee Staff Management view.

### `ADD_COMMITTEE_STAFF`
- **Type:** Procedure
- **Parameters:** `IN: p_user_id, p_full_name, p_position, p_phone, p_email`, `OUT: p_staff_id`
- **Business Logic:** Creates a new staff member and assigns them to the committee.
- **Application Feature:** Powers the Add Staff form for committees.

### `REMOVE_COMMITTEE_STAFF`
- **Type:** Procedure
- **Parameters:** `IN: p_user_id, p_staff_id`
- **Business Logic:** Deactivates the staff member and removes their active assignment.
- **Application Feature:** Powers the Remove Staff action.

---

## 5. Webmaster & System Administration

### `GET_WEBMASTER_DASHBOARD`
- **Type:** Procedure
- **Parameters:** `OUT: p_result_cursor`
- **Business Logic:** Retrieves system-wide aggregates for donors, banks, committees, camps, donations, and hospital requests.
- **Application Feature:** Powers the Webmaster Global Dashboard overview.

### `FN_GET_ALL_USERS`
- **Type:** Function
- **Parameters:** None
- **Returns:** `SYS_REFCURSOR`
- **Business Logic:** Retrieves all application users along with their assigned roles and status.
- **Application Feature:** Powers the User Administration management page.

### `SEED_WEBMASTER`
- **Type:** Procedure
- **Parameters:** `IN: p_password_hash`
- **Business Logic:** Creates the initial admin account (if it doesn't already exist) and grants it the 'WEBMASTER' role.
- **Application Feature:** Used for system initialization and setup scripts.

### `REGISTER_BLOOD_BANK`
- **Type:** Procedure
- **Parameters:** `IN: p_username, p_email, p_hash, p_bank_code, p_name, p_phone, p_address`
- **Business Logic:** Creates an application user and the corresponding Blood Bank profile, linking them.
- **Application Feature:** Allows Webmasters to onboard new Blood Bank organizations.

### `REGISTER_COMMITTEE`
- **Type:** Procedure
- **Parameters:** `IN: p_username, p_email, p_hash, p_committee_code, p_name, p_phone, p_address`
- **Business Logic:** Creates an application user and the corresponding Committee profile, linking them.
- **Application Feature:** Allows Webmasters to onboard new Organizing Committees.

### `DELETE_USER`
- **Type:** Procedure
- **Parameters:** `IN: p_user_id`
- **Business Logic:** Removes the user's role assignment and sets their account status to 'DISABLED' (soft delete).
- **Application Feature:** Powers the Delete/Disable User action in the Administration panel.

### `GENERATE_SCHEMA_BACKUP`
- **Type:** Procedure
- **Parameters:** `OUT: p_dump_file, p_dir_path`
- **Business Logic:** Uses `DBMS_DATAPUMP` to export the current schema to a dump file.
- **Application Feature:** Powers the Database Backup utility for Webmasters.

---

## 6. Notifications

### `GET_USER_NOTIFICATIONS`
- **Type:** Procedure
- **Parameters:** `IN: p_user_id`, `OUT: p_result_cursor`
- **Business Logic:** Retrieves the latest 50 notifications for the given user.
- **Application Feature:** Powers the user notifications bell/dropdown in the UI.

### `MARK_NOTIFICATION_READ`
- **Type:** Procedure
- **Parameters:** `IN: p_user_id, p_notification_id`
- **Business Logic:** Updates a specific notification to mark it as read.
- **Application Feature:** Clears the unread indicator when a user clicks a notification.

---

## 7. Public Catalog

### `GET_PUBLIC_CAMPS`
- **Type:** Procedure
- **Parameters:** `IN: p_status, p_lat, p_lng`, `OUT: p_result_cursor`
- **Business Logic:** Retrieves publicly visible camps. Optionally sorts by geospatial distance if latitude/longitude are provided.
- **Application Feature:** Powers the public-facing "Find a Blood Drive" map and list.

### `FN_GET_PUBLIC_STATS`
- **Type:** Function
- **Parameters:** None
- **Returns:** `SYS_REFCURSOR`
- **Business Logic:** Retrieves aggregate public statistics (total donors, active camps, total units collected).
- **Application Feature:** Powers the statistics banner on the public landing page.

### `GET_CAMPS_BY_IDS`
- **Type:** Procedure
- **Parameters:** `IN: p_camp_ids`, `OUT: p_result_cursor`
- **Business Logic:** Retrieves camp details filtered by a comma-separated list of IDs.
- **Application Feature:** Powers the top-rated/featured camps endpoint.

### `IS_PUBLICLY_VISIBLE`
- **Type:** Function
- **Parameters:** `IN: p_camp_id`
- **Returns:** `NUMBER`
- **Business Logic:** Checks if a camp is configured to be publicly visible and in a valid active status.
- **Application Feature:** Helper function for authorization and visibility checks.

### `FN_GET_ACTIVE_BLOOD_BANKS`
- **Type:** Function
- **Parameters:** None
- **Returns:** `SYS_REFCURSOR`
- **Business Logic:** Retrieves a list of all active blood banks.
- **Application Feature:** Powers the public directory of Blood Banks.

---

## 8. Audit & Compliance

### `TRG_AUDIT_APP_USER`
- **Type:** Trigger
- **Event:** `AFTER INSERT OR UPDATE OR DELETE ON APP_USER`
- **Business Logic:** Captures any DML changes to user records and inserts an entry into the `AUDIT_LOG` table.
- **Application Feature:** Powers the system audit trail for user management and access control.

### `TRG_AUDIT_DONATION_CAMP`
- **Type:** Trigger
- **Event:** `AFTER INSERT OR UPDATE OR DELETE ON DONATION_CAMP`
- **Business Logic:** Captures any DML changes to camp records and logs them.
- **Application Feature:** Powers the audit trail for camp lifecycle events.

### `TRG_AUDIT_BLOOD_UNIT`
- **Type:** Trigger
- **Event:** `AFTER INSERT OR UPDATE OR DELETE ON BLOOD_UNIT`
- **Business Logic:** Captures any DML changes to blood unit records and logs them.
- **Application Feature:** Powers blood inventory traceability and compliance logging.

### `FN_GET_SYSTEM_AUDIT_LOGS`
- **Type:** Function
- **Parameters:** None
- **Returns:** `SYS_REFCURSOR`
- **Business Logic:** Retrieves the 200 most recent system audit logs, sorted by creation date.
- **Application Feature:** Powers the Webmaster Audit Log tab to monitor system activity.
