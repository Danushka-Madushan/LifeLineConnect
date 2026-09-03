# Backend Architecture — Blood Donation System

> **Scope:** Backend architecture only. This document defines how the C# application layer exposes APIs and how those APIs use **Oracle PL/SQL** and **MongoDB**. It does **not** contain implementation code.
>
> **Technology boundary**
> - **C# API/Application layer:** authentication, authorization, validation, orchestration, DTOs, HTTP responses, transaction coordination, and integration with Oracle/MongoDB.
> - **Oracle PL/SQL:** authoritative transactional/relational data and business rules for donors, roles, camps, venues, attendance, donation records, blood units, inventory, hospital requests, staff, transfers, statuses, notifications metadata, reports, and audit records.
> - **MongoDB:** complementary schema-flexible storage for campaign media, donor medical guideline documents, promotional/awareness content, donor feedback/ratings, emergency blood appeals, emergency broadcast messages, discussion threads, and Q&A content.
>
> **Important rule:** the C# API must not duplicate Oracle business rules in application code when those rules can be enforced by a PL/SQL procedure/function/trigger. C# should validate request shape and authorization, then call the appropriate Oracle PL/SQL operation.
>
> **PL/SQL design principle:** prefer simple packages with focused procedures/functions, explicit transactions where a workflow crosses several tables, cursors for report/list retrieval, and triggers only for invariant/audit/status side effects that must never be bypassed. Do not create triggers for ordinary application workflow that is clearer inside a procedure.
>
> **Oracle operation variable convention:** every Oracle-backed API below includes an `OraclePLSql` design variable. This is a human-readable reference to the intended PL/SQL call/query; it is **not implementation code**.
>
> **MongoDB convention:** when an endpoint is MongoDB-backed, `OraclePLSql` is marked `N/A — MongoDB operation` rather than inventing an Oracle query for non-Oracle data.

## 0. Backend-wide conventions

### API response shape

Success responses should consistently expose:
- `success`
- `data`
- `message` when useful
- `meta` for pagination/filter information where applicable

Failure responses should expose:
- `success: false`
- `errorCode`
- `message`
- `details` only when safe and useful to the client

### Authentication and authorization

Use role claims/session context on the C# API, but treat Oracle as the authority for role and entity ownership checks. The backend must never trust a `donorId`, `bankId`, or `committeeId` supplied by the browser without checking that the authenticated principal may act on that entity.

### Transactions

For a single business workflow such as completing a donation, creating a transfer, receiving a transfer, or fulfilling a hospital request, prefer one PL/SQL procedure that performs the related Oracle writes atomically. The API should not issue several unrelated SQL statements and hope they remain consistent.

### Oracle objects recommended by this design

Suggested package families:
- `PKG_AUTH`
- `PKG_DONOR`
- `PKG_CAMP`
- `PKG_VENUE`
- `PKG_DONATION`
- `PKG_TRANSFER`
- `PKG_BLOOD_BANK`
- `PKG_HOSPITAL_REQUEST`
- `PKG_STAFF`
- `PKG_NOTIFICATION`
- `PKG_REPORT`
- `PKG_WEBMASTER`
- `PKG_AUDIT`

Suggested reusable functions/triggers:
- donor eligibility function
- camp availability/status function
- inventory availability function
- blood-unit expiry/status maintenance trigger where appropriate
- audit trigger for security-sensitive Oracle changes
- status-transition validation inside package procedures (preferred over triggers when possible)

---

# Frontend → Backend mapping

## homepage

### [HOME-01] clear 3 distinctive entry buttons for **Donors**, **Blood Banks**, and **Organizing Committees**; each section must be visually separated and understandable before login

**Backend:** No dedicated database call is required. The frontend can use static configuration.

**API URL:** None.

**Payload:** None.

**What need to do:** Keep the three entry points as presentation/navigation only. Once a user selects a role, the login/registration flow determines the actual role rather than accepting an arbitrary role from the client.

**What to return:** Nothing.

**OraclePLSql:** N/A — frontend-only navigation.

---

### [HOME-02] emergency broadcasts for urgent blood-bank requests

**API URL:** `GET /api/public/emergency-broadcasts`

**Backend:** MongoDB-backed public feed. Emergency broadcast documents contain the public message, blood-group need, location, urgency, related bank/request reference, publication time, expiry time, and status. The originating hospital request/blood-bank request remains authoritative in Oracle; the broadcast is the public communication representation.

**Payload:** Query parameters:
```text
bloodGroup=A+
location=Colombo
urgency=critical
page=1
pageSize=10
```

**What need to do:** Return only published, active, non-expired broadcasts. C# may enrich a broadcast with safe Oracle public reference data when required, but private bank/staff/request details must never leak.

**What to return:** Paginated broadcast cards with `id`, `title`, `message`, `bloodGroup`, `urgency`, `location`, `publishedAt`, `expiresAt`, `status`, and a safe reference to the related request/bank if applicable.

**OraclePLSql:** N/A — MongoDB broadcast feed; Oracle is only the source of the underlying institutional request when correlation is required.

---

### [HOME-03] emergency blood appeal notices for patients/people who need blood outside the normal blood-bank inventory flow

**API URL:** `GET /api/public/emergency-appeals`

**Backend:** Read active emergency appeal documents from MongoDB. Each appeal may keep a reference to a donor/patient-side identity in Oracle, but public response must contain only the fields explicitly intended for publication.

**Payload:** Optional query:
```text
bloodGroup=O-
location=Kandy
urgency=high
page=1
pageSize=12
```

**What need to do:** Return active/pending appeals according to publication rules. Exclude fulfilled/closed/expired appeals from the active result.

**What to return:** `appealId`, required blood group, urgency, location, required units if public, needed-by date, summary, status, publication date, and safe contact/action metadata.

**OraclePLSql:** N/A — MongoDB emergency appeal content.

---

### [HOME-04] search emergency appeals by blood type, urgency, and location

**API URL:** `GET /api/public/emergency-appeals/search`

**Backend:** MongoDB query/filter operation. Use MongoDB indexes for blood group, status, urgency, location and publication/expiry timestamps.

**Payload:**
```text
GET /api/public/emergency-appeals/search?bloodGroup=A%2B&urgency=critical&location=Colombo&page=1&pageSize=20
```

**What need to do:** Apply supplied filters together, restrict to visible appeals, and return pagination metadata.

**What to return:** Matching appeal summaries plus `page`, `pageSize`, `total` where available.

**OraclePLSql:** N/A — MongoDB search.

---

### [HOME-05] camp awareness materials

**API URL:** `GET /api/public/camps/awareness-materials`

**Backend:** Read published campaign awareness media from MongoDB.

**Payload:** Optional query:
```text
campId=123
type=poster
page=1
pageSize=12
```

**What need to do:** Return published media only; verify the referenced camp is publicly visible in Oracle when a `campId` is supplied.

**What to return:** Media metadata such as `mediaId`, `campId`, `title`, `type`, `url`, `thumbnailUrl`, `publishedAt`.

**OraclePLSql:** If camp visibility is checked from Oracle: `PKG_CAMP.IS_PUBLICLY_VISIBLE(p_camp_id)`; the media itself is MongoDB-backed.

---

### [HOME-06] promotional media

**API URL:** `GET /api/public/promotional-media`

**Backend:** MongoDB-backed published media feed.

**Payload:** Optional category/type/date filters.

**What need to do:** Return only public promotional documents/media. Support flexible document metadata without forcing a rigid Oracle schema.

**What to return:** Media cards with `id`, `title`, `description`, `mediaType`, `url`, `thumbnailUrl`, `publishedAt`, and optional campaign association.

**OraclePLSql:** N/A — MongoDB.

---

### [HOME-07] donor medical guidelines

**API URL:** `GET /api/public/medical-guidelines`

**Backend:** MongoDB-backed document content because guideline material may include flexible document/HTML/PDF/media metadata.

**Payload:** Optional:
```text
category=eligibility
language=en
```

**What need to do:** Return the currently published version(s). The API must expose publication/version metadata so the frontend can show the active document and history if required.

**What to return:** `documentId`, `title`, `summary`, `contentUrl` or content payload, `category`, `version`, `publishedAt`, `updatedAt`, `status`.

**OraclePLSql:** N/A — MongoDB guideline repository.

---

### [HOME-08] donor community discussion threads

**API URL:** `GET /api/public/community/threads`

**Backend:** MongoDB-backed discussion thread feed.

**Payload:** Pagination and optional category:
```text
page=1
pageSize=20
category=donation
```

**What need to do:** Return visible threads with author information limited to public display identity. Keep moderation/status metadata private.

**What to return:** Thread list with `threadId`, title, excerpt, displayAuthor, createdAt, updatedAt, replyCount, status.

**OraclePLSql:** N/A — MongoDB.

---

### [HOME-09] search discussion threads

**API URL:** `GET /api/public/community/threads/search`

**Backend:** MongoDB text search over approved/public thread title/body.

**Payload:**
```text
q=first%20time%20donation&page=1&pageSize=20
```

**What need to do:** Use MongoDB text/index search and return only visible content.

**What to return:** Matching thread summaries and pagination.

**OraclePLSql:** N/A — MongoDB.

---

### [HOME-10] Q&A / frequently asked donor questions

**API URL:** `GET /api/public/community/qa`

**Backend:** MongoDB-backed Q&A documents. The backend should distinguish `question`, `answer`, `status`, and publication state.

**Payload:** Optional category/search filters.

**What need to do:** Return published Q&A content and allow keyword/category filtering.

**What to return:** Questions with answer text, category, tags, publication status, and updated timestamp.

**OraclePLSql:** N/A — MongoDB.

---

### [HOME-11] top-rated donation camps based on donor ratings

**API URL:** `GET /api/public/camps/top-rated`

**Backend:** Aggregate donor reviews/ratings in MongoDB, then verify the referenced camp's public status and basic details in Oracle. Use an aggregation pipeline in MongoDB for rating count and average.

**Payload:** Optional:
```text
limit=10
location=Colombo
```

**What need to do:** Do not rank using one isolated rating. Apply a minimum review threshold if the product rules require it. Exclude camps that are not publicly eligible for listing.

**What to return:** Camp summary with `campId`, public camp details, `averageRating`, `ratingCount`, and ranking order.

**OraclePLSql:** `PKG_CAMP.GET_PUBLIC_SUMMARY(p_camp_id)` for Oracle camp validation/enrichment; rating aggregation is MongoDB.

---

### [HOME-12] view all feedback and ratings for a specific blood donation camp

**API URL:** `GET /api/public/camps/{campId}/feedback`

**Backend:** MongoDB query for all public feedback belonging to the camp. Aggregate summary and paginated reviews may be returned in the same response.

**Payload:** Query:
```text
page=1
pageSize=20
sort=recent
```

**What need to do:** Return only feedback associated with completed donations and already eligible for public display. The backend should never accept a camp ID as proof that a review is valid; the review document must contain its validated donation relationship/reference.

**What to return:** `campId`, `averageRating`, `ratingCount`, paginated feedback entries, safe author display information, created date, and moderation-safe text.

**OraclePLSql:** `PKG_CAMP.GET_PUBLIC_SUMMARY(p_camp_id)` only if Oracle camp verification is needed; feedback is MongoDB.

---

### [HOME-13] public donation camp catalogue with camp date, time, location, organizer, supported blood needs, availability/status, and basic awareness information

**API URL:** `GET /api/public/camps`

**Backend:** Oracle authoritative camp query, optionally enriched with MongoDB awareness media.

**Payload:** Query filters:
```text
dateFrom=2026-09-01
dateTo=2026-09-30
location=Colombo
bloodGroup=O+
status=published
page=1
pageSize=20
```

**What need to do:** A PL/SQL procedure/function should apply public-visibility rules, lifecycle status, capacity/availability, location filters and blood-group filters. The C# layer may join the returned public camp IDs with MongoDB awareness media.

**What to return:** Camp cards with camp ID, date/time, venue, organizer public name, target blood groups, capacity/availability summary, status, and awareness media references.

**OraclePLSql:** `PKG_CAMP.GET_PUBLIC_CATALOGUE(p_filters, p_page, p_page_size, p_result_cursor)`.

---

### [HOME-14] clear navigation to registration/login without forcing users to choose a role before understanding the system

**Backend:** No dedicated data call. Authentication endpoints are defined under common requirements.

**API URL:** None.

**Payload:** None.

**What need to do:** The homepage can navigate to shared authentication; role selection must not be trusted as an authorization mechanism.

**What to return:** Nothing.

**OraclePLSql:** N/A — frontend navigation; authentication is specified under `COMMON-03`.

---

### [HOME-15] public status indicators for camps, blood appeals, and emergency requests so closed/fulfilled items are not presented as active

**API URL:** No single URL; supplied by the corresponding public catalogue/feed endpoints.

**Backend:** Status must be server-derived, not inferred in the frontend. Oracle is authoritative for camp/institutional request lifecycle; MongoDB is authoritative for publication/fulfilment state of appeals/broadcast content.

**Payload:** None.

**What need to do:** Apply status/expiry filtering server-side. Where expiry is time-based, compare against server/database time rather than browser time.

**What to return:** Every public entity returned by its endpoint includes its current safe `status` and relevant timestamps.

**OraclePLSql:** Camp/request endpoints use their owning package procedures/functions; MongoDB content uses MongoDB status/expiry filtering.

---

## doners section

### [DONOR-01] individual registration with normal profile details plus NIC for identification

**API URL:** `POST /api/auth/donors/register`

**Backend:** Oracle-backed donor registration. Validate required fields, uniqueness constraints and NIC format. Do not store unnecessary duplicate identity data in MongoDB.

**Payload:**
```json
{
  "fullName": "Example Donor",
  "email": "donor@example.com",
  "phone": "0712345678",
  "dateOfBirth": "2000-01-15",
  "gender": "OTHER",
  "address": "Colombo",
  "nic": "200012345678"
}
```

**What need to do:** Create the donor account/profile and initial authentication identity. NIC uniqueness and identity constraints belong in Oracle. Password handling is an application/security concern; only a secure password hash should be persisted.

**What to return:** `donorId`, account state, profile summary, and authentication result/session token according to the chosen auth strategy.

**OraclePLSql:** `PKG_AUTH.REGISTER_DONOR(...)` and/or `PKG_DONOR.CREATE_PROFILE(...)`.

---

### [DONOR-02] donor login and personal dashboard

**API URL:** `POST /api/auth/login` and `GET /api/donors/me/dashboard`

**Backend:** Authentication validates credentials and loads role. Dashboard aggregates Oracle donor/camp/donation/eligibility data and may include MongoDB appeal/community counts.

**Payload:**
```json
{
  "username": "donor@example.com",
  "password": "********"
}
```

**What need to do:** Return the authenticated principal and role. Dashboard query should be a read-only PL/SQL operation optimized for the donor home screen rather than many separate table calls.

**What to return:** Login result plus dashboard summaries: next eligible date, upcoming camps, recent donations, active registered appeals, notification count, and pending actions.

**OraclePLSql:** `PKG_AUTH.AUTHENTICATE(...)`; `PKG_DONOR.GET_DASHBOARD(p_donor_id, p_result_cursor)`.

---

### [DONOR-03] manage donor profile and contact information

**API URL:** `GET /api/donors/me/profile` and `PUT /api/donors/me/profile`

**Backend:** Oracle-backed profile read/update.

**Payload:**
```json
{
  "fullName": "Example Donor",
  "phone": "0712345678",
  "email": "new@example.com",
  "address": "Colombo"
}
```

**What need to do:** Update only mutable profile fields. NIC should not be silently changed through the normal profile endpoint.

**What to return:** Updated safe profile.

**OraclePLSql:** `PKG_DONOR.GET_PROFILE(p_donor_id, p_result_cursor)` and `PKG_DONOR.UPDATE_PROFILE(...)`.

---

### [DONOR-04] check donation health eligibility before registering for a donation

**API URL:** `GET /api/donors/me/eligibility`

**Backend:** Oracle function/procedure calculates eligibility from the authoritative donor profile and donation history. The business rule should live in PL/SQL.

**Payload:** Optional `campId` to evaluate eligibility against a specific planned donation date.

**What need to do:** Check minimum interval since last completed donation and any stored eligibility constraints. More detailed medical screening questions can be represented separately later; this requirement is the system-level eligibility gate.

**What to return:** `eligible`, `status`, `reasonCode`, `reason`, `nextEligibleDate`, and optionally `checkedAgainstCampDate`.

**OraclePLSql:** `PKG_DONOR.CHECK_ELIGIBILITY(p_donor_id, p_reference_date, p_eligible OUT, p_reason_code OUT, p_next_date OUT)`.

---

### [DONOR-05] show eligibility result clearly with the reason/status and the next eligible donation date when applicable

**API URL:** `GET /api/donors/me/eligibility`

**Backend:** Same source as `DONOR-04`; no second eligibility algorithm should exist.

**Payload:** Optional `campId` or `date`.

**What need to do:** Return stable machine-readable status/reason codes plus human-readable text suitable for the frontend.

**What to return:** Eligibility result object described above.

**OraclePLSql:** `PKG_DONOR.CHECK_ELIGIBILITY(...)`.

---

### [DONOR-06] browse and find the nearest suitable donation camp via map

**API URL:** `GET /api/donors/me/camps/nearby`

**Backend:** Oracle query for public/available camps, filtered by coordinates, date/status and optionally required blood group. The C# API receives latitude/longitude from the client; Oracle performs the location calculation using the chosen spatial/location strategy.

**Payload:**
```text
lat=6.9271
lon=79.8612
radiusKm=25
date=2026-09-10
bloodGroup=O+
```

**What need to do:** Return camps that are actually available to that donor. Eligibility itself should still be checked when registration is submitted.

**What to return:** Camp IDs, coordinates, distance, date/time, venue, status, and registration availability.

**OraclePLSql:** `PKG_CAMP.FIND_NEARBY_CAMPS(p_lat, p_lon, p_radius_km, p_date, p_blood_group, p_result_cursor)`.

---

### [DONOR-07] view camp details and navigate to the selected camp location

**API URL:** `GET /api/public/camps/{campId}`

**Backend:** Oracle public camp details; optional MongoDB awareness-media enrichment.

**Payload:** None.

**What need to do:** Return public camp information, venue/address/coordinates, organizer public details, target blood groups, capacity/status and awareness content references.

**What to return:** Complete public camp details and map coordinates.

**OraclePLSql:** `PKG_CAMP.GET_PUBLIC_DETAILS(p_camp_id, p_result_cursor)`.

---

### [DONOR-08] register/express attendance for an available donation camp

**API URL:** `POST /api/donors/me/camp-registrations`

**Backend:** Oracle transactional workflow. Validate authenticated donor, camp is published/open, capacity remains, donor is eligible and donor is not already registered/blocked for the same camp.

**Payload:**
```json
{
  "campId": 1204
}
```

**What need to do:** Insert a registration/attendance intent atomically and update any capacity reservation field if the design uses reservation. Prevent duplicate registration using a database constraint plus PL/SQL check.

**What to return:** `registrationId`, camp ID, registration status, timestamps, and next action.

**OraclePLSql:** `PKG_CAMP.REGISTER_DONOR_FOR_CAMP(p_donor_id, p_camp_id, p_registration_id OUT)`.

---

### [DONOR-09] view upcoming registered camps

**API URL:** `GET /api/donors/me/camp-registrations/upcoming`

**Backend:** Oracle read query filtered to authenticated donor and future camp dates with relevant statuses.

**Payload:** Optional pagination.

**What need to do:** Return registered camps and current registration status.

**What to return:** Camp summary, venue, date/time, registration status, and cancellation/action state.

**OraclePLSql:** `PKG_CAMP.GET_DONOR_UPCOMING_REGISTRATIONS(p_donor_id, p_result_cursor)`.

---

### [DONOR-10] donation history check

**API URL:** `GET /api/donors/me/donations`

**Backend:** Oracle donation records read.

**Payload:** Optional date/status pagination filters.

**What need to do:** Show only records belonging to authenticated donor and only records that have reached the visibility state defined by `DONOR-12`.

**What to return:** Donation date, camp, blood group/unit information that the donor is allowed to see, record status, and transfer/receipt status where useful.

**OraclePLSql:** `PKG_DONATION.GET_DONOR_HISTORY(p_donor_id, p_filters, p_result_cursor)`.

---

### [DONOR-11] donation history report (PDF)

**API URL:** `GET /api/donors/me/donations/report?format=pdf`

**Backend:** Oracle supplies report data through a report PL/SQL query/procedure. C# generates the PDF from the returned report model; report generation itself does not require MongoDB.

**Payload:** Optional date/status filters.

**What need to do:** Generate a downloadable historical report using only the authenticated donor's data. The API must not accept an arbitrary donor ID from the browser.

**What to return:** `application/pdf` stream with a safe filename.

**OraclePLSql:** `PKG_REPORT.GET_DONOR_DONATION_HISTORY(p_donor_id, p_filters, p_result_cursor)`.

---

### [DONOR-12] donation records become visible after the organizing committee completes and submits the donation record

**API URL:** `GET /api/donors/me/donations`

**Backend:** Visibility is driven by Oracle donation-record status. A completed/submitted record becomes visible to the donor. A draft record must remain hidden.

**Payload:** None.

**What need to do:** The committee submission procedure is responsible for finalizing the record. The donor query only returns records in permitted final states.

**What to return:** Submitted donation records.

**OraclePLSql:** `PKG_DONATION.GET_DONOR_HISTORY(p_donor_id, ...)`; finalization occurs via `PKG_DONATION.SUBMIT_DONATION_RECORD(...)`.

---

### [DONOR-13] donor feedback and ratings can be posted only for a relevant camp after a completed donation

**API URL:** `POST /api/donors/me/camps/{campId}/feedback`

**Backend:** MongoDB stores the review. Before inserting, C# must ask Oracle whether the authenticated donor has a completed donation for that camp and whether the feedback has already been submitted.

**Payload:**
```json
{
  "rating": 5,
  "comment": "Friendly staff and well organized."
}
```

**What need to do:** Oracle is the authority for review eligibility; MongoDB is the authority for review content. Store a durable Oracle donation/participation reference in the MongoDB document so the review can be audited back to the relational workflow.

**What to return:** `feedbackId`, camp ID, rating, submitted timestamp, and moderation/publication status.

**OraclePLSql:** `PKG_DONATION.CAN_SUBMIT_FEEDBACK(p_donor_id, p_camp_id, p_allowed OUT, p_donation_id OUT, p_reason_code OUT)`.

---

### [DONOR-14] view previously submitted feedback and ratings

**API URL:** `GET /api/donors/me/feedback`

**Backend:** MongoDB query by authenticated donor reference.

**Payload:** Optional pagination.

**What need to do:** Return only the donor's own feedback documents.

**What to return:** Feedback ID, camp ID, rating, comment, submission date and status.

**OraclePLSql:** N/A — MongoDB feedback collection.

---

### [DONOR-15] donor medical guidelines

**API URL:** `GET /api/public/medical-guidelines` or `GET /api/donors/me/medical-guidelines`

**Backend:** MongoDB document repository.

**Payload:** Optional category/version/language.

**What need to do:** Same content source as `HOME-07`; donor pages may use the same endpoint rather than duplicating storage.

**What to return:** Published guideline metadata/content.

**OraclePLSql:** N/A — MongoDB.

---

### [DONOR-16] browse emergency blood appeals

**API URL:** `GET /api/donors/me/emergency-appeals`

**Backend:** MongoDB active-appeal feed, optionally personalized only with safe matching metadata.

**Payload:** Optional pagination.

**What need to do:** Return active/public appeals. If donor eligibility/matching is displayed, calculate it using Oracle donor/blood information without exposing the donor's private data.

**What to return:** Appeal summaries and optional `match`/`relevance` flags.

**OraclePLSql:** If donor matching is required: `PKG_DONOR.GET_DONOR_MATCH_PROFILE(p_donor_id, ...)`; appeal data remains MongoDB.

---

### [DONOR-17] search emergency appeals by blood type, urgency, and location

**API URL:** `GET /api/donors/me/emergency-appeals/search`

**Backend:** MongoDB search; donor authentication is required only because the route is donor-facing, not because the appeal documents are private.

**Payload:** Same filters as `HOME-04`.

**What need to do:** Return active matches with pagination.

**What to return:** Appeal list and pagination metadata.

**OraclePLSql:** N/A — MongoDB.

---

### [DONOR-18] submit an emergency blood appeal for a patient/self when the system allows donor-side appeals; the appeal must have a visible status such as pending, active, fulfilled, or closed

**API URL:** `POST /api/donors/me/emergency-appeals`

**Backend:** MongoDB stores the flexible appeal content/status. Oracle stores the authenticated donor identity/account and should provide a stable `createdByDonorId`. If approval/verification is a relational workflow, store its authoritative state in Oracle and mirror the public state into MongoDB.

**Payload:**
```json
{
  "patientReference": "PAT-2026-001",
  "relationship": "self",
  "bloodGroup": "A+",
  "unitsRequired": 2,
  "urgency": "critical",
  "location": "Colombo",
  "neededBy": "2026-09-05T12:00:00+05:30",
  "summary": "Urgent requirement for surgery."
}
```

**What need to do:** Validate the donor account, required fields, dates and allowed status transitions. New appeals should normally enter `pending` unless the product explicitly permits immediate activation.

**What to return:** `appealId`, status, createdAt, expiry/neededBy, and next action.

**OraclePLSql:** `PKG_DONOR.GET_ACCOUNT_STATUS(p_donor_id, ...)` if account verification is required; appeal content/status is MongoDB.

---

### [DONOR-19] participate in donor community discussion threads

**API URL:** `GET /api/community/threads`, `POST /api/community/threads/{threadId}/replies`

**Backend:** MongoDB discussion documents. Public display identity should be derived from safe profile information, not expose NIC/contact details.

**Payload:**
```json
{
  "body": "Has anyone donated at this camp before?"
}
```

**What need to do:** Validate authenticated donor membership, content size, visibility/moderation rules and thread status. Store author identity reference and display-safe metadata.

**What to return:** Created reply/thread metadata and current thread state.

**OraclePLSql:** N/A — MongoDB community data; Oracle may be consulted only to verify donor account status.

---

### [DONOR-20] create questions/posts and view Q&A content

**API URL:** `POST /api/community/qa`; `GET /api/community/qa`; `GET /api/community/qa/search`

**Backend:** MongoDB Q&A collection.

**Payload:**
```json
{
  "title": "What should I eat before donating?",
  "body": "I am donating tomorrow morning."
}
```

**What need to do:** Create question/post with pending or visible status according to moderation design. Read published questions and answers.

**What to return:** Q&A item, status, timestamps, safe display author and answer list.

**OraclePLSql:** N/A — MongoDB.

---

### [DONOR-21] notifications for camp registration/status, donation completion, eligibility availability, appeal updates, and relevant system announcements

**API URL:** `GET /api/donors/me/notifications`; `PATCH /api/donors/me/notifications/{notificationId}/read`

**Backend:** Notification metadata is best kept in Oracle because it participates in role/entity workflows; payload/content references may point to MongoDB documents where needed.

**Payload:**
```json
{
  "read": true
}
```

**What need to do:** Create notification records as part of relevant PL/SQL business transactions or through an application notification service triggered by successful transactions. Do not send a notification before the underlying transaction commits.

**What to return:** Notification list with type, title, message/reference, read status, createdAt and action URL.

**OraclePLSql:** `PKG_NOTIFICATION.GET_USER_NOTIFICATIONS(p_user_id, p_page, p_page_size, p_result_cursor)` and `PKG_NOTIFICATION.MARK_READ(p_user_id, p_notification_id)`.

---

### [DONOR-22] donor-facing status history so the user can understand whether an action is pending, confirmed, completed, cancelled, or closed

**API URL:** `GET /api/donors/me/status-history`

**Backend:** Oracle audit/workflow-history records for donor-owned actions. MongoDB document status histories should only be included for MongoDB-owned objects when required.

**Payload:** Optional `entityType`, `entityId`, date filters.

**What need to do:** Return human-readable state transitions and timestamps. Do not expose internal SQL/audit fields.

**What to return:** `entityType`, `entityId`, `fromStatus`, `toStatus`, `changedAt`, safe reason, and actor type.

**OraclePLSql:** `PKG_AUDIT.GET_DONOR_STATUS_HISTORY(p_donor_id, p_filters, p_result_cursor)`.

---

## blood banks section

### [BANK-01] blood-bank login and dedicated dashboard

**API URL:** `POST /api/auth/login`; `GET /api/banks/me/dashboard`

**Backend:** Authentication identifies the bank user and associated blood bank. Dashboard reads Oracle summaries.

**Payload:** Shared login payload from authentication.

**What need to do:** Enforce `BLOOD_BANK` role and membership.

**What to return:** Bank identity plus inventory/request/transfer/expiry summary.

**OraclePLSql:** `PKG_AUTH.AUTHENTICATE(...)`; `PKG_BLOOD_BANK.GET_DASHBOARD(p_bank_id, p_result_cursor)`.

---

### [BANK-02] track blood inventory by blood group, unit, status, and relevant storage/expiry information

**API URL:** `GET /api/banks/me/inventory`

**Backend:** Oracle authoritative inventory.

**Payload:** Optional filters:
```text
bloodGroup=O+
status=AVAILABLE
expiresBefore=2026-09-30
page=1
pageSize=50
```

**What need to do:** Read current blood-unit states and storage/expiry metadata. Inventory changes must occur through PL/SQL transactional procedures.

**What to return:** Units or aggregated inventory rows with group, unit/reference, batch, status, collection/received date, expiry date, storage/location metadata allowed to staff.

**OraclePLSql:** `PKG_BLOOD_BANK.GET_INVENTORY(p_bank_id, p_filters, p_result_cursor)`.

---

### [BANK-03] blood group unit management

**API URL:** `POST /api/banks/me/inventory/units`; `PATCH /api/banks/me/inventory/units/{unitId}`

**Backend:** Oracle. Creation should normally occur through a receipt/donation-transfer operation rather than arbitrary manual unit creation.

**Payload:**
```json
{
  "bloodGroup": "O+",
  "batchId": 4501,
  "collectionDate": "2026-09-03",
  "expiryDate": "2026-10-15"
}
```

**What need to do:** Prefer controlled unit creation from received donation batches. Manual correction actions, if permitted, need explicit role permission and audit.

**What to return:** Blood unit identity and resulting status.

**OraclePLSql:** `PKG_BLOOD_BANK.REGISTER_BLOOD_UNIT(...)` and `PKG_BLOOD_BANK.UPDATE_BLOOD_UNIT(...)`.

---

### [BANK-04] search and filter inventory/records

**API URL:** `GET /api/banks/me/inventory/search`

**Backend:** Oracle search procedure/function.

**Payload:** Blood group, status, batch, source camp, expiry range, receipt date, page.

**What need to do:** Apply all filters server-side and return a paginated cursor-backed result.

**What to return:** Matching inventory records and pagination metadata.

**OraclePLSql:** `PKG_BLOOD_BANK.SEARCH_INVENTORY(p_bank_id, p_filters, p_result_cursor)`.

---

### [BANK-05] receive and manage hospital blood requests

**API URL:** `POST /api/banks/me/hospital-requests`; `GET /api/banks/me/hospital-requests`; `GET /api/banks/me/hospital-requests/{requestId}`; `PATCH /api/banks/me/hospital-requests/{requestId}/status`

**Backend:** Oracle. Hospital requests are institutional business records.

**Payload:**
```json
{
  "hospitalName": "Example Hospital",
  "contactPerson": "Example Contact",
  "bloodGroup": "A+",
  "unitsRequired": 4,
  "neededBy": "2026-09-04T18:00:00+05:30",
  "priority": "HIGH",
  "notes": "Required for scheduled surgery."
}
```

**What need to do:** Create/read/update the request within allowed bank permissions. Allocation/fulfilment must check inventory availability inside PL/SQL.

**What to return:** Request ID, status, requested units, allocated units, fulfilled units and timestamps.

**OraclePLSql:** `PKG_HOSPITAL_REQUEST.CREATE_REQUEST(...)`, `PKG_HOSPITAL_REQUEST.GET_REQUESTS(...)`, `PKG_HOSPITAL_REQUEST.UPDATE_STATUS(...)`.

---

### [BANK-06] hospital requests must remain a **blood-bank responsibility**; organizing committees do not directly fulfil hospital requests

**API URL:** Authorization policy enforced across hospital-request endpoints.

**Backend:** C# authorization must reject committee principals. Oracle procedures should also validate caller context/ownership where applicable.

**Payload:** N/A beyond the underlying request operation.

**What need to do:** Keep hospital-request state and inventory allocation entirely under blood-bank workflows.

**What to return:** `403 Forbidden` for unauthorized committee actions; normal result for authorized bank actions.

**OraclePLSql:** Each hospital-request procedure uses bank authorization context, e.g. `PKG_HOSPITAL_REQUEST.AUTHORIZE_BANK_ACTION(...)`.

---

### [BANK-07] view incoming donations assigned to the blood bank by organizing committees

**API URL:** `GET /api/banks/me/donation-transfers/incoming`

**Backend:** Oracle transfer records.

**Payload:** Optional status/date/camp filters.

**What need to do:** Return transfers assigned to this bank and not arbitrary transfers.

**What to return:** Transfer ID, camp, batch summary, unit count, created/submitted/received status, dispatch/receive timestamps.

**OraclePLSql:** `PKG_TRANSFER.GET_INCOMING_TRANSFERS(p_bank_id, p_filters, p_result_cursor)`.

---

### [BANK-08] receive/register donated units into blood-bank inventory after a camp donation transfer is completed

**API URL:** `POST /api/banks/me/donation-transfers/{transferId}/receive`

**Backend:** Oracle transaction. Receiving a transfer should atomically validate transfer status, receiving bank, unit/batch details and then create/update inventory units.

**Payload:**
```json
{
  "receivedAt": "2026-09-03T16:30:00+05:30",
  "receivedUnitCount": 24,
  "notes": "All units received."
}
```

**What need to do:** Prevent double receipt. On successful receipt, the transfer becomes `RECEIVED` and corresponding units become available or `QUARANTINED` according to the system's chosen blood-safety workflow. The minimal demonstration may use `AVAILABLE` after receipt if no screening/quarantine model is being implemented.

**What to return:** Transfer status, received count and resulting inventory summary.

**OraclePLSql:** `PKG_TRANSFER.RECEIVE_TRANSFER(p_bank_id, p_transfer_id, p_received_at, p_received_count, ...)`.

---

### [BANK-09] track the source of each received donation at a high level, including the related donation camp and donation batch/record

**API URL:** `GET /api/banks/me/inventory/{unitId}/source`

**Backend:** Oracle relationship query from blood unit → donation batch/record → camp.

**Payload:** None.

**What need to do:** Return traceability without exposing donor private identity unless explicitly authorized/required. A high-level source should identify camp and batch.

**What to return:** Camp ID/name, transfer ID, donation batch ID, received date, source committee, and unit reference.

**OraclePLSql:** `PKG_BLOOD_BANK.GET_UNIT_SOURCE_TRACE(p_bank_id, p_unit_id, p_result_cursor)`.

---

### [BANK-10] manage blood-unit availability status, including available, reserved/allocated, issued, expired, and otherwise unavailable states

**API URL:** `PATCH /api/banks/me/inventory/{unitId}/status`

**Backend:** Oracle controlled status-transition procedure.

**Payload:**
```json
{
  "status": "RESERVED",
  "requestId": 901
}
```

**What need to do:** Validate legal transitions. A unit cannot be issued if expired, unavailable or already issued. Reservation/issue changes should occur inside hospital-request allocation procedures where possible rather than arbitrary status editing.

**What to return:** Updated unit status and related request/allocation reference.

**OraclePLSql:** `PKG_BLOOD_BANK.CHANGE_UNIT_STATUS(p_bank_id, p_unit_id, p_new_status, p_reference_id, ...)`.

---

### [BANK-11] track blood units approaching expiration

**API URL:** `GET /api/banks/me/inventory/expiring`

**Backend:** Oracle query/function using current database date and configurable warning window.

**Payload:**
```text
days=7&page=1&pageSize=50
```

**What need to do:** Return units whose expiry falls within the selected window and are still relevant for action.

**What to return:** Unit/batch summary, blood group, expiry date, days remaining and current status.

**OraclePLSql:** `PKG_BLOOD_BANK.GET_EXPIRING_UNITS(p_bank_id, p_days, p_result_cursor)`.

---

### [BANK-12] track expired blood units

**API URL:** `GET /api/banks/me/inventory/expired`

**Backend:** Oracle query. Expiry should be based on server/database date, not frontend calculations.

**Payload:** Optional date/page/status filters.

**What need to do:** Return expired units and ensure expired units cannot be selected for fulfilment.

**What to return:** Unit, group, expiry date, status and recommended action.

**OraclePLSql:** `PKG_BLOOD_BANK.GET_EXPIRED_UNITS(p_bank_id, p_filters, p_result_cursor)`.

---

### [BANK-13] staff tracking

**API URL:** `GET /api/banks/me/staff`

**Backend:** Oracle staff assignment records.

**Payload:** Optional camp/active filters.

**What need to do:** Return staff currently associated with the bank and relevant assignment information.

**What to return:** Staff ID, display name, position/role, active status, assignment dates.

**OraclePLSql:** `PKG_STAFF.GET_BANK_STAFF(p_bank_id, p_result_cursor)`.

---

### [BANK-14] manage/view staff assigned to the blood bank

**API URL:** `GET /api/banks/me/staff`; `POST /api/banks/me/staff`; `PATCH /api/banks/me/staff/{staffId}`

**Backend:** Oracle staff records. Exact create/update permissions should belong to the bank's authorized administrative account if such a permission exists.

**Payload:**
```json
{
  "fullName": "Bank Staff",
  "position": "Technician",
  "phone": "0712345678"
}
```

**What need to do:** Manage staff membership and assignment with audit.

**What to return:** Staff record and assignment state.

**OraclePLSql:** `PKG_STAFF.CREATE_BANK_STAFF(...)`, `PKG_STAFF.UPDATE_BANK_STAFF(...)`, `PKG_STAFF.GET_BANK_STAFF(...)`.

---

### [BANK-15] hospital request status tracking, such as pending, approved/allocated, fulfilled, cancelled, or closed

**API URL:** `GET /api/banks/me/hospital-requests/{requestId}`; `PATCH /api/banks/me/hospital-requests/{requestId}/status`

**Backend:** Oracle state machine. Status transitions should be controlled by PL/SQL.

**Payload:**
```json
{
  "status": "ALLOCATED"
}
```

**What need to do:** Validate transitions and inventory conditions. For example, `FULFILLED` should not be possible until required units have actually been issued/confirmed.

**What to return:** Current status, status history summary, allocated/fulfilled counts and timestamps.

**OraclePLSql:** `PKG_HOSPITAL_REQUEST.UPDATE_STATUS(p_bank_id, p_request_id, p_new_status, ...)`.

---

### [BANK-16] reports including inventory, expiry, hospital requests, donations received, and other operational reports with filters

**API URL:** `GET /api/banks/me/reports/{reportType}`

**Backend:** Oracle report procedures/functions. C# translates the selected report result into JSON or PDF/CSV as requested.

**Payload:** Common filters:
```text
dateFrom=2026-09-01
dateTo=2026-09-30
bloodGroup=O+
status=AVAILABLE
format=json
```

**What need to do:** Each report type maps to a focused PL/SQL report operation. Use cursors for row-oriented results and aggregate queries/functions for summary sections.

**What to return:** Report metadata plus rows/summary or a PDF/CSV stream.

**OraclePLSql:** `PKG_REPORT.GET_BANK_REPORT(p_bank_id, p_report_type, p_filters, p_result_cursor)`.

---

### [BANK-17] blood-bank view of donation transfers received from organizing committees

**API URL:** `GET /api/banks/me/donation-transfers/history`

**Backend:** Oracle transfer history.

**Payload:** Optional date/status/camp filters.

**What need to do:** Show received and historical transfers for the authenticated bank.

**What to return:** Transfer list, source camp, batch count, received count, status and timestamps.

**OraclePLSql:** `PKG_TRANSFER.GET_BANK_TRANSFER_HISTORY(p_bank_id, p_filters, p_result_cursor)`.

---

### [BANK-18] notifications for new hospital requests, low-stock conditions, incoming camp donations, and expiry warnings

**API URL:** `GET /api/banks/me/notifications`; `PATCH /api/banks/me/notifications/{notificationId}/read`

**Backend:** Oracle notification records. Low-stock/expiry notification creation can be triggered by successful business transactions or scheduled database jobs/application jobs.

**Payload:** Same read-marker payload as donor notifications.

**What need to do:** Generate notifications after committed state changes. Low-stock and expiry logic should be based on Oracle inventory queries.

**What to return:** Notification feed.

**OraclePLSql:** `PKG_NOTIFICATION.GET_BANK_NOTIFICATIONS(p_bank_id, ...)`; optionally `PKG_BLOOD_BANK.GET_LOW_STOCK_ALERTS(...)`.

---

### [BANK-19] clear dashboard summaries for total available units, low-stock groups, expiring units, pending hospital requests, and recent incoming donations

**API URL:** `GET /api/banks/me/dashboard`

**Backend:** Oracle summary procedure/function. Prefer one dashboard operation returning all summary sections rather than many independent API calls.

**Payload:** Optional `expiryWarningDays`.

**What need to do:** Calculate authoritative counts/aggregates against current inventory/requests/transfers.

**What to return:** Dashboard object with available units, low-stock groups, expiring count, pending requests and recent transfer summary.

**OraclePLSql:** `PKG_BLOOD_BANK.GET_DASHBOARD(p_bank_id, p_result_cursor)`.

---

## organizing comittee section

### [COMMITTEE-01] organizing-committee login and dedicated dashboard

**API URL:** `POST /api/auth/login`; `GET /api/committees/me/dashboard`

**Backend:** Oracle authentication + committee dashboard.

**Payload:** Shared login.

**What need to do:** Validate `ORGANIZING_COMMITTEE` role and committee membership.

**What to return:** Committee identity and dashboard summaries.

**OraclePLSql:** `PKG_AUTH.AUTHENTICATE(...)`; `PKG_CAMP.GET_COMMITTEE_DASHBOARD(p_committee_id, p_result_cursor)`.

---

### [COMMITTEE-02] organize donation camps

**API URL:** `GET /api/committees/me/camps`; create/update routes are specified below.

**Backend:** Oracle camp management aggregate.

**Payload:** N/A for list.

**What need to do:** Provide the committee's own camps and their lifecycle state.

**What to return:** Camp summaries, counts and pending actions.

**OraclePLSql:** `PKG_CAMP.GET_COMMITTEE_CAMPS(p_committee_id, p_filters, p_result_cursor)`.

---

### [COMMITTEE-03] create/register donation camps with date, time, venue, capacity, organizer details, and required/target blood groups when applicable

**API URL:** `POST /api/committees/me/camps`

**Backend:** Oracle transactional camp creation. Venue must exist or be created through venue management; scheduling conflicts must be checked in PL/SQL.

**Payload:**
```json
{
  "title": "Colombo Community Blood Camp",
  "date": "2026-09-20",
  "startTime": "09:00",
  "endTime": "15:00",
  "venueId": 301,
  "capacity": 150,
  "targetBloodGroups": ["O+", "A+", "B+"],
  "organizerDisplayName": "Colombo Organizing Committee"
}
```

**What need to do:** Validate date/time, venue conflict, capacity and committee ownership.

**What to return:** New camp ID and initial `DRAFT` status.

**OraclePLSql:** `PKG_CAMP.CREATE_CAMP(...)`.

---

### [COMMITTEE-04] manage camp lifecycle: draft, published/open, ongoing, completed, cancelled, and closed

**API URL:** `PATCH /api/committees/me/camps/{campId}/status`

**Backend:** Oracle controlled state machine.

**Payload:**
```json
{
  "status": "PUBLISHED"
}
```

**What need to do:** Validate allowed transitions and automatically record status history/audit. `ONGOING`, `COMPLETED`, `CANCELLED`, and `CLOSED` should only be reachable according to business rules.

**What to return:** Camp ID, previous/current status, transition timestamp and next allowed action summary.

**OraclePLSql:** `PKG_CAMP.CHANGE_CAMP_STATUS(p_committee_id, p_camp_id, p_new_status, ...)`.

---

### [COMMITTEE-05] venue management

**API URL:** `GET /api/committees/me/venues`; `POST /api/committees/me/venues`; `PATCH /api/committees/me/venues/{venueId}`

**Backend:** Oracle venue data.

**Payload:**
```json
{
  "name": "Community Hall",
  "address": "Colombo",
  "latitude": 6.9271,
  "longitude": 79.8612,
  "capacity": 200
}
```

**What need to do:** Maintain reusable venues and their location/capacity information.

**What to return:** Venue record.

**OraclePLSql:** `PKG_VENUE.CREATE_VENUE(...)`, `PKG_VENUE.UPDATE_VENUE(...)`, `PKG_VENUE.GET_COMMITTEE_VENUES(...)`.

---

### [COMMITTEE-06] manage/view venues used by donation camps and prevent conflicting camp scheduling in the frontend

**API URL:** `GET /api/committees/me/venues/{venueId}/availability`

**Backend:** The frontend may prevent conflicts for usability, but the backend **must** also enforce the rule.

**Payload:**
```text
date=2026-09-20&startTime=09:00&endTime=15:00
```

**What need to do:** Return schedule conflicts and reject conflicting camp creation/update at the PL/SQL level to handle concurrent requests safely.

**What to return:** Availability boolean and conflicting camp summaries.

**OraclePLSql:** `PKG_VENUE.CHECK_AVAILABILITY(p_venue_id, p_date, p_start_time, p_end_time, p_exclude_camp_id, p_available OUT, p_result_cursor)`.

---

### [COMMITTEE-07] publish camp awareness materials

**API URL:** `POST /api/committees/me/camps/{campId}/awareness-materials`; `PATCH /api/committees/me/camps/{campId}/awareness-materials/{mediaId}`

**Backend:** MongoDB content/media metadata, with Oracle authorization and camp existence/ownership check.

**Payload:**
```json
{
  "title": "Why Donate Blood?",
  "description": "Awareness poster.",
  "mediaType": "image",
  "url": "https://media.example/poster.jpg",
  "published": true
}
```

**What need to do:** Confirm committee owns the camp in Oracle before creating/updating MongoDB media. The actual file can be stored in object storage while MongoDB stores flexible metadata and URL.

**What to return:** Media document metadata and publication state.

**OraclePLSql:** `PKG_CAMP.AUTHORIZE_COMMITTEE_CAMP(p_committee_id, p_camp_id, p_allowed OUT)`; media is MongoDB.

---

### [COMMITTEE-08] manage camp information shown in the public donation camp catalogue

**API URL:** `PATCH /api/committees/me/camps/{campId}`

**Backend:** Oracle. Only public-safe fields should be accepted; system-derived status/capacity fields cannot be forged.

**Payload:** Mutable camp title, description, target groups, venue/date/time, public organizer description.

**What need to do:** Validate ownership, venue conflicts, lifecycle constraints and public-visibility rules.

**What to return:** Updated camp.

**OraclePLSql:** `PKG_CAMP.UPDATE_CAMP(p_committee_id, p_camp_id, ...)`.

---

### [COMMITTEE-09] donor registration/attendance list for each camp

**API URL:** `GET /api/committees/me/camps/{campId}/registrations`

**Backend:** Oracle attendance/registration records.

**Payload:** Optional search/status/pagination.

**What need to do:** Return donors registered for the committee's camp. Sensitive donor fields such as NIC should not be returned unless strictly required for the camp workflow; use masked or operational identifiers where possible.

**What to return:** Donor operational ID, display name, registration status, attendance status, eligibility status and check-in state.

**OraclePLSql:** `PKG_CAMP.GET_CAMP_REGISTRATIONS(p_committee_id, p_camp_id, p_filters, p_result_cursor)`.

---

### [COMMITTEE-10] record donations for donors who actually donate at the camp

**API URL:** `POST /api/committees/me/camps/{campId}/donations`

**Backend:** Oracle transactional donation-record creation.

**Payload:**
```json
{
  "donorId": 5502,
  "donationDate": "2026-09-20",
  "bloodGroup": "O+",
  "unitsCollected": 1
}
```

**What need to do:** Confirm donor was registered/attending and eligible on the donation date. Create a donation record in a non-final state until review/submission.

**What to return:** Donation record ID and `DRAFT`/`PENDING_REVIEW` status.

**OraclePLSql:** `PKG_DONATION.CREATE_DONATION_RECORD(p_committee_id, p_camp_id, p_donor_id, ...)`.

---

### [COMMITTEE-11] ensure a completed donation record is associated with both the donor and the relevant donation camp

**API URL:** `PATCH /api/committees/me/donation-records/{donationId}`

**Backend:** Oracle foreign-key relationships and PL/SQL validation enforce donor + camp association.

**Payload:** Allowed editable donation fields.

**What need to do:** Never allow a client to move a completed donation record to another donor or camp. Finalized records should be immutable except through an explicit correction process.

**What to return:** Donation record with donor/camp references.

**OraclePLSql:** `PKG_DONATION.UPDATE_DONATION_RECORD(...)` with ownership and immutability checks.

---

### [COMMITTEE-12] donation record entry and review before final submission

**API URL:** `PATCH /api/committees/me/donation-records/{donationId}`; `POST /api/committees/me/donation-records/{donationId}/submit`

**Backend:** Oracle two-stage workflow: draft/edit, then final submission.

**Payload:**
```json
{
  "bloodGroup": "O+",
  "unitsCollected": 1,
  "notes": "Successful donation"
}
```

**What need to do:** On submission, run all validation and commit final state atomically. Trigger notification creation only after successful commit.

**What to return:** Finalized donation record and status.

**OraclePLSql:** `PKG_DONATION.UPDATE_DONATION_RECORD(...)`; `PKG_DONATION.SUBMIT_DONATION_RECORD(p_committee_id, p_donation_id, ...)`.

---

### [COMMITTEE-13] once a donation record is completed, the donor's next donation eligibility information is updated by the system and reflected in the donor UI

**API URL:** No separate mutation URL; triggered by donation-record finalization. Read through `GET /api/donors/me/eligibility`.

**Backend:** Oracle business rule. On final donation submission, update donor eligibility state or store the completed donation and have the eligibility function derive the next date. Prefer deriving the date from authoritative donation history where practical rather than maintaining duplicated date values.

**Payload:** None beyond donation submission.

**What need to do:** Ensure the donor cannot be shown as eligible before the completed donation transaction commits.

**What to return:** Updated eligibility on the next donor eligibility read; optionally include `nextEligibleDate` in the submit response.

**OraclePLSql:** `PKG_DONOR.RECALCULATE_ELIGIBILITY(p_donor_id)` called from `PKG_DONATION.SUBMIT_DONATION_RECORD(...)` or derived by `PKG_DONOR.CHECK_ELIGIBILITY(...)`.

---

### [COMMITTEE-14] connect completed camp donations with a selected blood bank for transfer

**API URL:** `POST /api/committees/me/camps/{campId}/donation-transfers`

**Backend:** Oracle creates a transfer batch referencing the completed camp donation records and selected bank.

**Payload:**
```json
{
  "bloodBankId": 12,
  "donationRecordIds": [8001, 8002, 8003]
}
```

**What need to do:** Validate that every donation record belongs to the camp, is finalized, and has not already been transferred. Create one transfer batch.

**What to return:** Transfer ID, selected bank, unit/batch count and `PENDING`/`PREPARED` status.

**OraclePLSql:** `PKG_TRANSFER.CREATE_TRANSFER(p_committee_id, p_camp_id, p_bank_id, p_donation_record_ids, p_transfer_id OUT)`.

---

### [COMMITTEE-15] create/manage a donation transfer to a blood bank and track transfer status

**API URL:** `GET /api/committees/me/donation-transfers`; `PATCH /api/committees/me/donation-transfers/{transferId}/status`

**Backend:** Oracle transfer state machine.

**Payload:**
```json
{
  "status": "DISPATCHED"
}
```

**What need to do:** Permit only valid camp-side transitions, e.g. `PREPARED → DISPATCHED`. Receiving the transfer is a bank action, not a committee action.

**What to return:** Transfer status, bank, counts and timestamps.

**OraclePLSql:** `PKG_TRANSFER.CHANGE_COMMITTEE_TRANSFER_STATUS(p_committee_id, p_transfer_id, p_new_status, ...)`.

---

### [COMMITTEE-16] do not directly manage blood-bank inventory; the committee only manages the camp-side donation and transfer workflow

**API URL:** Authorization boundary on all `/api/committees/.../inventory` attempts.

**Backend:** There should be no committee inventory API. Attempts must return `403`.

**Payload:** N/A.

**What need to do:** Keep the transfer boundary explicit.

**What to return:** `403 Forbidden` for invalid actions.

**OraclePLSql:** N/A — absence of an inventory API is the intended design; Oracle transfer procedures manage only camp-side records.

---

### [COMMITTEE-17] view whether transferred donations have been received by the selected blood bank

**API URL:** `GET /api/committees/me/donation-transfers/{transferId}`

**Backend:** Oracle transfer record read. The receiving bank changes receipt state; committee receives a read-only view.

**Payload:** None.

**What need to do:** Show transfer status and receipt timestamp/count.

**What to return:** Transfer status, dispatched date, received date, received count, bank name.

**OraclePLSql:** `PKG_TRANSFER.GET_TRANSFER_DETAILS_FOR_COMMITTEE(p_committee_id, p_transfer_id, p_result_cursor)`.

---

### [COMMITTEE-18] staff tracking

**API URL:** `GET /api/committees/me/staff`

**Backend:** Oracle staff records.

**Payload:** Optional camp/active filters.

**What need to do:** Return committee staff and assignments.

**What to return:** Staff summaries and assignment state.

**OraclePLSql:** `PKG_STAFF.GET_COMMITTEE_STAFF(p_committee_id, p_result_cursor)`.

---

### [COMMITTEE-19] manage/view committee staff assigned to each camp

**API URL:** `GET /api/committees/me/camps/{campId}/staff`; `POST /api/committees/me/camps/{campId}/staff`; `DELETE /api/committees/me/camps/{campId}/staff/{staffId}`

**Backend:** Oracle assignment records.

**Payload:**
```json
{
  "staffId": 77,
  "assignmentRole": "Registration Desk"
}
```

**What need to do:** Verify staff belongs to the committee and camp belongs to the committee before assignment.

**What to return:** Assignment record.

**OraclePLSql:** `PKG_STAFF.ASSIGN_TO_CAMP(...)`; `PKG_STAFF.REMOVE_FROM_CAMP(...)`.

---

### [COMMITTEE-20] camp attendance and operational status overview

**API URL:** `GET /api/committees/me/camps/{campId}/overview`

**Backend:** Oracle aggregate dashboard query.

**Payload:** None.

**What need to do:** Return registrations, attendance, completed donations, pending records and transfer status without requiring multiple frontend calls.

**What to return:** Counts and current operational statuses.

**OraclePLSql:** `PKG_CAMP.GET_OPERATIONAL_OVERVIEW(p_committee_id, p_camp_id, p_result_cursor)`.

---

### [COMMITTEE-21] view donor feedback and ratings for the committee's camps

**API URL:** `GET /api/committees/me/camps/{campId}/feedback`

**Backend:** MongoDB feedback read, preceded by Oracle authorization that camp belongs to committee.

**Payload:** Pagination/sort.

**What need to do:** Return ratings/comments for the committee's camp and aggregate rating.

**What to return:** Average rating, count and paginated feedback.

**OraclePLSql:** `PKG_CAMP.AUTHORIZE_COMMITTEE_CAMP(p_committee_id, p_camp_id, p_allowed OUT)`; feedback is MongoDB.

---

### [COMMITTEE-22] notifications for camp registrations, camp status changes, donation-record completion, and blood-bank transfer status

**API URL:** `GET /api/committees/me/notifications`; `PATCH /api/committees/me/notifications/{notificationId}/read`

**Backend:** Oracle notifications.

**Payload:** Read marker.

**What need to do:** Create notifications after the underlying Oracle transaction commits.

**What to return:** Notification list.

**OraclePLSql:** `PKG_NOTIFICATION.GET_COMMITTEE_NOTIFICATIONS(p_committee_id, ...)`; `PKG_NOTIFICATION.MARK_READ(...)`.

---

### [COMMITTEE-23] reports for camps, attendance, donations recorded, transfers, and feedback/ratings

**API URL:** `GET /api/committees/me/reports/{reportType}`

**Backend:** Oracle for camp/attendance/donation/transfer reports; MongoDB aggregation for feedback metrics, optionally combined by C#.

**Payload:** Common date/camp/status filters and `format`.

**What need to do:** Apply committee ownership to every report. Feedback report must aggregate only the committee's camps.

**What to return:** JSON report model or PDF/CSV.

**OraclePLSql:** `PKG_REPORT.GET_COMMITTEE_REPORT(p_committee_id, p_report_type, p_filters, p_result_cursor)` for Oracle-backed sections; MongoDB aggregation for feedback section.

---

## webmaster

### [WEBMASTER-01] webmaster login and monitoring dashboard

**API URL:** `POST /api/auth/login`; `GET /api/webmaster/dashboard`

**Backend:** Oracle authentication and read-only monitoring aggregates.

**Payload:** Shared login.

**What need to do:** Validate webmaster role and provide monitoring data only.

**What to return:** Overall metrics and system health/workflow cards.

**OraclePLSql:** `PKG_AUTH.AUTHENTICATE(...)`; `PKG_WEBMASTER.GET_DASHBOARD(p_result_cursor)`.

---

### [WEBMASTER-02] overall system monitoring across donors, blood banks, organizing committees, camps, donations, blood inventory summaries, hospital requests, emergency appeals, and system activity

**API URL:** `GET /api/webmaster/overview`

**Backend:** Combined monitoring read model. Oracle supplies relational counts and workflow states; MongoDB supplies public-content/community/appeal aggregates.

**Payload:** Optional date/status filters.

**What need to do:** Return safe system-wide metrics without exposing private donor identity or operational secrets unnecessarily.

**What to return:** Donor count, bank count, committee count, camp counts by state, donation counts, inventory totals, hospital request counts, appeal counts, community/content activity and recent system activity.

**OraclePLSql:** `PKG_WEBMASTER.GET_SYSTEM_OVERVIEW(p_filters, p_result_cursor)`; MongoDB aggregation supplies Mongo-backed metrics.

---

### [WEBMASTER-03] global read-only summaries and statistics

**API URL:** `GET /api/webmaster/statistics`

**Backend:** Oracle aggregate reporting plus MongoDB aggregate metrics where relevant.

**Payload:** Date range/filter object.

**What need to do:** Ensure this endpoint is read-only at the API and database package level.

**What to return:** Aggregated statistics only, not raw personal records.

**OraclePLSql:** `PKG_WEBMASTER.GET_GLOBAL_STATISTICS(p_filters, p_result_cursor)`.

---

### [WEBMASTER-04] cross-role dashboards that allow the webmaster to understand the current state of the entire system

**API URL:** `GET /api/webmaster/dashboards/{dashboardType}`

**Backend:** Oracle read-only monitoring procedures with optional MongoDB aggregation for content/community dashboards.

**Payload:** Dashboard type and filters.

**What need to do:** Return role-specific operational views without granting role-management capabilities.

**What to return:** Dashboard-specific aggregate metrics.

**OraclePLSql:** `PKG_WEBMASTER.GET_DASHBOARD_VIEW(p_dashboard_type, p_filters, p_result_cursor)`.

---

### [WEBMASTER-05] monitoring of active/inactive/closed entities and major workflow states

**API URL:** `GET /api/webmaster/status-overview`

**Backend:** Oracle status aggregate across core relational entities; MongoDB status counts for Mongo-backed content.

**Payload:** Optional entity/status filters.

**What need to do:** Show state distribution and recent changes.

**What to return:** Counts by entity/status plus recent transition summaries.

**OraclePLSql:** `PKG_WEBMASTER.GET_STATUS_OVERVIEW(p_filters, p_result_cursor)`.

---

### [WEBMASTER-06] system-wide reports and filtered read-only analytics

**API URL:** `GET /api/webmaster/reports/{reportType}`

**Backend:** Oracle report packages with MongoDB aggregation for feedback/appeals/community/media reports.

**Payload:** Date range, entity, status, location, blood group as applicable, format.

**What need to do:** Reports must never mutate source data. Large reports should stream or be generated asynchronously if necessary; for this project, synchronous report generation is acceptable for moderate data.

**What to return:** JSON or PDF/CSV.

**OraclePLSql:** `PKG_REPORT.GET_WEBMASTER_REPORT(p_report_type, p_filters, p_result_cursor)`.

---

### [WEBMASTER-07] audit/activity viewing for monitoring purposes

**API URL:** `GET /api/webmaster/audit-activity`

**Backend:** Oracle audit/activity records plus optional MongoDB activity metadata for Mongo-backed content.

**Payload:** `dateFrom`, `dateTo`, `actorRole`, `entityType`, `page`, `pageSize`.

**What need to do:** Return monitoring-safe activity records. Do not expose credentials, password material, NIC values or internal secrets.

**What to return:** Event type, actor role/display identity, entity reference, action, timestamp and result.

**OraclePLSql:** `PKG_AUDIT.GET_SYSTEM_ACTIVITY(p_filters, p_result_cursor)`.

---

### [WEBMASTER-08] no create, update, delete, approval, assignment, inventory-management, camp-management, donor-management, or request-fulfilment actions

**API URL:** No write API for webmaster.

**Backend:** Enforce read-only at both C# authorization and Oracle package permissions.

**Payload:** Any attempted write should be rejected.

**What need to do:** Do not merely hide buttons in the frontend. The server must reject write operations for the webmaster role.

**What to return:** `403 Forbidden`.

**OraclePLSql:** N/A — there should be no webmaster write package entry points.

---

### [WEBMASTER-09] donor medical guidelines remain public/system content and are not treated as a webmaster administration feature; the webmaster only monitors their availability/status if such monitoring is needed

**API URL:** `GET /api/webmaster/content-status/medical-guidelines`

**Backend:** MongoDB metadata/status read only.

**Payload:** Optional language/category.

**What need to do:** Report whether expected guideline content is present/published/current. Do not expose content administration actions.

**What to return:** Document counts, current-version metadata and publication status.

**OraclePLSql:** N/A — MongoDB content status.

---

## common for all

### [COMMON-01] donation camp catalogue

**API URL:** `GET /api/public/camps`

**Backend:** Same canonical endpoint as `HOME-13`.

**Payload:** Public catalogue filters/pagination.

**What need to do:** Keep one authoritative public camp catalogue endpoint rather than separate duplicate implementations.

**What to return:** Public camp cards.

**OraclePLSql:** `PKG_CAMP.GET_PUBLIC_CATALOGUE(...)`.

---

### [COMMON-02] role-aware navigation so each authenticated role only sees features relevant to that role

**API URL:** `GET /api/auth/me`

**Backend:** Return authenticated principal, role(s), and safe capability flags. The frontend uses these for navigation, but API authorization remains mandatory on every protected route.

**Payload:** None.

**What need to do:** Build capabilities from server-side role/permissions, never from client-supplied role strings.

**What to return:** User ID, role, associated entity IDs/type, capabilities.

**OraclePLSql:** `PKG_AUTH.GET_CURRENT_PRINCIPAL(p_user_id, p_result_cursor)`.

---

### [COMMON-03] shared authentication screens for login/logout and session handling

**API URL:** `POST /api/auth/login`; `POST /api/auth/logout`; `GET /api/auth/me`

**Backend:** Oracle authentication/account state with secure session/token management in the C# layer.

**Payload:**
```json
{
  "username": "user@example.com",
  "password": "********"
}
```

**What need to do:** Authenticate, load role/entity mapping, issue secure session/token, invalidate session on logout and reject disabled accounts.

**What to return:** Authentication result, safe principal data, expiration metadata.

**OraclePLSql:** `PKG_AUTH.AUTHENTICATE(...)`; `PKG_AUTH.GET_ACCOUNT_STATE(...)`.

---

### [COMMON-04] consistent dashboard layout, page structure, status badges, tables/cards, search, filtering, pagination, and empty states

**Backend:** No standalone database requirement. APIs should use consistent pagination/filter conventions.

**API URL:** Applies to all list endpoints.

**Payload:** Common query parameters:
```text
page=1&pageSize=20&sort=createdAt&order=desc
```

**What need to do:** Standardize paging metadata and status values.

**What to return:** Consistent `data` + `meta` shape.

**OraclePLSql:** Each Oracle list endpoint uses its package-specific cursor procedure.

---

### [COMMON-05] responsive frontend for desktop and tablet/mobile-sized screens

**Backend:** No database interaction.

**API URL:** None.

**Payload:** None.

**What need to do:** Nothing backend-specific.

**What to return:** Nothing.

**OraclePLSql:** N/A — frontend-only.

---

### [COMMON-06] clear confirmation dialogs for irreversible or important actions

**Backend:** Confirmation UI is frontend-only, but write endpoints must be safe to retry and reject invalid repeat actions.

**API URL:** Applies to important write endpoints such as donation submission, transfer receive, request allocation and camp closure.

**Payload:** Underlying action payload.

**What need to do:** Use idempotency/reference checks where duplicate requests could cause duplicate state changes.

**What to return:** Successful final state or a conflict such as `409` when the action has already been performed.

**OraclePLSql:** Each relevant business package should enforce one-time transitions, e.g. `PKG_TRANSFER.RECEIVE_TRANSFER(...)`.

---

### [COMMON-07] consistent loading, success, error, empty, pending, cancelled, completed, and closed states

**Backend:** Standardize status codes and response semantics.

**API URL:** Applies globally.

**Payload:** N/A.

**What need to do:** Return stable business status values and appropriate HTTP status codes. Do not overload `200 OK` with a failed business operation.

**What to return:** Consistent success/error envelope.

**OraclePLSql:** Business-state validation belongs to the package for the entity concerned.

---

### [COMMON-08] notification center for role-relevant updates

**API URL:** `GET /api/notifications`; `PATCH /api/notifications/{notificationId}/read`

**Backend:** Oracle central notification store with role/entity ownership.

**Payload:** Read/unread action as applicable.

**What need to do:** Scope notifications to authenticated user and prevent another role/entity from reading them.

**What to return:** Notification records and unread count.

**OraclePLSql:** `PKG_NOTIFICATION.GET_USER_NOTIFICATIONS(...)`; `PKG_NOTIFICATION.MARK_READ(...)`.

---

### [COMMON-09] searchable public content where appropriate

**Backend:** MongoDB for discussion threads, Q&A, appeals and flexible media; Oracle for structured camps and operational records.

**API URL:** Uses the entity-specific public search endpoints already defined.

**Payload:** Entity-specific `q`/filter parameters.

**What need to do:** Keep search ownership aligned with storage ownership instead of copying all content into Oracle.

**What to return:** Entity-specific paginated search results.

**OraclePLSql:** Structured searches use their Oracle package; Mongo-backed searches use MongoDB.

---

### [COMMON-10] map-based camp and location views where location is relevant

**API URL:** `GET /api/public/camps`; `GET /api/donors/me/camps/nearby`; `GET /api/public/camps/{campId}`

**Backend:** Oracle stores authoritative venue/camp coordinates and returns geospatial fields.

**Payload:** Coordinates/radius for nearby search.

**What need to do:** Validate coordinate ranges and filter by public camp state.

**What to return:** Latitude, longitude, address, distance where calculated.

**OraclePLSql:** `PKG_CAMP.FIND_NEARBY_CAMPS(...)`; `PKG_CAMP.GET_PUBLIC_DETAILS(...)`.

---

### [COMMON-11] accessible forms with validation, clear labels, and user-friendly error messages

**Backend:** C# validates request shape and required fields; PL/SQL validates business rules. Return field-level errors where possible.

**API URL:** Applies to all write endpoints.

**Payload:** Entity-specific request body.

**What need to do:** Never rely exclusively on frontend validation. Normalize validation errors into a stable format.

**What to return:** HTTP `400` for invalid input with safe field error details; `409` for uniqueness/state conflicts; `403` for authorization failure.

**OraclePLSql:** Relevant package procedure/function for business validation.

---

### [COMMON-12] every workflow should expose its current status and next meaningful action instead of making users infer what happened

**Backend:** Every workflow endpoint must return current server state and optionally `nextAction`.

**API URL:** Applies to registrations, donations, transfers, hospital requests, appeals and camp lifecycle endpoints.

**Payload:** Underlying request.

**What need to do:** Keep next-action rules in the backend so the UI does not invent possible actions from stale local state.

**What to return:** `status`, timestamps and safe `nextAction`.

**OraclePLSql:** Entity-specific status function/package operation.

---

### [COMMON-13] public pages must never expose private donor information, internal staff information, or sensitive operational details

**Backend:** Enforce response DTO/projection boundaries. Do not serialize entire database entities.

**API URL:** Applies to all public endpoints.

**Payload:** None.

**What need to do:** Public queries should explicitly select safe fields. NIC, private contact details, internal staff records, internal allocation details and audit details must be excluded.

**What to return:** Public-safe DTOs only.

**OraclePLSql:** Public read procedures such as `PKG_CAMP.GET_PUBLIC_CATALOGUE(...)` must themselves expose only safe fields.

---

### [COMMON-14] donor identity information such as NIC must be collected and displayed only where required by the donor workflow; it should not appear in public pages, camp catalogues, discussions, ratings, or appeals

**Backend:** Store NIC in Oracle donor identity data; never put NIC into MongoDB public documents.

**API URL:** Protected profile endpoint for collection; no public endpoint returns NIC.

**Payload:** Registration/profile payload may contain NIC.

**What need to do:** Mask/minimize identity fields in operational responses and enforce projection boundaries.

**What to return:** NIC only in explicitly authorized identity/profile context, preferably masked on ordinary screens.

**OraclePLSql:** `PKG_DONOR.GET_SECURE_IDENTITY(p_donor_id, ...)` where required; public procedures must omit it.

---

### [COMMON-15] role boundaries must remain strict in the UI: donors do not manage banks, banks do not manage camps, committees do not manage bank inventory, and the webmaster remains read-only

**Backend:** Enforce the same boundaries server-side.

**API URL:** Applies globally.

**Payload:** Entity-specific.

**What need to do:** C# authorization + Oracle ownership checks must reject cross-role mutation. UI visibility is not security.

**What to return:** `403 Forbidden` for unauthorized operations.

**OraclePLSql:** Each mutating package validates caller role/entity ownership.

---

### [COMMON-16] emergency blood appeals and hospital blood requests are treated as two different frontend concepts:

**Backend:** Enforce two separate models and endpoints.

**API URL:** `/api/.../emergency-appeals` vs `/api/.../hospital-requests`

**Payload:** Separate schemas.

**What need to do:** Never use the emergency appeal collection as a substitute for institutional blood request inventory allocation.

**What to return:** Separate entity types/status models.

**OraclePLSql:** Hospital requests use `PKG_HOSPITAL_REQUEST`; emergency appeals are MongoDB-backed.

---

### [COMMON-17] **Emergency blood appeal:** a patient/person-facing urgent request visible through public/donor-facing areas

**API URL:** `/api/public/emergency-appeals`; `/api/donors/me/emergency-appeals`

**Backend:** MongoDB document model with safe public status and optional Oracle donor/account reference.

**Payload:** As defined for `DONOR-18`.

**What need to do:** Manage publication/fulfilment lifecycle and prevent private identity exposure.

**What to return:** Public appeal representation.

**OraclePLSql:** Only account/ownership verification where required; appeal content is MongoDB.

---

### [COMMON-18] **Hospital blood request:** an institutional request handled inside the blood-bank workflow

**API URL:** `/api/banks/me/hospital-requests`

**Backend:** Oracle authoritative transaction.

**Payload:** As defined for `BANK-05`.

**What need to do:** Connect request allocation to inventory through PL/SQL transactions.

**What to return:** Request status and allocation/fulfilment information.

**OraclePLSql:** `PKG_HOSPITAL_REQUEST.CREATE_REQUEST(...)`, `PKG_HOSPITAL_REQUEST.ALLOCATE_UNITS(...)`, `PKG_HOSPITAL_REQUEST.FULFILL_REQUEST(...)`.

---

### [COMMON-19] donation flow across roles:

**Backend:** The following sub-requirements define an end-to-end transaction chain.

**API URL:** Multiple endpoints below.

**Payload:** Entity-specific.

**What need to do:** Preserve referential integrity across donor, camp, donation record, transfer, blood bank and inventory.

**What to return:** Each stage returns its current status and reference.

**OraclePLSql:** Orchestration occurs through `PKG_DONATION`, `PKG_TRANSFER` and `PKG_BLOOD_BANK`.

---

### [COMMON-20] donor finds/registers for a camp

**API URL:** `GET /api/donors/me/camps/nearby`; `POST /api/donors/me/camp-registrations`

**Backend:** Oracle.

**Payload:** Coordinates/filter and camp registration payload.

**What need to do:** Registration must re-check eligibility and capacity transactionally.

**What to return:** Camp selection/registration status.

**OraclePLSql:** `PKG_CAMP.FIND_NEARBY_CAMPS(...)`; `PKG_CAMP.REGISTER_DONOR_FOR_CAMP(...)`.

---

### [COMMON-21] organizing committee records the completed donation

**API URL:** `POST /api/committees/me/camps/{campId}/donations`; `POST /api/committees/me/donation-records/{donationId}/submit`

**Backend:** Oracle.

**Payload:** Donation record data.

**What need to do:** Final submission is atomic and updates the donor's eligibility derivation.

**What to return:** Finalized donation record.

**OraclePLSql:** `PKG_DONATION.SUBMIT_DONATION_RECORD(...)`.

---

### [COMMON-22] committee assigns the resulting donation batch/units to a blood bank for transfer

**API URL:** `POST /api/committees/me/camps/{campId}/donation-transfers`

**Backend:** Oracle transfer creation.

**Payload:** Bank ID + finalized donation IDs/batch reference.

**What need to do:** Prevent assigning already-transferred records and create an auditable transfer.

**What to return:** Transfer ID and status.

**OraclePLSql:** `PKG_TRANSFER.CREATE_TRANSFER(...)`.

---

### [COMMON-23] blood bank receives the transfer and adds the units to inventory

**API URL:** `POST /api/banks/me/donation-transfers/{transferId}/receive`

**Backend:** Oracle atomic receipt + inventory registration.

**Payload:** Receive confirmation.

**What need to do:** Prevent double receipt and ensure only the selected receiving bank can perform it.

**What to return:** Received transfer + inventory result.

**OraclePLSql:** `PKG_TRANSFER.RECEIVE_TRANSFER(...)`.

---

### [COMMON-24] blood bank can then allocate/issue inventory against hospital requests according to the system workflow

**API URL:** `POST /api/banks/me/hospital-requests/{requestId}/allocate`; `POST /api/banks/me/hospital-requests/{requestId}/fulfill`

**Backend:** Oracle transaction that locks/validates eligible inventory units and updates request/unit statuses atomically.

**Payload:**
```json
{
  "unitIds": [1001, 1002]
}
```

**What need to do:** Reject expired/unavailable/already issued units. Allocation must not oversubscribe units when concurrent requests occur.

**What to return:** Request status, allocated/fulfilled unit count and unit references safe for bank users.

**OraclePLSql:** `PKG_HOSPITAL_REQUEST.ALLOCATE_UNITS(...)`; `PKG_HOSPITAL_REQUEST.FULFILL_REQUEST(...)`.

---

### [COMMON-25] feedback flow across roles:

**Backend:** Cross-database workflow linking Oracle donation eligibility with MongoDB review content.

**API URL:** Feedback endpoints already defined.

**Payload:** Rating/comment.

**What need to do:** Oracle proves eligibility; MongoDB stores content; public, committee and webmaster reads use safe projections.

**What to return:** Feedback status and aggregate views.

**OraclePLSql:** `PKG_DONATION.CAN_SUBMIT_FEEDBACK(...)` plus MongoDB operations.

---

### [COMMON-26] donor completes a donation

**API URL:** Committee donation completion endpoints.

**Backend:** Oracle finalization.

**Payload:** Donation record.

**What need to do:** Ensure completed status is authoritative before enabling feedback.

**What to return:** Completed record and eligibility update.

**OraclePLSql:** `PKG_DONATION.SUBMIT_DONATION_RECORD(...)`.

---

### [COMMON-27] completed donation enables camp feedback/rating

**API URL:** `POST /api/donors/me/camps/{campId}/feedback`

**Backend:** Before MongoDB insert, call Oracle eligibility function.

**Payload:** Rating/comment.

**What need to do:** Reject feedback if no completed donation or if a prior review exists for the same donation/camp according to the product rule.

**What to return:** Feedback record/status.

**OraclePLSql:** `PKG_DONATION.CAN_SUBMIT_FEEDBACK(...)`.

---

### [COMMON-28] feedback is visible publicly in aggregated/form-appropriate form

**API URL:** `GET /api/public/camps/{campId}/feedback`

**Backend:** MongoDB public projection and aggregation.

**Payload:** Pagination/sort.

**What need to do:** Strip private identity and moderation details.

**What to return:** Aggregate rating + safe reviews.

**OraclePLSql:** Optional camp visibility check via `PKG_CAMP.GET_PUBLIC_SUMMARY(...)`; review content is MongoDB.

---

### [COMMON-29] committee can review feedback for its camps

**API URL:** `GET /api/committees/me/camps/{campId}/feedback`

**Backend:** Oracle authorization + MongoDB review query.

**Payload:** Pagination/sort.

**What need to do:** Reject access to camps outside the committee.

**What to return:** Aggregate + paginated reviews.

**OraclePLSql:** `PKG_CAMP.AUTHORIZE_COMMITTEE_CAMP(...)`.

---

### [COMMON-30] webmaster can monitor feedback system-wide

**API URL:** `GET /api/webmaster/feedback/overview`

**Backend:** MongoDB aggregate rating/review metrics, with no write capability.

**Payload:** Date/camp/rating filters.

**What need to do:** Produce system-wide read-only feedback statistics.

**What to return:** Total reviews, average rating, rating distribution, top-rated camps and recent-review counts.

**OraclePLSql:** Camp/report metadata may be checked with `PKG_WEBMASTER.GET_SYSTEM_OVERVIEW(...)`; feedback aggregation is MongoDB.

---

### [COMMON-31] frontend should prioritize a minimal number of primary actions per screen; advanced search, filters, reports, and secondary actions should be progressively revealed rather than shown everywhere

**Backend:** No direct database interaction.

**API URL:** None.

**Payload:** None.

**What need to do:** Keep APIs composable so the frontend can reveal advanced filters without requiring a different backend architecture.

**What to return:** Nothing beyond normal entity/list responses.

**OraclePLSql:** N/A — frontend UX rule.

---

### [COMMON-32] terminology must remain consistent throughout the frontend: use **Donor**, **Blood Bank**, **Organizing Committee**, **Donation Camp**, **Donation Record**, **Blood Unit**, **Hospital Request**, and **Emergency Blood Appeal**

**Backend:** Use the same canonical entity names in API routes, DTOs, status enums and documentation.

**API URL:** Applies globally.

**Payload:** Entity-specific.

**What need to do:** Do not create synonyms such as `campaign`, `bloodNeed`, `appealRequest`, or `unitStock` for the same conceptual entities.

**What to return:** Canonical entity names in JSON/API contracts.

**OraclePLSql:** Package names follow the same terminology.

---

### [COMMON-33] frontend is a role-based workflow interface, not a collection of unrelated CRUD pages; every screen should correspond to a real user task or a meaningful monitoring view

**Backend:** APIs should be task-oriented for business workflows, not expose unrestricted table CRUD.

**API URL:** All endpoints.

**Payload:** Workflow-specific.

**What need to do:** Prefer operations such as `submit donation`, `receive transfer`, `allocate units`, and `change camp status` over generic `PUT /table/{id}` designs. This makes PL/SQL business rules explicit and easier to demonstrate.

**What to return:** Business result + status + next action.

**OraclePLSql:** Focused package procedures such as `PKG_DONATION.SUBMIT_DONATION_RECORD`, `PKG_TRANSFER.RECEIVE_TRANSFER`, and `PKG_HOSPITAL_REQUEST.ALLOCATE_UNITS`.

---

# End-to-end backend workflow

## 1. Donor registration and login

1. `POST /api/auth/donors/register`
2. `PKG_AUTH.REGISTER_DONOR(...)`
3. Oracle creates account/profile and identity data.
4. `POST /api/auth/login`
5. `PKG_AUTH.AUTHENTICATE(...)`
6. C# creates the authenticated session/token context.

## 2. Camp discovery and registration

1. Public catalogue or donor nearby endpoint reads Oracle camps.
2. Donor checks eligibility through `PKG_DONOR.CHECK_ELIGIBILITY(...)`.
3. Donor registers using `PKG_CAMP.REGISTER_DONOR_FOR_CAMP(...)`.
4. Oracle prevents duplicate registration, invalid camp state, over-capacity registration and ineligible registration.

## 3. Donation completion

1. Committee opens the camp attendance list.
2. Committee records a donation.
3. Record remains `DRAFT`/`PENDING_REVIEW`.
4. Committee submits the record.
5. `PKG_DONATION.SUBMIT_DONATION_RECORD(...)` validates and finalizes it.
6. Donor history becomes visible.
7. Eligibility is recalculated/derived.
8. Notification is created after commit.

## 4. Donation transfer to a blood bank

1. Committee selects completed donation records.
2. `PKG_TRANSFER.CREATE_TRANSFER(...)` creates a transfer batch.
3. Committee marks dispatch.
4. Bank sees the incoming transfer.
5. Bank receives it using `PKG_TRANSFER.RECEIVE_TRANSFER(...)`.
6. The procedure atomically marks the transfer received and registers corresponding inventory units.

## 5. Hospital request fulfilment

1. Bank receives/creates a hospital request.
2. `PKG_HOSPITAL_REQUEST.CREATE_REQUEST(...)`.
3. Bank allocates appropriate available units.
4. `PKG_HOSPITAL_REQUEST.ALLOCATE_UNITS(...)`.
5. Reserved units become allocated/reserved.
6. When actually issued, the fulfilment procedure updates unit and request states atomically.
7. Expired or already issued units are rejected.

## 6. Emergency blood appeal

1. Donor submits an appeal.
2. Oracle verifies donor account/ownership as required.
3. MongoDB stores the schema-flexible appeal.
4. Public/donor endpoints query active MongoDB appeals.
5. Fulfilment/closure updates the MongoDB status and may also update any related Oracle reference.

## 7. Community and Q&A

1. MongoDB stores threads, replies, questions and answers.
2. C# enforces authentication for posting and safe public projections for reading.
3. Search uses MongoDB indexes.
4. No private Oracle donor identity fields are embedded in public documents.

## 8. Camp feedback

1. Donor has a completed Oracle donation record.
2. `PKG_DONATION.CAN_SUBMIT_FEEDBACK(...)` confirms eligibility.
3. MongoDB stores the rating/review with camp/donation/donor references.
4. Public queries aggregate ratings.
5. Committee queries are authorized against Oracle before reading MongoDB feedback.
6. Webmaster can read system-wide aggregate feedback but cannot modify it.

---

# Recommended Oracle transactional boundaries

The following operations should preferably be **single PL/SQL procedures** rather than a sequence of independent API-level SQL calls:

| Operation | Main PL/SQL operation | Why |
|---|---|---|
| Donor registration | `PKG_AUTH.REGISTER_DONOR` | Account/profile creation consistency |
| Camp registration | `PKG_CAMP.REGISTER_DONOR_FOR_CAMP` | Eligibility + capacity + duplicate prevention |
| Donation finalization | `PKG_DONATION.SUBMIT_DONATION_RECORD` | Final record + eligibility + audit/notification side effects |
| Transfer creation | `PKG_TRANSFER.CREATE_TRANSFER` | Prevent duplicate transfer and ensure all donation records belong to camp |
| Transfer receipt | `PKG_TRANSFER.RECEIVE_TRANSFER` | Transfer state + inventory insertion |
| Unit allocation | `PKG_HOSPITAL_REQUEST.ALLOCATE_UNITS` | Prevent double allocation under concurrency |
| Request fulfilment | `PKG_HOSPITAL_REQUEST.FULFILL_REQUEST` | Unit status + request status consistency |
| Camp lifecycle change | `PKG_CAMP.CHANGE_CAMP_STATUS` | State-machine enforcement |
| Feedback eligibility | `PKG_DONATION.CAN_SUBMIT_FEEDBACK` | Oracle remains source of truth |

---

# Recommended Oracle functions

Use functions when a single deterministic answer is needed:

| Function | Purpose |
|---|---|
| `PKG_DONOR.CHECK_ELIGIBILITY` | Determine donor eligibility and next eligible date |
| `PKG_CAMP.IS_PUBLICLY_VISIBLE` | Decide whether a camp may appear publicly |
| `PKG_CAMP.IS_AVAILABLE_FOR_REGISTRATION` | Determine whether a camp can accept registration |
| `PKG_VENUE.CHECK_AVAILABILITY` | Detect venue scheduling conflicts |
| `PKG_BLOOD_BANK.GET_AVAILABLE_UNIT_COUNT` | Calculate usable inventory |
| `PKG_DONATION.CAN_SUBMIT_FEEDBACK` | Verify completed donation eligibility for review |
| `PKG_AUTH.IS_ACCOUNT_ACTIVE` | Validate account state |

---

# Recommended Oracle cursors

Use `SYS_REFCURSOR`/equivalent cursor-return patterns for:
- camp catalogue and camp searches
- donor donation history
- bank inventory searches
- hospital-request lists
- transfer lists
- staff lists
- reports
- webmaster monitoring tables

The C# layer should map cursor rows into DTOs; pagination should be supported by the PL/SQL query rather than loading the entire dataset when the dataset can grow.

---

# Recommended Oracle triggers

Triggers should be limited to invariants/auditing that must be enforced even outside the API:

1. **Audit trigger** on security-sensitive relational tables such as donation records, blood-unit status, hospital requests and role/account state changes.
2. **Expiry/status safeguard trigger** only where necessary to prevent a blood unit from remaining `AVAILABLE` after its expiry date. Prefer explicit package operations for normal status changes.
3. **Do not use triggers** for multi-step workflow orchestration such as receiving a transfer or fulfilling a request; those are clearer and safer as PL/SQL procedures.

---

# MongoDB collections / logical document groups

Recommended flexible collections:

- `campaignMedia`
  - awareness materials
  - promotional media
  - camp-linked media metadata

- `medicalGuidelines`
  - guideline versions
  - document/media metadata
  - publication status

- `emergencyAppeals`
  - patient/person-facing emergency appeals
  - blood group, urgency, location, status, timestamps

- `emergencyBroadcasts`
  - urgent public communication messages
  - related Oracle request/bank references where applicable

- `communityThreads`
  - discussion threads and replies

- `communityQa`
  - questions, answers, categories and tags

- `donorFeedback`
  - rating/review/comment
  - `donorId` reference
  - `campId` reference
  - `donationId` reference
  - publication/moderation status

MongoDB documents should remain flexible, but references to Oracle entities must use stable identifiers and must not duplicate authoritative transactional state unnecessarily.

---

# Cross-database consistency rules

1. **Oracle owns truth for relational workflow state.** MongoDB must not independently decide whether a donor actually donated, whether a camp belongs to a committee, whether a hospital request has inventory allocated, or whether a blood unit exists in official inventory.
2. **MongoDB owns flexible content.** Oracle should not be used as a forced schema for media, discussion text, Q&A content or long-form feedback.
3. **C# is the integration boundary.** Cross-database requests should be orchestrated in the application layer, but transactional Oracle work must still be atomic inside PL/SQL.
4. **Do not attempt distributed ACID transactions between Oracle and MongoDB for ordinary content operations.** Where a Mongo document refers to an Oracle entity, write the Oracle reference after Oracle validation succeeds.
5. **Status duplication must be minimized.** When duplication is unavoidable for public communication, Oracle remains authoritative for the underlying relational workflow and MongoDB stores the public content/status needed by the flexible content feature.
6. **No public endpoint may leak Oracle private fields through MongoDB references.**

---

# Backend API surface summary

## Public
- `GET /api/public/camps`
- `GET /api/public/camps/{campId}`
- `GET /api/public/camps/top-rated`
- `GET /api/public/camps/{campId}/feedback`
- `GET /api/public/emergency-appeals`
- `GET /api/public/emergency-appeals/search`
- `GET /api/public/emergency-broadcasts`
- `GET /api/public/medical-guidelines`
- `GET /api/public/promotional-media`
- `GET /api/public/camps/awareness-materials`
- `GET /api/public/community/threads`
- `GET /api/public/community/threads/search`
- `GET /api/public/community/qa`

## Authentication
- `POST /api/auth/donors/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

## Donor
- `GET /api/donors/me/dashboard`
- `GET /api/donors/me/profile`
- `PUT /api/donors/me/profile`
- `GET /api/donors/me/eligibility`
- `GET /api/donors/me/camps/nearby`
- `POST /api/donors/me/camp-registrations`
- `GET /api/donors/me/camp-registrations/upcoming`
- `GET /api/donors/me/donations`
- `GET /api/donors/me/donations/report`
- `POST /api/donors/me/camps/{campId}/feedback`
- `GET /api/donors/me/feedback`
- `GET /api/donors/me/emergency-appeals`
- `GET /api/donors/me/emergency-appeals/search`
- `POST /api/donors/me/emergency-appeals`
- `GET /api/community/threads`
- `POST /api/community/threads/{threadId}/replies`
- `POST /api/community/qa`
- `GET /api/community/qa`
- `GET /api/community/qa/search`
- `GET /api/donors/me/notifications`
- `PATCH /api/donors/me/notifications/{notificationId}/read`
- `GET /api/donors/me/status-history`

## Blood Bank
- `GET /api/banks/me/dashboard`
- `GET /api/banks/me/inventory`
- `POST /api/banks/me/inventory/units`
- `PATCH /api/banks/me/inventory/units/{unitId}`
- `GET /api/banks/me/inventory/search`
- `GET /api/banks/me/inventory/expiring`
- `GET /api/banks/me/inventory/expired`
- `PATCH /api/banks/me/inventory/{unitId}/status`
- `GET /api/banks/me/inventory/{unitId}/source`
- `GET /api/banks/me/hospital-requests`
- `POST /api/banks/me/hospital-requests`
- `GET /api/banks/me/hospital-requests/{requestId}`
- `PATCH /api/banks/me/hospital-requests/{requestId}/status`
- `POST /api/banks/me/hospital-requests/{requestId}/allocate`
- `POST /api/banks/me/hospital-requests/{requestId}/fulfill`
- `GET /api/banks/me/donation-transfers/incoming`
- `POST /api/banks/me/donation-transfers/{transferId}/receive`
- `GET /api/banks/me/donation-transfers/history`
- `GET /api/banks/me/staff`
- `POST /api/banks/me/staff`
- `PATCH /api/banks/me/staff/{staffId}`
- `GET /api/banks/me/notifications`
- `PATCH /api/banks/me/notifications/{notificationId}/read`
- `GET /api/banks/me/reports/{reportType}`

## Organizing Committee
- `GET /api/committees/me/dashboard`
- `GET /api/committees/me/camps`
- `POST /api/committees/me/camps`
- `PATCH /api/committees/me/camps/{campId}`
- `PATCH /api/committees/me/camps/{campId}/status`
- `GET /api/committees/me/venues`
- `POST /api/committees/me/venues`
- `PATCH /api/committees/me/venues/{venueId}`
- `GET /api/committees/me/venues/{venueId}/availability`
- `GET /api/committees/me/camps/{campId}/registrations`
- `POST /api/committees/me/camps/{campId}/donations`
- `PATCH /api/committees/me/donation-records/{donationId}`
- `POST /api/committees/me/donation-records/{donationId}/submit`
- `POST /api/committees/me/camps/{campId}/donation-transfers`
- `GET /api/committees/me/donation-transfers`
- `PATCH /api/committees/me/donation-transfers/{transferId}/status`
- `GET /api/committees/me/donation-transfers/{transferId}`
- `GET /api/committees/me/camps/{campId}/awareness-materials`
- `POST /api/committees/me/camps/{campId}/awareness-materials`
- `PATCH /api/committees/me/camps/{campId}/awareness-materials/{mediaId}`
- `GET /api/committees/me/camps/{campId}/staff`
- `POST /api/committees/me/camps/{campId}/staff`
- `DELETE /api/committees/me/camps/{campId}/staff/{staffId}`
- `GET /api/committees/me/staff`
- `GET /api/committees/me/camps/{campId}/overview`
- `GET /api/committees/me/camps/{campId}/feedback`
- `GET /api/committees/me/notifications`
- `PATCH /api/committees/me/notifications/{notificationId}/read`
- `GET /api/committees/me/reports/{reportType}`

## Webmaster
- `GET /api/webmaster/dashboard`
- `GET /api/webmaster/overview`
- `GET /api/webmaster/statistics`
- `GET /api/webmaster/dashboards/{dashboardType}`
- `GET /api/webmaster/status-overview`
- `GET /api/webmaster/reports/{reportType}`
- `GET /api/webmaster/audit-activity`
- `GET /api/webmaster/content-status/medical-guidelines`
- `GET /api/webmaster/feedback/overview`

---

# Final architectural rule

The backend should not be designed as **"one API per database table."** It should be designed around the exact frontend workflows defined by the requirement IDs.

For Oracle-backed workflows, the preferred path is:

**Frontend → C# API → PL/SQL procedure/function → Oracle data → C# DTO → Frontend**

For MongoDB-backed flexible content:

**Frontend → C# API → authorization/Oracle validation when necessary → MongoDB → C# DTO → Frontend**

For cross-database features:

**Frontend → C# API → Oracle authoritative check/workflow → MongoDB content/read → C# combined response**

This keeps the relational business logic visible in Oracle PL/SQL, keeps MongoDB focused on genuinely flexible content, preserves strict role boundaries, and makes every frontend requirement traceable to a concrete backend operation.
