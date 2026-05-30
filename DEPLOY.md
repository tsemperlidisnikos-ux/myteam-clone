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

## GitHub Push

```bat
git remote add origin https://github.com/YOUR_USER/myteam-clone.git
push-github.bat
```

Αν το default branch είναι `main`:

```powershell
git branch -M main
git push -u origin main
```

---

## Recommended production stack

| Service | Provider | Purpose |
|---------|----------|---------|
| Frontend | [Vercel](https://vercel.com) | React SPA |
| API | [Railway](https://railway.app) or Render | Node.js |
| Database | [Neon](https://neon.tech) | PostgreSQL |

---

## Backend (Railway / Render)

1. Connect GitHub repo — root directory: `backend/`
2. Build command: `npm install`
3. Start command: `npm run migrate && npm start`
4. Environment variables:

```env
DATABASE_URL=postgres://user:pass@host/db?sslmode=require
JWT_SECRET=<long-random-string-min-32-chars>
FRONTEND_URL=https://your-app.vercel.app
NODE_ENV=production
PORT=5000
```

Optional email (password reset, invites):

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=noreply@yourclub.gr
```

Optional Stripe:

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

5. Health check URL: `/health`

---

## Frontend (Vercel)

1. Import GitHub repo — root: `frontend/`
2. Framework: Vite
3. Build: `npm run build`
4. Output directory: `dist`
5. Environment variable:

```env
VITE_API_URL=https://your-api.railway.app
```

6. `vercel.json` is included for SPA routing.

---

## Mobile (Expo)

Production API in `mobile/.env`:

```env
EXPO_PUBLIC_API_URL=https://your-api.railway.app
```

Build with EAS:

```powershell
cd mobile
npx eas build --platform android
```

Local dev: `npm start` (see `mobile/START.md`).

---

## Docker (self-host)

```powershell
docker compose up --build -d
```

Edit `docker-compose.yml` — set `VITE_API_URL` and `DATABASE_URL` for your domain.

---

## Post-deploy checklist

- [ ] `npm run migrate` on production DB
- [ ] `GET /health` returns `{ "status": "ok", "db": "connected" }`
- [ ] Login works on Vercel URL
- [ ] CORS: `FRONTEND_URL` matches Vercel domain exactly
- [ ] Change default / demo passwords
- [ ] Stripe webhook → `https://your-api/billing/webhook`
- [ ] Optional: SMTP for real invite/reset emails

---

## E2E tests (CI or local)

```powershell
cd frontend
npm run test:e2e
```

Uses test user (override with env):

```env
PLAYWRIGHT_EMAIL=admin@example.com
PLAYWRIGHT_PASSWORD=yourpassword
```
