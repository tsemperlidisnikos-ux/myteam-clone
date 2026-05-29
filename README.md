# MyTeam Clone

Sports club management web app (teams, athletes, trainings, matches, analytics).

## Stack

- **Backend:** Node.js, Express, PostgreSQL, JWT
- **Frontend:** React 19, Vite, React Router
- **Mobile:** placeholder (`mobile/README.md`)

## Prerequisites

- Node.js 18+
- PostgreSQL 14+

## Setup

### 1. Database

Create a database named `myteam` (or update `DATABASE_URL`).

```powershell
cd backend
copy .env.example .env
# Edit .env with your PostgreSQL password
npm install
npm run migrate
npm run seed   # optional demo data
npm run dev
```

API runs at http://localhost:5000

### 2. Frontend

```powershell
cd frontend
npm install
npm run dev
```

App runs at http://localhost:5173

## Demo data

After registering a club, run:

```powershell
cd backend
npm run seed
```

Creates U16/U18 teams, 4 athletes, trainings, attendance, and a sample match with stats.

## Roles

| Role | Access |
|------|--------|
| **admin** | Full access + Staff page |
| **coach** | Trainings, matches, attendance, roster, announcements |
| **athlete** | View own announcements/notifications |

Create coaches at **Staff → + Add Coach** (admin only).

## GitHub backup

```powershell
git remote add origin https://github.com/YOUR_USER/myteam-clone.git
git branch -M main
git push -u origin main
```

## Project structure

```
backend/     API + migrations + seed script
frontend/    React SPA
mobile/      Future mobile app
```

## Common commands

| Command | Location | Description |
|---------|----------|-------------|
| `npm run migrate` | backend | Run DB migrations |
| `npm run seed` | backend | Load demo data |
| `npm run dev` | backend / frontend | Start dev server |
