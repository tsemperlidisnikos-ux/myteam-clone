# MyTeam Clone

Sports club management web app (teams, athletes, trainings, matches, analytics, calendar, messaging).

## Stack

- **Backend:** Node.js, Express, PostgreSQL, JWT
- **Frontend:** React 19, Vite, React Router
- **Mobile:** Expo (`mobile/`) — login, attendance, match stats
- **Docker:** `docker-compose.yml`

## Quick start

```powershell
# Backend
cd backend
copy .env.example .env
npm install
npm run migrate
npm run seed
npm run dev

# Frontend
cd frontend
npm install
npm run dev

# Mobile (phone)
cd mobile
npm install
npm start
```

- Web: http://localhost:5173
- API: http://localhost:5000
- Health: http://localhost:5000/health

## Features

| Area | Notes |
|------|--------|
| **Calendar** | Month grid + list view |
| **Messages** | Announcements, notifications, DM |
| **Analytics** | KPIs, trends, CSV export |
| **Roles** | Admin / coach / athlete UI |
| **Auth** | Forgot password, reset link (dev logs URL) |
| **Settings** | Logo upload (admin), dark mode |
| **Mobile** | Trainings attendance + match PTS |
| **Billing** | Stripe scaffold (`/billing/:clubId/status`) |

## Roles

| Role | Access |
|------|--------|
| **admin** | Full + Staff + logo upload |
| **coach** | Staff operations, no admin panel |
| **athlete** | Own profile, view-only stats/scores |

## Tests

```powershell
cd backend
npm test
```

## Deploy

See [DEPLOY.md](DEPLOY.md) — Vercel + Railway + Neon.

## Mobile on phone

See [mobile/START.md](mobile/START.md) — LAN IP + firewall rules.

## GitHub

```powershell
git remote add origin https://github.com/YOUR_USER/myteam-clone.git
git push -u origin main
```

## SaaS (future)

Stripe Checkout + webhooks — scaffold in `backend/src/routes/billing.routes.js`.
