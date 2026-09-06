<div align="center">
  <br />
  <a href="https://github.com/Danushka-Madushan/LifeLineConnect">
    <img src="./web-ui/public/favicon.svg" alt="LifeLineConnect" width="100" />
  </a>

  <h1>LifeLineConnect</h1>
  <p><strong>Blood Donation &amp; Supply Chain Management Platform</strong></p>
  <p>
    Connecting donors, blood banks, hospitals, and organizing committees<br />
    through a unified, real‑time healthcare logistics system.
  </p>

  <br />

  <p>
    <img src="https://img.shields.io/badge/.NET_10-512BD4?style=flat-square&logo=dotnet&logoColor=white" />
    <img src="https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black" />
    <img src="https://img.shields.io/badge/Oracle_21c-F80000?style=flat-square&logo=oracle&logoColor=white" />
    <img src="https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white" />
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" />
    <img src="https://img.shields.io/badge/Tailwind_v4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" />
  </p>

  <br />
</div>

---

## Overview

LifeLineConnect is a full‑stack platform that manages the complete blood donation lifecycle — from donor registration and camp scheduling through collection, transportation, and hospital allocation.

The system integrates four stakeholder groups under a single application:

- **System administrators** – oversight of the entire platform, audit logs, and backups.
- **Blood bank operators** – real‑time inventory, receipt of transfers, and fulfillment of hospital requests.
- **Organizing committees** – venue management, camp planning, and coordination of donations.
- **Donors** – personal dashboard, donation history, and community engagement.

All database interactions are performed via PL/SQL stored procedures; there is no inline SQL in the application code.

**Project metrics (as of current build):**

| Metric | Count |
|:---|:---|
| Oracle tables | 23 |
| PL/SQL procedures & functions | 57 |
| REST API endpoints | 90 |
| Frontend views | 31 |
| Audit triggers | 3 |

## Key Features

- Secure RBAC architecture with JWT‑based authentication.
- Live inventory tracking with automatic expiry handling (42‑day shelf life).
- Global hospital request board – any hospital may request, any bank with stock may fulfill.
- End‑to‑end chain of custody for donation transfers.
- Server‑side medical eligibility checks using PL/SQL.
- High‑quality PDF reporting powered by QuestPDF.
- Comprehensive audit trail via Oracle triggers.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Tier                            │
│         React 19 · TypeScript · Tailwind CSS v4             │
│                    Vite 8 · Axios                           │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP / JWT
┌──────────────────────────▼──────────────────────────────────┐
│                       API Tier                              │
│          ASP.NET Core (.NET 10) · RESTful JSON              │
│      BCrypt · QuestPDF · JWT Bearer Authentication          │
└────────────┬───────────────────────────────┬────────────────┘
             │ ODP.NET (Stored Procedures)   │ MongoDB Driver
┌────────────▼──────────────┐  ┌─────────────▼────────────────┐
│       Oracle 21c XE       │  │          MongoDB             │
│  Tables · Procedures      │  │  Community threads           │
│  Functions · Triggers     │  │  Feedback · Leaderboards     │
│  REF Cursors · Auditing   │  │  Appeals · Analytics         │
└───────────────────────────┘  └──────────────────────────────┘
```

## What Each Role Can Do

**Donor Portal**
- Dashboard with donation history and eligibility status.
- Medical questionnaire evaluated server‑side via PL/SQL.
- Discover upcoming camps, register for slots, and receive notifications.
- Participate in a community Q&A forum (MongoDB‑backed).

**Blood Bank Operations**
- Real‑time inventory with expiry monitoring.
- Receive donation transfers and unpack them into tracked units.
- Global hospital request board – any hospital can request, any bank can allocate.
- Allocate units against pending requests with prioritisation.
- Manage medical staff assignments.
- Export PDF reports for inventory and request status.

**Organizing Committee**
- Register and manage venues.
- Plan donation camps with target blood‑group goals.
- Record donor registrations and on‑site donations.
- Dispatch blood transfers to banks with item‑level tracking.
- Assign and schedule staff across camps.
- Export camp performance and transfer reports as PDFs.

**System Administration**
- Full audit trail using Oracle triggers.
- One‑click Oracle schema backup and MongoDB collection export.
- System‑wide analytics covering users, banks, committees, and community activity.
- Generate PDF reports for any data domain.

## Project Structure

```
LifeLineConnect/
├── db/
│   └── scripts/                 # 17 PL/SQL files (procedures, functions, triggers)
├── docs/                        # Architecture docs, Postman collection, design assets
├── web-server/                  # .NET 10 Web API
│   ├── Controllers/             # 7 controllers (Auth, Donor, BloodBank, Committee, ...)
│   ├── Data/                    # Oracle & MongoDB connection providers
│   ├── Filters/                 # Global exception handling (OracleExceptionFilter)
│   ├── Middlewares/             # Request pipeline middleware
│   └── Models/                  # DTOs grouped by domain
└── web-ui/                      # React 19 SPA
    └── src/
        ├── components/          # Shared layouts, navigation, route guards
        ├── contexts/            # Auth context provider
        ├── hooks/               # Custom React hooks
        ├── lib/                 # Axios instance with JWT interceptor
        └── pages/               # 31 views across 5 role‑based modules
```

## Getting Started

### Prerequisites

| Dependency | Version |
|:---|:---|
| Oracle Database XE | 21c |
| MongoDB | 7+ |
| .NET SDK | 10.0 |
| Node.js | 22+ |

### Database Setup (Oracle)

```bash
# Connect as SYSDBA and create the pluggable database
sqlplus sys/password@localhost/LifeLineConnect_PDB as sysdba
@db/scripts/pdb_permissions.sql

# Connect as LLC_ADMIN and run all scripts in order (01 through 11)
sqlplus LLC_ADMIN/admin@localhost/LifeLineConnect_PDB
@db/scripts/01_auth_procedures.sql
@db/scripts/02_donor_procedures.sql
# ... continue through 11_audit_triggers.sql
```

### Backend Setup (.NET)

```bash
cd web-server
dotnet restore
dotnet run                    # → http://localhost:5068
```

### Frontend Setup (React)

```bash
cd web-ui
npm install
npm run dev                   # → http://localhost:5173
```

## API Overview

| Controller | Prefix | Purpose | Auth |
|:---|:---|:---|:---|
| `AuthController` | `/api/auth` | Login, Register, Profile | Public / JWT |
| `DonorController` | `/api/donors` | Dashboard, Donations, Medical, Feedback | Donor |
| `BloodBankController` | `/api/blood-bank` | Inventory, Transfers, Hospital Requests, Staff | Blood Bank |
| `CommitteeController` | `/api/committee` | Venues, Camps, Registrations, Transfers, Staff | Committee |
| `WebmasterController` | `/api/webmaster` | Audit, Backups, Reports, Management | Webmaster |
| `PublicController` | `/api/public` | Home Stats, Camps, Appeals, Community | Public |
| `NotificationController` | `/api/notifications` | User Notification Feed | JWT |

A full Postman collection is available at [`docs/LifeLineConnect_Postman_Collection.json`](./docs/LifeLineConnect_Postman_Collection.json).

## Tech Stack

| Layer | Technology | Purpose |
|:---|:---|:---|
| Frontend | React 19, TypeScript, Vite 8 | Component‑based SPA |
| Styling | Tailwind CSS v4 | Utility‑first design system |
| Routing | React Router v7 | Client‑side navigation |
| HTTP | Axios | API communication with JWT interceptors |
| Backend | ASP.NET Core (.NET 10) | RESTful API |
| Auth | JWT Bearer + BCrypt | Stateless authentication |
| Reporting | QuestPDF | Server‑side PDF generation |
| Database | Oracle 21c XE | Transactional data, business logic in PL/SQL |
| NoSQL | MongoDB | Community content, analytics |

## License

This project is proprietary and was developed as part of the Database Management II module (HDSE 26.1) at the National Institute of Business Management (NIBM). All rights reserved by **Danushka Madushan**.

---

<div align="center">
  <br />
  <img src="./web-ui/public/favicon.svg" alt="LifeLineConnect" width="28" />
  <br /><br />
  <p>
    LifeLineConnect was built to make blood donation logistics simpler, faster, and more transparent.<br />
    From scheduling a camp to saving a life at a hospital — every unit is tracked, every step is audited, and every stakeholder stays connected.
  </p>
  <p>Developed with love by <a href="https://github.com/Danushka-Madushan">Danushka Madushan</a></p>
  <br />
</div>
