# MyTeam Clone

Sports club management — teams, athletes, trainings, matches, analytics, calendar, messaging, parent portal, mobile.

## Stack

- **Backend:** Node.js, Express, PostgreSQL, JWT
- **Frontend:** React 19, Vite
- **Mobile:** Expo SDK 52 (`mobile/`)
- **CI:** GitHub Actions + Playwright E2E
- **Deploy:** Vercel + Railway + Neon (see [DEPLOY.md](DEPLOY.md))

## Quick start (Windows)

```bat
setup-all.bat        REM deps + migrate + tests (first time)
start.bat            REM backend + frontend
start.bat all        REM + mobile
stop.bat
auth-github.bat      REM GitHub login + push (once)
push-github.bat      REM push only (after auth)
```

Manual:

```powershell
cd backend && copy .env.example .env && npm i && npm run migrate && npm run dev
cd frontend && npm i && npm run dev
```

- Web: http://localhost:5173  
- API: http://localhost:5000/health  

## Features

| Area | Notes |
|------|--------|
| **Roles** | Admin, coach, athlete, **parent** |
| **Parent portal** | `/my-children`, scoped trainings/matches |
| **Parent self-reg** | Code from athlete profile → `/register-parent` |
| **Calendar** | Grid + list |
| **Messages** | Announcements, notifications, DM |
| **Mobile** | Attendance, match stats, offline queue |
| **Billing** | Stripe scaffold |
| **i18n** | Greek UI (`frontend/src/i18n/el.js`) |
| **PWA** | Service worker |
| **Dark mode** | Settings toggle |

## Tests

```powershell
cd backend
npm test

cd ../frontend
npm run test:e2e
```

CI seed (for E2E / GitHub Actions):

```powershell
cd backend
npm run seed:ci
```

## Deploy & GitHub

```bat
git remote add origin https://github.com/YOUR_USER/myteam.git
push-github.bat
```

Full guide: [DEPLOY.md](DEPLOY.md)

Production env templates:
- `backend/.env.production.example`
- `frontend/.env.production.example`

## Docker

```powershell
docker compose up --build -d    REM frontend :8080, API :5000
```

## Mobile

See [mobile/START.md](mobile/START.md) — LAN IP, tunnel, EAS builds.

Test login (dev): `nikos.tseberlidis@gmail.com` / `123456`
