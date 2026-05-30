# Deploy MyTeam Clone

## Recommended stack

| Service | Provider | Purpose |
|---------|----------|---------|
| Frontend | [Vercel](https://vercel.com) | React SPA |
| API | [Railway](https://railway.app) or Render | Node.js |
| Database | [Neon](https://neon.tech) | PostgreSQL |

## Backend (Railway / Render)

1. Connect GitHub repo, root: `backend/`
2. Build: `npm install`
3. Start: `npm run migrate && npm start`
4. Env vars:
   ```
   DATABASE_URL=postgres://...
   JWT_SECRET=<long-random-string>
   FRONTEND_URL=https://your-app.vercel.app
   NODE_ENV=production
   PORT=5000
   ```
5. Optional Stripe:
   ```
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

## Frontend (Vercel)

1. Root: `frontend/`
2. Build: `npm run build`
3. Output: `dist`
4. Env:
   ```
   VITE_API_URL=https://your-api.railway.app
   ```

## Mobile (Expo EAS)

```powershell
cd mobile
eas build --platform android
```

Set `EXPO_PUBLIC_API_URL` to production API URL.

## Health check

```
GET https://your-api/health
→ { "status": "ok", "db": "connected" }
```

## Docker (self-host)

```powershell
docker compose up --build -d
```

Update `VITE_API_URL` in `docker-compose.yml` for production domain.

## Post-deploy checklist

- [ ] Run migrations
- [ ] Change default passwords
- [ ] Enable HTTPS only
- [ ] Configure CORS origin (restrict in production)
- [ ] Set up Sentry (`SENTRY_DSN`) — optional
- [ ] Stripe webhook URL → `/billing/webhook`
