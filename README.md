<div align="center">
  <br />
  <a href="https://github.com/Danushka-Madushan/LifeLineConnect">
    <img src="./web-ui/public/favicon.svg" alt="LifeLineConnect" width="90" />
  </a>
  <h3>LifeLineConnect</h3>
  <p>Blood Donation & Supply Chain Management Platform</p>

  <p>
    <img src="https://img.shields.io/badge/.NET_10-512BD4?style=flat-square&logo=dotnet&logoColor=white" />
    <img src="https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black" />
    <img src="https://img.shields.io/badge/Oracle_21c-F80000?style=flat-square&logo=oracle&logoColor=white" />
    <img src="https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white" />
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" />
    <img src="https://img.shields.io/badge/Tailwind_v4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" />
  </p>
</div>

## About

LifeLineConnect is a full-stack platform that manages the complete blood donation lifecycle — from donor registration and camp scheduling through to blood unit storage, hospital allocation, and supply chain logistics.

The system connects four distinct stakeholder roles through a unified interface: system administrators, blood bank operators, organizing committee members, and individual donors. Each role has a dedicated dashboard with capabilities tailored to their operational requirements.

**At a glance:**

| Metric | Count |
|:---|:---|
| Database tables | 23 |
| PL/SQL procedures & functions | 57 |
| REST API endpoints | 90 |
| Frontend views | 31 |
| Audit triggers | 3 |

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

> **Zero inline SQL.** Every Oracle interaction passes through `CommandType.StoredProcedure`. Business logic lives in the database, not the application layer.

## Features

### Donor Portal
- Personal dashboard with donation history and eligibility tracking
- Medical questionnaire with server-side PL/SQL evaluation
- Camp discovery, registration, and slot booking
- Community Q&A forum (MongoDB-backed)
- Real-time notification feed

### Blood Bank Operations
- Live blood unit inventory with expiry monitoring (42-day shelf life)
- Receive and process incoming donation transfers
- Global hospital request board — any hospital can request, any bank can fulfill
- Automated unit allocation against pending requests
- Medical staff assignment and management
- PDF export: inventory reports, hospital request status

### Organizing Committee
- Venue registration and lifecycle management
- Donation camp creation with target blood group planning
- Donor registration processing and donation recording
- Transfer dispatch workflow (camp → blood bank with item-level tracking)
- Staff scheduling across camps
- PDF export: camp performance reports

### System Administration (Webmaster)
- Full audit trail with Oracle trigger-based logging
- Oracle schema backup and MongoDB collection export
- System-wide analytics: users, banks, committees, community metrics
- Dedicated PDF reports per data domain
- User and entity management

## Project Structure

```
LifeLineConnect/
├── db/
│   └── scripts/                 # 17 PL/SQL files (procedures, functions, triggers)
├── docs/                        # Architecture specs, Postman collection, design assets
├── web-server/                  # .NET 10 Web API
│   ├── Controllers/             # 7 controllers (Auth, Donor, BloodBank, Committee, ...)
│   ├── Data/                    # Oracle & MongoDB connection providers
│   ├── Filters/                 # Global exception handling (OracleExceptionFilter)
│   ├── Middlewares/             # Request pipeline middleware
│   └── Models/                  # DTOs grouped by domain
└── web-ui/                      # React 19 SPA
    └── src/
        ├── components/          # Shared layouts, navigation, guards
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
# Connect as SYSDBA and run the schema creation script
sqlplus sys/password@localhost/LifeLineConnect_PDB as sysdba
@db/scripts/pdb_permissions.sql

# Connect as LLC_ADMIN and execute scripts 01–11 in order
sqlplus LLC_ADMIN/admin@localhost/LifeLineConnect_PDB
@db/scripts/01_auth_procedures.sql
@db/scripts/02_donor_procedures.sql
# ... continue through 11_audit_triggers.sql
```

### 2. Backend

```bash
cd web-server
cp .env.example .env          # Configure Oracle/MongoDB connection strings
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

| Controller | Prefix | Endpoints | Auth |
|:---|:---|:---|:---|
| `AuthController` | `/api/auth` | Login, Register, Profile | Public / JWT |
| `DonorController` | `/api/donors` | Dashboard, Donations, Medical, Feedback | Donor |
| `BloodBankController` | `/api/blood-bank` | Inventory, Transfers, Hospital Requests, Staff | Blood Bank |
| `CommitteeController` | `/api/committee` | Venues, Camps, Registrations, Transfers, Staff | Committee |
| `WebmasterController` | `/api/webmaster` | Audit, Backups, Reports, User Management | Webmaster |
| `PublicController` | `/api/public` | Home Stats, Camps, Appeals, Community | Public |
| `NotificationController` | `/api/notifications` | User Notifications | JWT |

A complete Postman collection is available at [`docs/LifeLineConnect_Postman_Collection.json`](./docs/LifeLineConnect_Postman_Collection.json).

## Tech Stack

| Layer | Technology | Purpose |
|:---|:---|:---|
| Frontend | React 19, TypeScript 6, Vite 8 | Component-based SPA |
| Styling | Tailwind CSS v4 | Utility-first design system |
| Routing | React Router v7 | Client-side navigation |
| HTTP | Axios | API communication with JWT interceptors |
| Backend | ASP.NET Core (.NET 10) | RESTful API layer |
| Auth | JWT Bearer + BCrypt | Stateless authentication |
| Reports | QuestPDF | Server-side PDF generation |
| RDBMS | Oracle 21c XE | Transactional data, business logic |
| NoSQL | MongoDB | Community content, analytics |

## License

Proprietary. Developed by **Danushka Madushan** as part of the Database Management II module at NIBM.

<div align="center">
  <i>Developed with ❤️ for a better healthcare logistics future</i>
</div>
