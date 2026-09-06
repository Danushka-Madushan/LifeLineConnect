<div align="center">
  <a href="https://github.com/Danushka-Madushan/LifeLineConnect">
    <img src="./web-ui/public/favicon.svg" alt="LifeLineConnect Logo" width="120" />
  </a>
  
  <h1 align="center">LifeLineConnect</h1>

  <p align="center">
    <strong>An Enterprise-Grade Blood Donation & Logistics Management System</strong>
    <br />
    A comprehensive solution bridging the gap between Blood Banks, Hospitals, Organizing Committees, and Donors.
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/.NET-10.0-512BD4?style=for-the-badge&logo=dotnet" alt=".NET 10" />
    <img src="https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
    <img src="https://img.shields.io/badge/Oracle-21c-F80000?style=for-the-badge&logo=oracle&logoColor=white" alt="Oracle 21c" />
    <img src="https://img.shields.io/badge/MongoDB-NoSQL-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  </p>
</div>

<hr />

## 📖 Overview

**LifeLineConnect** is a robust, full-stack enterprise application designed to streamline the entire lifecycle of blood donation, storage, request, and allocation. Built on a high-performance **.NET 10** micro-architecture, backed by the industrial strength of **Oracle 21c Database**, and featuring a lightning-fast **React 19 + Vite** frontend, LifeLineConnect guarantees seamless interoperability among medical supply chain stakeholders.

## Key Features

- **Secure RBAC Architecture**: Granular Role-Based Access Control (JWT) isolating Webmasters, Blood Banks, Organizing Committees, and Donors.
- **Live Inventory & Allocation**: Real-time blood unit tracking, automatic expiry calculation (42 days), and hospital request fulfillment.
- **Global Hospital Requests**: Unified hospital blood-request board visible to all networked blood banks for rapid emergency response.
- **Secure Chain of Custody**: Advanced donation transfer logistics, securely tracking batches of blood units from donation camps to regional blood banks.
- **Automated Medical Checks**: Database-level PL/SQL evaluation of donor medical questionnaires to instantly determine eligibility.
- **Enterprise PDF Reporting**: On-the-fly, high-fidelity PDF report generation powered by QuestPDF (Audit logs, Inventory reports, Camp stats).
- **Oracle Audit Triggers**: Strict row-level auditing managed silently and immutably via Oracle DB triggers.

## Technology Stack

### Frontend (Client Tier)
- **React 19** & **TypeScript 6** - UI Components & Logic
- **Vite 8** - Ultra-fast HMR and build tooling
- **Tailwind CSS v4** - Utility-first modern styling
- **React Router v7** - Declarative client-side routing
- **Axios** - Interceptor-managed API communications

### Backend (API Tier)
- **C# .NET 10** - ASP.NET Core Web API
- **JWT Bearer Authentication** - Stateless, secure authorization
- **QuestPDF** - Document creation & analytical reporting
- **BCrypt.Net-Next** - Cryptographic password hashing

### Database (Data Tier)
- **Oracle 21c Express Edition** - Primary relational data store (Procedures, Triggers, Ref Cursors)
- **MongoDB 7+** - Document store used for lightning-fast caching, leaderboards, and telemetry

## Project Structure

```text
LifeLineConnect/
├── db/                        # Oracle PL/SQL Scripts
│   ├── scripts/               # Triggers, Procedures, & Functions
│   └── docs/                  # Architectural Schemas
├── web-server/                # .NET 10 Backend
│   ├── Controllers/           # RESTful API Endpoints
│   ├── Models/                # C# DTOs and Data Models
│   ├── Filters/               # Custom Exception Handling
│   └── Program.cs             # Pipeline & Dependency Injection
└── web-ui/                    # React Frontend
    ├── public/                # Static assets (Favicon, SVGs)
    ├── src/                   # React source code
    │   ├── components/        # Reusable UI elements (Layouts, Modals)
    │   ├── pages/             # Role-based views (BankDashboard, etc.)
    │   └── lib/               # Utility functions (Axios setup)
    └── package.json           # Frontend dependencies
```

## Getting Started

### 1. Prerequisites
- **Oracle Database 21c XE** installed and running on `localhost`.
- **MongoDB** running locally on default port `27017`.
- **.NET 10.0 SDK**.
- **Node.js** (v22+) and npm.

### 2. Database Setup (Oracle)
1. Log into your Oracle instance as `SYSDBA`.
2. Create the workspace by executing the master schema file:
   `db/scripts/00_schema.sql` (Note: Ensure the `LLC_ADMIN` user is created with appropriate quotas).
3. Execute the remaining procedure files in `db/scripts/` (01 through 11) to generate the business logic layer.

### 3. Backend Setup (.NET Core)
```bash
cd web-server
# Ensure all dependencies are restored
dotnet restore
# Run the development server (Defaults to http://localhost:5068)
dotnet run
```

### 4. Frontend Setup (React)
```bash
cd web-ui
# Install dependencies
npm install
# Start Vite development server
npm run dev
```
Visit `http://localhost:5173` in your browser.

## 👥 Core User Roles

| Role | Capabilities |
| :--- | :--- |
| **Webmaster** | Full system oversight, comprehensive audit log PDF extraction, database backups (Oracle/Mongo snapshotting), and global community analytics. |
| **Blood Bank** | Inventory control, medical staff management, receiving committee transfers, and allocating blood to hospital requests. |
| **Committee** | Venue registration, camp scheduling, public appeals, donor registrations, and dispatching blood transfers to banks. |
| **Donor** | Personal dashboard, donation history, medical questionnaires, booking camp slots, and community Q&A. |

## License

This project is proprietary and developed as part of the SE DM2 Module. All rights reserved by **Danushka Madushan**.

---
<div align="center">
  <i>Developed with ❤️ for a better healthcare logistics future.</i>
</div>
