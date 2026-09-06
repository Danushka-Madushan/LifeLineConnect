# LifeLineConnect - Application Overview

## Purpose of the Application
LifeLineConnect is a comprehensive blood donation management system designed to bridge the gap between donors, organizing committees, blood banks, and hospitals. It streamlines the entire blood donation lifecycle—from donor registration and camp organization to inventory management and fulfillment of hospital requests. The platform ensures a steady and trackable supply of blood units while fostering a strong community through engagement and awareness initiatives.

## Features by Role

### 1. Public
- **View Donation Camps:** Can search and view upcoming active donation camps, including filtering by location and viewing top-rated camps based on reviews.
- **Access Information:** Can read medical guidelines, awareness materials, and promotional media.
- **Emergency Alerts:** Can view active emergency broadcasts and appeals for urgent blood needs.
- **Community Engagement:** Can read community threads and Q&A to learn more about blood donation.
- **System Stats & Directories:** Can view overall system statistics and active blood banks.

### 2. Donor
- **Eligibility & Dashboard:** Can check their eligibility to donate based on medical history and view their personal donation dashboard.
- **Profile Management:** Can view and update personal profile information.
- **Camp Registration:** Can register for upcoming donation camps and view registration history.
- **Donation Tracking:** Can track past donation history and results.
- **Medical Check:** Can submit pre-donation medical check forms.
- **Community & Feedback:** Can participate in community threads, answer/ask questions, and submit post-donation feedback for attended camps.

### 3. Organizing Committee
- **Dashboard:** Views metrics related to the camps they organize.
- **Camp Management:** Can create new donation camps, assign venues, and manage schedules.
- **Attendance & Donations:** Tracks donor attendance and records successful donations during a camp.
- **Inventory Transfer:** Dispatches collected blood units to assigned blood banks securely.
- **Awareness & Feedback:** Uploads campaign awareness materials and reviews feedback submitted by donors for their camps.

### 4. Blood Bank Staff
- **Inventory Management:** Monitors the blood unit inventory, tracks expiry dates, and updates unit statuses.
- **Transfer Handling:** Receives and confirms blood unit transfers dispatched by organizing committees.
- **Hospital Requests:** Views blood requests from hospitals, allocates available units to fulfill them, and updates request statuses.
- **Staff Management:** Can add, view, and remove blood bank staff members.
- **Reporting:** Can generate and download PDF reports for current inventory, expiring blood units, and hospital requests.

### 5. Webmaster
- **System Administration:** Views platform-wide metrics and manages top-level user registrations (approving/registering blood banks and committees).
- **Audit & Backups:** Views PL/SQL generated system audit logs and triggers Oracle schema backups.
- **Content & Emergency Management:** Manages medical guidelines and emergency appeals.
- **Community Moderation:** Has the authority to moderate and delete inappropriate community threads, replies, and Q&A.

## Database Architecture: MongoDB vs OracleDB
LifeLineConnect utilizes a polyglot persistence strategy, leveraging the strengths of both Oracle 21c and MongoDB to handle different types of workloads optimally.

### Oracle 21c
Oracle is used as the primary relational database for critical, structured data that requires ACID compliance, complex relationships, and strict data integrity.
- **User Roles & Authentication:** Manages user accounts, passwords, roles (Donor, Webmaster, Blood Bank, Committee), and session states.
- **Core Entities & Relationships:** Stores robust relational data such as Blood Banks, Committees, Donors, Camps, and Venues.
- **Inventory & Transactions:** Handles highly transactional operations where strict concurrency is essential. This includes recording donations, tracking individual blood units, dispatching transfers, and allocating units to hospital requests.
- **Business Logic & Rules:** Implements crucial business rules at the database level via PL/SQL (e.g., `CHECK_DONOR_ELIGIBILITY`, `ALLOCATE_UNITS_TO_REQUEST`, `FN_CAN_SUBMIT_FEEDBACK`).
- **Security & Auditing:** Manages database-level audit logs (`FN_GET_SYSTEM_AUDIT_LOGS`) and schema backups to ensure compliance and traceability.

### MongoDB
MongoDB is utilized for unstructured or semi-structured data, high-read volumes, and flexible document storage where rapid iteration and schema flexibility are beneficial.
- **Flexible Document Storage:** Stores content that doesn't fit neatly into tables, such as rich text or media metadata.
- **Content Management:** Manages unstructured content like awareness campaigns (`campaignMedia`), promotional materials (`promotionalMedia`), and medical guidelines (`medicalGuidelines`).
- **Community & Chat Messages:** Handles dynamic community interactions including `communityThreads`, `communityReplies`, and `communityQa`, which require fast read/write operations and hierarchical data.
- **Feedback & Reviews:** Stores donor feedback for camps (`campFeedback`), allowing varied structures of reviews and ratings without strict relational constraints.
- **Alerts & Notifications:** Manages transient or rapidly changing data like `emergencyBroadcasts` and `emergencyAppeals`.
