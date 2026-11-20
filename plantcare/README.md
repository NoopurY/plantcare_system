# 🌿 VerdeBase (PlantCare 2.0)
### PostgreSQL-Powered Botanical Management System + Interactive DBMS Observability Studio

> **"VerdeBase is a real database-driven plant management platform where the underlying PostgreSQL relational engine is made transparent, educational, and observable through an interactive DBMS Studio."**

---

## 📖 1. Project Overview
**VerdeBase** upgrades a prototype plant care tracker into an enterprise-grade 3rd-year engineering project. It serves two tightly-integrated identities:

1. **🌱 PlantCare Application**: A full-featured botanical management suite. Users can manage plants, record and track multidimensional care activities (watering, fertilization, vegetative growth, health diagnostics), schedule automated routines, and query species taxonomies.
2. **🗄️ PlantCare DBMS Studio**: A real-time database observability platform connected directly to PostgreSQL system catalogs (`information_schema`, `pg_class`, `pg_proc`, `pg_stat_user_tables`). It visually demonstrates core DBMS concepts—relational algebra, 3NF normalization, constraint enforcement, B-Tree indexing, execution plan trees (`EXPLAIN ANALYZE`), triggers, and ACID transactions—operating on actual database state rather than static simulations.

---

## 🎯 2. Problem Statement
Traditional academic database projects suffer from a persistent disconnect: students either build frontends that treat databases as black boxes or write isolated SQL scripts without a real application context. Furthermore, home gardeners struggle with plant mortality due to irregular watering schedules and poorly tracked health metrics.

**VerdeBase bridges this gap**:
- It demonstrates practical software engineering by deploying a normalized 14-table relational architecture behind a Next.js platform.
- It exposes database mechanisms to evaluators, enabling interactive verification of relational theory during presentations and vivas.

---

## 🚀 3. Core Objectives
- **Relational Integrity**: Complete 3NF normalized schema eliminating update, insertion, and deletion anomalies.
- **Engine-Level Automation**: Event-driven automation using PostgreSQL triggers (`AFTER INSERT`) for health score recalculation and notification dispatching.
- **Transactional Safety**: Multi-statement atomic transactions (`BEGIN ... COMMIT / ROLLBACK`) guaranteeing ACID invariants.
- **Physical Optimization**: Strategic composite B-Tree indexes on high-cardinality predicate columns, verified with `EXPLAIN ANALYZE`.
- **Zero Fake Features**: Every metric, execution time, row count, and schema definition is queried live from PostgreSQL.

---

## 🛠️ 4. Technology Stack

### Frontend & Application Layer
- **Framework**: Next.js 15 (App Router, Server Components & Client Components)
- **Language**: JavaScript (ES2024 / Node.js native ESM)
- **Styling**: Tailwind CSS v4 + Custom Dark Botanical Design System (`--bg-primary: #0d1a0c`, `--green-primary: #86bc42`)
- **Data Visualization**: Recharts (Time-series Area, Bar, and Pie Charts)
- **Iconography**: Lucide React
- **Micro-Interactions**: Framer Motion

### Database & Backend Engine
- **RDBMS**: PostgreSQL 16+ / 17
- **Database Driver**: `pg` (node-postgres connection pool with parameterized prepared queries)
- **Security & Sessions**: JWT (`jose` / `jsonwebtoken`) with HTTP-only cookies and `bcryptjs` password hashing
- **Administration**: pgAdmin 4 & `psql` CLI
- **Email Dispatching**: Nodemailer with SMTP transport

---

## 🏗️ 5. Global Architecture

```text
                               VerdeBase (PlantCare 2.0)
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    │                                             │
          🌱 PlantCare Application                      🗄️ DBMS Studio
                    │                                             │
        ├── Dashboard & KPI Metrics                   ├── Database Overview
        ├── Plant Collection (CRUD)                   ├── Interactive ER Explorer
        ├── Normalized Species Directory              ├── Relational Model Inspector
        ├── Care Hub (Water/Fertilize)                ├── Normalization (UNF -> 3NF)
        ├── Growth Time-Series (cm/leaves)            ├── Interactive SQL Lab
        ├── Health Diagnostics & Scoring              ├── Constraint Playground
        ├── Care Routine Reminders                    ├── View Explorer
        ├── Aggregated Analytics                      ├── Stored Functions
        └── AI Botanical Assistant                    ├── Trigger Visualizer
                                                      ├── ACID Transaction Simulator
                                                      ├── B-Tree Index Explorer
                                                      ├── EXPLAIN ANALYZE Trees
                                                      ├── Engine Telemetry
                                                      ├── Audit Trail Inspector
                                                      └── Professor Viva Demo Mode
                    │                                             │
                    └──────────────────────┬──────────────────────┘
                                           │
                         Node.js API Route Layer (node-postgres)
                                           │
                        PostgreSQL 16 Engine & System Catalogs
```

---

## 🗄️ 6. Database Architecture & Schema Design

The database contains **14 normalized tables**, **6 views**, **5 stored functions**, **5 triggers**, and **20+ indexes**.

### Table Breakdown
| # | Table Name | Primary Key | Key Foreign Keys | Purpose & Normalization Role |
|---|---|---|---|---|
| 1 | `roles` | `role_id` (SERIAL) | — | Lookup table for role-based access (`admin`, `user`). |
| 2 | `users` | `user_id` (UUID) | `role_id` &rarr; `roles` | User credentials, bcrypt hash, email format CHECK. |
| 3 | `species` | `species_id` (SERIAL) | — | Normalized botanical taxonomy. Reduces plant instance redundancy. |
| 4 | `care_profiles` | `profile_id` (SERIAL) | `species_id` &rarr; `species` (UNIQUE) | 3NF decomposition: species-specific watering intervals. |
| 5 | `plants` | `plant_id` (UUID) | `user_id` &rarr; `users`, `species_id` &rarr; `species` | Core entity linking user ownership to botanical taxonomy. |
| 6 | `watering_logs` | `log_id` (UUID) | `plant_id` &rarr; `plants` | Transactional time-series log of irrigation events. |
| 7 | `fertilization_logs` | `log_id` (UUID) | `plant_id` &rarr; `plants` | Nutrient application records and dosage tracking. |
| 8 | `growth_logs` | `log_id` (UUID) | `plant_id` &rarr; `plants` | Biometric measurements (height in cm, leaf count, stage). |
| 9 | `health_logs` | `log_id` (UUID) | `plant_id` &rarr; `plants` | Diagnostic inspection records with numeric score (0–100). |
| 10 | `diseases` | `disease_id` (SERIAL) | — | Normalized catalog of plant pathologies and treatments. |
| 11 | `disease_records` | `record_id` (UUID) | `plant_id` &rarr; `plants`, `disease_id` &rarr; `diseases` | Many-to-many junction recording plant illness history. |
| 12 | `care_schedules` | `schedule_id` (UUID) | `user_id` &rarr; `users`, `plant_id` &rarr; `plants` | Scheduled recurring care routines with day array masks. |
| 13 | `notifications` | `notification_id` (UUID) | `user_id` &rarr; `users`, `plant_id` &rarr; `plants` | Trigger-generated automated alerts (health drops, diseases). |
| 14 | `audit_logs` | `audit_id` (UUID) | `user_id` &rarr; `users` | Immutable audit trail capturing JSONB mutation snapshots. |

---

## 📐 7. Relational Model & Normalization Proof

### Functional Dependencies in Raw Plant Data:
$$\text{plant\_id} \rightarrow \text{user\_id}, \text{plant\_name}, \text{species\_id}, \text{location}$$
$$\text{species\_id} \rightarrow \text{scientific\_name}, \text{common\_name}, \text{care\_difficulty}$$
$$\text{species\_id} \rightarrow \text{watering\_interval\_days}, \text{fertilizer\_type}$$

### Normalization Progression:
1. **UNF &rarr; 1NF**:
   - Multi-valued attributes (repeating watering dates and symptom strings) converted to discrete atomic records.
   - Defined composite primary keys on transactional entities.
2. **1NF &rarr; 2NF**:
   - Removed partial functional dependencies where botanical details depended only on the species name rather than the full candidate key.
   - Decomposed into `plants` and separate care log relations.
3. **2NF &rarr; 3NF**:
   - Removed transitive dependency: $\text{plant\_id} \rightarrow \text{species\_id} \rightarrow \text{watering\_interval\_days}$.
   - Created standalone `care_profiles` relation referenced strictly through `species_id`.

---

## ⚡ 8. Database Objects

### Views (`database/views.sql`)
1. `plant_health_summary`: Evaluates current plant condition using `LATERAL` joins to fetch the latest health check and watering date.
2. `plant_care_summary`: Aggregates lifetime care counts, average health score, and total height gained per plant.
3. `disease_summary`: Active and resolved pathologies with duration-to-resolution calculations.
4. `plant_activity_summary`: Polymorphic `UNION ALL` compiling care events into a unified chronological feed.
5. `species_care_overview`: Aggregates species taxonomy with default care profile requirements and live plant usage counts.
6. `user_dashboard_stats`: User collection aggregates for instant dashboard loading.

### Stored Functions (`database/functions.sql`)
1. `calculate_plant_health_score(UUID)`: Evaluates days elapsed since watering against species interval, deducts points for overdue intervals and active diseases, and returns a clamped score (0–100).
2. `calculate_next_watering_date(UUID)`: Computes next irrigation timestamp by projecting species watering interval from the latest watering log.
3. `get_plant_statistics(UUID)`: Returns a statistical record tuple with lifetime milestones for a single plant.
4. `get_user_care_summary(UUID, INTEGER)`: Returns period-based care aggregates over a parameterized day window.
5. `get_database_statistics()`: System catalog function returning live table row counts, disk sizes, and index counts.

### Triggers (`database/triggers.sql`)
1. `trg_after_watering_insert`: `AFTER INSERT ON watering_logs` &rarr; Re-evaluates plant health score, updates `plants.health_status`, and appends an audit tuple.
2. `trg_after_disease_record_insert`: `AFTER INSERT ON disease_records` &rarr; Automatically inserts an alert in `notifications` and downgrades plant health to critical.
3. `trg_after_growth_log_insert`: `AFTER INSERT ON growth_logs` &rarr; Updates `plants.growth_stage` and creates a milestone notification.
4. `trg_after_health_log_insert`: `AFTER INSERT ON health_logs` &rarr; Synchronizes status and triggers urgent alerts if score $< 30$.
5. `trg_after_plant_insert`: `AFTER INSERT ON plants` &rarr; Generates a welcome notification and creates an initial audit log record.

---

## 🛡️ 9. Constraints & Data Integrity

- **CHECK Constraints**:
  - `health_score BETWEEN 0 AND 100`
  - `quantity_ml > 0` and `height_cm > 0`
  - `watering_interval_days BETWEEN 1 AND 90`
  - `email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'`
  - `resolved_at >= detected_at`
- **FOREIGN KEY Actions**:
  - Cascading deletes (`ON DELETE CASCADE`) on logs when a plant is deleted.
  - Restricted deletes (`ON DELETE RESTRICT`) on roles and species currently assigned to plants.
- **UNIQUE Constraints**:
  - `users(email)`
  - `species(scientific_name)`
  - `roles(role_name)`

---

## 🚀 10. Getting Started & Installation

### Prerequisites
- Node.js 18.x or later
- PostgreSQL 15+ / 16+ / 17
- pgAdmin 4 (optional but recommended)

### 1. Clone & Install Dependencies
```bash
cd plantcare
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update your credentials in `.env`:
```ini
DB_HOST=localhost
DB_PORT=5432
DB_NAME=verdebase
DB_USER=postgres
DB_PASSWORD=your_postgres_password
JWT_SECRET=super_secret_session_key_min_32_characters
NEXT_PUBLIC_GROQ_API_KEY=your_groq_api_key_optional
```

### 3. Initialize PostgreSQL Database
Open **psql** or **pgAdmin Query Tool** and run the scripts in order:

```sql
-- 1. Create database
CREATE DATABASE verdebase;
\c verdebase;

-- 2. Execute schema & extensions
\i database/schema.sql

-- 3. Apply indexes
\i database/indexes.sql

-- 4. Apply views
\i database/views.sql

-- 5. Compile stored functions
\i database/functions.sql

-- 6. Register triggers
\i database/triggers.sql

-- 7. Seed realistic demo data
\i database/seed.sql
```

*(Alternatively, run `node -e "..."` or execute via pgAdmin 4 by opening each file and clicking Run).*

### 4. Seed Credentials
The seed script creates two default users:
- **Admin**: `admin@verdebase.com` (password: `password123`)
- **Standard User**: `jane@verdebase.com` (password: `password123`)

### 5. Launch VerdeBase
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🎓 11. Professor Viva / Presentation Guide

Navigate to **🗄️ DBMS Studio &rarr; Demo Mode (Viva)** (`/dbms/demo`) to walk evaluators through each concept:

| Step | Topic | What to Show |
|---|---|---|
| 1 | **Conceptual Schema** | Open `/dbms/er` &rarr; Click `plants` to show relationship lines and cardinality. |
| 2 | **Normalization** | Open `/dbms/normalization` &rarr; Walk through UNF &rarr; 1NF &rarr; 2NF &rarr; 3NF tabs. |
| 3 | **Integrity Enforcement** | Open `/dbms/constraints` &rarr; Click *Execute Violating SQL* &rarr; Show PostgreSQL engine error code `23514`. |
| 4 | **Database Triggers** | Open `/dbms/triggers` &rarr; Click *Simulate Event Flow* &rarr; Trace cascading updates. |
| 5 | **Transactions & ACID** | Open `/dbms/transactions` &rarr; Contrast successful COMMIT vs aborted ROLLBACK. |
| 6 | **Virtual Views** | Open `/dbms/views` &rarr; Show `plant_health_summary` query and live result table. |
| 7 | **Performance Optimization** | Open `/dbms/query-performance` &rarr; Run `EXPLAIN ANALYZE` on indexed queries. |

---

## 🔒 12. Security Architecture
- **SQL Injection Prevention**: All queries pass through prepared parameter arrays (`$1, $2, ...`) via `node-postgres`.
- **Credential Protection**: Passwords hashed with `bcryptjs` (salt factor 10); database credentials stored strictly in server-side environment variables.
- **Session Integrity**: HTTP-Only, SameSite signed JWT cookies prevent XSS session hijacking.
- **SQL Lab Sandboxing**: Public query executor is restricted strictly to read-only `SELECT` and `EXPLAIN` statements.

---

## 📄 License
Academic & Educational Project &bull; Built for Database Management Systems (DBMS) Course.
