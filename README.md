# Wooper Warehouse Management System (WMS)

A modern, full-stack **MERN** (MongoDB, Express.js, React, Node.js) Warehouse Management System built for high-throughput distribution operations, real-time inventory tracking, and RBAC security.

---

## 🌟 Features (30% Milestone)

- **Authentication & RBAC (Role-Based Access Control)**:
  - Roles: `Super Admin`, `Warehouse Manager`, `Warehouse Staff`, `Auditor`
  - JWT tokens, password hashing with bcrypt, and role guards.
- **Inventory Engine**:
  - SKU, Barcode, and QR Code generation.
  - Multi-state stock tracking: `available`, `reserved`, `damaged`, `returned`.
  - Reorder level & stock health thresholds.
- **Facilities & Warehouses**:
  - Warehouse hierarchies (Zones, Racks, Shelves, Bins).
  - Storage capacity management.
- **Instant Barcode / QR Scanner**:
  - Fast product lookup by Barcode, SKU, or QR code.
- **Real-Time Analytics Dashboard**:
  - Live KPI cards (Stock valuation, Available units, Low/Out-of-stock counts).
  - Live immutable audit activity feed.
- **Immutable Audit Trail**:
  - Tamper-evident logging of all mutations, logins, and inventory changes with IP and timestamps.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- MongoDB (Running locally or MongoDB Atlas)

### 1. Backend Setup
```bash
cd backend
npm install
npm run seed      # Seeds database with test users, facilities, and products
npm run dev       # Runs on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev       # Runs on http://localhost:5173
```

---

## 🔑 Default Test Accounts (Password: `password123`)

| Role | Email |
| :--- | :--- |
| **Super Admin** | `admin@wms.com` |
| **Warehouse Manager** | `manager@wms.com` |
| **Warehouse Staff** | `staff@wms.com` |
| **Auditor** | `auditor@wms.com` |
