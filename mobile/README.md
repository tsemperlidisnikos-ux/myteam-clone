# MyTeam Mobile (Expo)

Minimal **React Native / Expo** app for coaches — login, training list, attendance marking.

## Setup

```powershell
cd mobile
npm install
# Point to your machine IP (not localhost on physical device)
$env:EXPO_PUBLIC_API_URL="http://192.168.x.x:5000"
npm start
```

Press `a` for Android emulator or scan QR with Expo Go.

## Features

- Login with club account
- List trainings for first team
- Mark attendance (present / absent / late)

## API

Same backend as web (`backend/`). Endpoints used:

- `POST /auth/login`
- `GET /teams/:clubId`
- `GET /trainings/:clubId?team_id=`
- `GET /trainings/:clubId/:trainingId/attendance`
- `POST /trainings/:clubId/:trainingId/attendance`

See root [README.md](../README.md) for backend setup.
