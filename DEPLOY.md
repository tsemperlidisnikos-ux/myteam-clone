# Deploy MyTeam Clone

## Γρήγορη εκκίνηση (τοπικά)

```bat
start.bat          REM Backend + Frontend
start.bat all      REM + Mobile Expo
stop.bat           REM Stop
```

- Web: http://localhost:5173  
- API: http://localhost:5000/health  

---

## GitHub Push + CI

```bat
git remote add origin https://github.com/YOUR_USER/myteam-clone.git
push-github.bat
```

GitHub Actions (`.github/workflows/ci.yml`) τρέχει:
- backend tests + migrate
- frontend build
- Playwright E2E (με `npm run seed:ci`)

---

## Recommended production stack

| Service | Provider | Purpose |
|---------|----------|---------|
| Frontend | [Vercel](https://vercel.com) | React SPA |
| API | [Railway](https://railway.app) | Node.js (`backend/railway.toml`) |
| Database | [Neon](https://neon.tech) | PostgreSQL |

Env templates:
- `backend/.env.production.example`
- `frontend/.env.production.example`

---

## Backend (Railway)

1. New project → Deploy from GitHub → **Root directory: `backend/`**
2. Add PostgreSQL plugin ή σύνδεσε Neon `DATABASE_URL`
3. Variables (copy από `.env.production.example`):

```env
DATABASE_URL=postgres://...?sslmode=require
JWT_SECRET=<32+ random chars>
FRONTEND_URL=https://your-app.vercel.app
NODE_ENV=production
PORT=5000
```

4. Start: `npm run migrate && npm start` (ήδη στο `railway.toml`)
5. Health: `GET /health` → `{ status, db, services: { email, stripe } }`

### Email (production)

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxx
SMTP_FROM=noreply@yourclub.gr
```

Χωρίς SMTP: invites/reset γράφουν στο log (dev mode).

### Stripe (optional Pro)

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Webhook URL: `https://your-api.railway.app/billing/webhook`

---

## Frontend (Vercel)

1. Import repo → **Root: `frontend/`**
2. Framework: Vite · Build: `npm run build` · Output: `dist`
3. Env:

```env
VITE_API_URL=https://your-api.railway.app
```

4. `vercel.json` — SPA rewrites included

---

## Mobile (Expo EAS)

`mobile/.env`:

```env
EXPO_PUBLIC_API_URL=https://your-api.railway.app
```

```powershell
cd mobile
eas login && eas init
npm run build:android
```

Δες `mobile/START.md` και `mobile/eas.json`.

---

## Docker (self-host)

Production stack (nginx + API + Postgres):

```powershell
docker compose up --build -d
```

- Frontend: http://localhost:8080  
- API: http://localhost:5000  

Dev frontend (hot reload):

```powershell
docker compose --profile dev up frontend-dev backend db
```

---

## Parent self-registration

1. Admin/coach ανοίγει προφίλ αθλητή → **Κωδικός γονέα**
2. Στέλνει link/code στον γονέα
3. Γονέας: `/register-parent?code=XXXX` ή link από login

---

## Post-deploy checklist

- [ ] `npm run migrate` on production DB
- [ ] `/health` → `db: connected`
- [ ] Login on Vercel URL
- [ ] `FRONTEND_URL` = exact Vercel domain (CORS)
- [ ] SMTP tested (forgot password)
- [ ] Stripe webhook (if billing)
- [ ] Change demo passwords
- [ ] CI green on GitHub

---

## E2E tests

```powershell
cd backend
npm run migrate
npm run seed:ci

cd ../frontend
npm run test:e2e
```

CI credentials: `ci@myteam.local` / `ci123456`

Local override:

```env
PLAYWRIGHT_EMAIL=...
PLAYWRIGHT_PASSWORD=...
```

Tests: login, calendar, messages, **create training**, **send DM**, parent register page.
