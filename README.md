# Wooper Warehouse Management System (WMS)

A full-stack **MERN** (MongoDB, Express.js, React, Node.js) Warehouse Management System for high-throughput distribution operations — end-to-end inventory, purchasing, dispatch, stock movement, reporting, and RBAC security, styled as a dense "fulfillment ops console" (Kanban boards, scan-driven workflows, live alerts).

---

## 🌟 Features

### Authentication & RBAC
- Roles: `super_admin`, `warehouse_manager`, `warehouse_staff`, `auditor` — each with a distinct, enforced permission set (auditor is strictly read-only, checked both in the UI and on every API route).
- JWT tokens, bcrypt password hashing.

### Inventory Engine
- SKU, barcode, and QR code auto-generation per product.
- Multi-state stock tracking: `available`, `reserved`, `damaged`, `returned`.
- Reorder-level thresholds with Low/Out-of-Stock health badges.
- Instant barcode/QR scanner (sidebar quick action) for product lookup by barcode, SKU, or scan.

### Facilities & Warehouses
- Warehouse hierarchy: Zone → Rack → Shelf → Bin.
- Storage capacity tracking.

### Purchase Orders (Receiving)
- Create POs against vendors with multi-line items and unit costs.
- **Scan-to-receive**: scan each carton's barcode/SKU as it comes off the truck — verified against the PO's line items and rejected if it doesn't belong, then logged with an optional put-away bin. A manual quantity-entry table covers bulk/non-barcoded corrections.
- Partial receiving with automatic `pending → partially_received → completed` status tracking.
- Printable receiving slips.

### Dispatch Orders (Fulfillment)
- Reserves stock (`available` ↓ / `reserved` ↑) at order creation; releases it on dispatch or cancel.
- Full pick → pack → dispatch → deliver lifecycle, each transition validated server-side.
- Pick list sequenced by warehouse zone → rack → shelf → bin.
- **Scan-to-pack**: barcode verification blocks mispicks before an order is boxed.
- **Kanban board** (default view, with a Table toggle) — columns per status, priority-colored cards, live progress bars.
- Printable delivery notes / packing slips.

### Stock Transfers
- Relocate inventory between warehouses/bins: `requested → approved → in_transit → completed` (or `rejected`).
- Since a product record lives at exactly one warehouse/bin at a time, transfers always move the full available quantity — partial cross-location splits of the same SKU are rejected rather than silently corrupting stock.

### Stock Adjustments
- Formal approval workflow for `damaged_in_transit`, `expired`, `count_discrepancy` (cycle counts), and `write_off` — request → manager/admin approval → stock applied.

### Reports & Analytics
- Stock valuation by **Average Cost** or real **FIFO** (costed from actual PO receiving history).
- Fast/slow-mover velocity and dead-stock detection from dispatch activity.
- Expiry / shelf-life tracking with bucketed status.
- Export to **CSV**, **Excel** (`exceljs`), and **PDF** (`pdfkit`).

### Notifications
- Live-computed alert feed in the navbar (low stock, open POs, open dispatch orders) — scoped to the user's assigned warehouse where applicable.
- Best-effort low-stock email alerts via Nodemailer; no-ops safely if SMTP isn't configured.

### Immutable Audit Trail
- Every mutation (logins, product/stock changes, PO/dispatch/transfer/adjustment actions) is logged with user, role, old/new values, IP, and timestamp — queryable and filterable in the Audit Logs page.

---

## 🧱 Tech Stack

| Layer | Stack |
| :--- | :--- |
| Frontend | React 18 (Vite), Tailwind CSS, React Router v6, Axios, Lucide Icons |
| Backend | Node.js, Express, Mongoose (MongoDB), JWT, Helmet, Morgan, express-rate-limit |
| Reporting | ExcelJS, PDFKit |
| Email | Nodemailer (optional) |
| Testing | Jest, Supertest |
| Containers | Docker, docker-compose |

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- MongoDB (running locally or via MongoDB Atlas)

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env   # then fill in real secrets
npm run seed            # seeds database with test users, facilities, products, orders
npm run dev             # http://localhost:5000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev              # http://localhost:5173
```

### 3. Run Backend Tests
```bash
cd backend
npm test                 # Jest/Supertest — auth + stock-math integrity, against a real test DB
```
Uses a separate database (`warehouse_mgmt_test_db` by default — override with `TEST_MONGO_URI`) so it never touches your dev data.

### 4. Run with Docker
```bash
docker compose up --build
```
Spins up MongoDB, the backend (`:5000`), and the frontend (`:5173`) together. Set `JWT_SECRET` in your shell environment first, or edit `docker-compose.yml` directly, to avoid running with the default dev secret.

---

## 🔑 Default Test Accounts (Password: `password123`)

| Role | Email |
| :--- | :--- |
| **Super Admin** | `admin@wms.com` |
| **Warehouse Manager** | `manager@wms.com` |
| **Warehouse Staff** | `staff@wms.com` |
| **Auditor** | `auditor@wms.com` |

---

## 📡 API Overview

All routes are mounted under `/api/v1` and require a `Bearer` token (except `/auth/login`):

| Base Route | Covers |
| :--- | :--- |
| `/auth` | Login, current user, user list |
| `/warehouses` | Warehouses, bin locations |
| `/products` | Product catalog, categories, barcode lookup |
| `/inventory` | Quick stock adjustments |
| `/purchase-orders` | PO create/list/detail, receive, cancel |
| `/dispatch-orders` | Dispatch create/list/detail, pick, pack, dispatch, deliver, cancel |
| `/stock-transfers` | Transfer request/approve/reject/in-transit/complete |
| `/stock-adjustments` | Adjustment request/approve/reject |
| `/reports` | Valuation, velocity, expiry, CSV/Excel/PDF export |
| `/notifications` | Live alert feed |
| `/dashboard` | KPI stats |
| `/audit` | Immutable audit log query |

`GET /api/health` is unauthenticated and returns server status.

---

## 📂 Environment Variables

See `backend/.env.example` for the full list. Notable ones:
- `MONGO_URI` — required.
- `JWT_SECRET` — required, change from the example value in any real deployment.
- `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` — optional; low-stock email alerts are silently disabled if these aren't set.
