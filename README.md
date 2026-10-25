# SyncSpace
> Real-time tasks, notes and team chat in one workspace

SyncSpace is a unified collaborative engineering workspace featuring live WebSocket broadcast channels, optimistic UI state synchronizers, Mongoose ODM relational integrity, role-based token auth, and a dual-frontend micro-client layout running concurrently in Docker.

---

## 🏛️ System Architecture

- **React Client (`react-client/`)**: Port `3000` (Members & Managers) — Kanban boards, collaborative notes, real-time presence indicators, project chat.
- **Angular Admin (`angular-admin/`)**: Port `4200` (Admins) — User CRUD, role assignments, audit logs, throughput charts using Signals, RxJS, and Chart.js.
- **Node.js Backend (`backend/`)**: Port `5000` — Express REST API combined with an authenticated Socket.IO server.
- **MongoDB (`mongo`)**: Port `27017` — Persistent document database with composite indexes.

---

## 🚀 Quick Start (Docker)

```bash
# 1. Start all services
docker-compose up --build -d

# 2. Seed initial admin and demo project
docker exec -it hub_backend npm run seed
```

### Default Seed Credentials
- 👑 **Admin**: `admin@projecthub.com` / `AdminPassword123!`
- 👔 **Manager**: `manager@projecthub.com` / `ManagerPassword123!`
- 🧑‍💻 **Member**: `member@projecthub.com` / `MemberPassword123!`
