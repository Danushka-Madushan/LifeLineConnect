<div align="center">
  <br />
  <a href="https://github.com/Danushka-Madushan/LifeLineConnect">
    <img src="./web-ui/public/favicon.svg" alt="LifeLineConnect" width="140" />
  </a>

  <h1>LifeLineConnect</h1>
  <p><strong>Blood Donation & Supply Chain Management Platform</strong></p>
  <p>
    Connecting donors, blood banks, hospitals, and organizing committees<br />
    through a unified, real-time healthcare logistics system.
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

## About

LifeLineConnect is a full-stack platform that manages the complete blood donation lifecycle — from the moment a donor registers for a camp, through collection and transportation, all the way to hospital allocation.

It brings four key stakeholders together under one roof: **system administrators** who oversee everything, **blood bank operators** who manage inventory and fulfill hospital requests, **organizing committees** who run donation camps and coordinate logistics, and **donors** who track their journey and give back to the community.

Every database interaction goes through PL/SQL stored procedures — no inline SQL anywhere in the application. Business logic lives where it belongs: in the database.

**The system at a glance:**

| | Count |
|:---|:---|
| Oracle tables | 23 |
| PL/SQL procedures & functions | 57 |
| REST API endpoints | 90 |
| Frontend views | 31 |
| Database audit triggers | 3 |

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

### 🩸 Donor Portal
- Personal dashboard with full donation history and eligibility tracking
- Medical questionnaire evaluated server-side via PL/SQL — no frontend shortcuts
- Discover upcoming camps, register for slots, and get notified
- Participate in a community Q&A forum (backed by MongoDB)

### 🏥 Blood Bank Operations
- Live inventory dashboard with expiry monitoring (42-day shelf life)
- Receive donation transfers from committees and unpack them into tracked units
- Global hospital request board — any hospital can ask, any bank with stock can fulfill
- Allocate units against pending requests with priority-based ordering
- Manage medical staff assignments
- Export professional PDF reports for inventory and hospital requests

### 🏕️ Organizing Committee
- Register and manage venues across regions
- Plan donation camps with target blood group goals
- Process donor registrations and record donations on-site
- Dispatch blood transfers to banks with item-level chain-of-custody tracking
- Assign and schedule staff across active camps
- Export camp performance and transfer reports as PDFs

### ⚙️ System Administration
- Complete audit trail powered by Oracle database triggers
- One-click Oracle schema backup and MongoDB collection export
- System-wide analytics covering users, banks, committees, and community activity
- Generate and download dedicated PDF reports for any data domain

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
        └── pages/               # 31 views across 5 role-based modules
```

## Getting Started

### Prerequisites

| Dependency | Version |
|:---|:---|
| Oracle Database XE | 21c |
| MongoDB | 7+ |
| .NET SDK | 10.0 |
| Node.js | 22+ |

### 1. Database

```bash
# Connect as SYSDBA and configure the pluggable database
sqlplus sys/password@localhost/LifeLineConnect_PDB as sysdba
@db/scripts/pdb_permissions.sql

# Connect as LLC_ADMIN and run all scripts in order (01 through 11)
sqlplus LLC_ADMIN/admin@localhost/LifeLineConnect_PDB
@db/scripts/01_auth_procedures.sql
@db/scripts/02_donor_procedures.sql
# ... continue through 11_audit_triggers.sql
```

### 2. Backend

```bash
cd web-server
dotnet restore
dotnet run                    # → http://localhost:5068
```

### 3. Frontend

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

> 📬 A complete Postman collection is available at [`docs/LifeLineConnect_Postman_Collection.json`](./docs/LifeLineConnect_Postman_Collection.json)

## Tech Stack

| Layer | Technology | Purpose |
|:---|:---|:---|
| Frontend | React 19, TypeScript, Vite 8 | Component-based SPA |
| Styling | Tailwind CSS v4 | Utility-first design system with custom tokens |
| Routing | React Router v7 | Client-side navigation with role-based guards |
| HTTP | Axios | API layer with JWT interceptors |
| Backend | ASP.NET Core (.NET 10) | RESTful API with controller-based routing |
| Auth | JWT Bearer + BCrypt | Stateless authentication and password hashing |
| Reports | QuestPDF | Server-side PDF generation |
| RDBMS | Oracle 21c XE | Transactional data store, all business logic in PL/SQL |
| NoSQL | MongoDB | Community content, feedback, analytics |

## License

This project is proprietary and developed as part of the Database Management II module (HDSE 26.1) at the National Institute of Business Management (NIBM). All rights reserved.

---

<div align="center">
  <br />
  <img src="./web-ui/public/favicon.svg" alt="LifeLineConnect" width="28" />
  <br /><br />
  <p>
    LifeLineConnect was built to make blood donation logistics simpler, faster, and more transparent.<br />
    From scheduling a camp to saving a life at a hospital — every unit is tracked, every step is audited,<br />
    and every stakeholder stays connected.
  </p>
  <sub>Developed with ❤️ by <a href="https://github.com/Danushka-Madushan">Danushka Madushan</a></sub>
  <br /><br />
</div>
