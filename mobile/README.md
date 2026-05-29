# MyTeam Mobile (planned)

Future **React Native / Expo** app for coaches on the court.

## Planned features

- Training attendance (quick tap)
- Match stats entry
- Push notifications for announcements
- Offline-first attendance sync

## API

Uses the same backend as the web app (`http://localhost:5000` in dev).

Auth: `POST /auth/login` → JWT in secure storage.

## Getting started (when implemented)

```bash
npx create-expo-app myteam-mobile
# Point API base URL to backend
# Reuse endpoints: /trainings, /matches, /communication
```

See root [README.md](../README.md) for backend setup.
