# MyTeam Mobile — γρήγορο start

## 1. Backend (πρέπει να τρέχει ΠΡΙΝ το Expo)

```powershell
cd C:\MTclone\backend
npm run dev
```

## 2. Mobile

```powershell
cd C:\MTclone\mobile
npm start
```

Σκάναρε QR με **Expo Go** (Play Store / App Store).

## Αν ΔΕΝ ανοίγει στο κινητό

### A) Tunnel mode (πιο εύκολο — bypass Wi‑Fi/firewall)

```powershell
cd C:\MTclone\mobile
npm run start:tunnel
```

Περίμενε το QR «Tunnel» και σκάναρέ το ξανά.

### B) Έλεγξε API URL

Το `.env` πρέπει να έχει **IP του PC**, όχι localhost:

```
EXPO_PUBLIC_API_URL=http://192.168.2.19:5000
```

Βρες IP: `ipconfig` → IPv4 (Wi‑Fi).

Μετά άλλαξε IP στο `.env` και κάνε restart το Expo (`Ctrl+C` → `npm start`).

### C) Windows Firewall (συχνό πρόβλημα)

Άνοιξε **PowerShell ως Administrator** και τρέξε:

```powershell
netsh advfirewall firewall add rule name="MyTeam API 5000" dir=in action=allow protocol=TCP localport=5000
netsh advfirewall firewall add rule name="Expo Metro 8081" dir=in action=allow protocol=TCP localport=8081
```

### D) Ίδιο Wi‑Fi

Το κινητό και ο PC πρέπει να είναι στο **ίδιο δίκτυο** (όχι mobile data).

### E) Expo Go έκδοση

Project: **Expo SDK 52** — χρειάζεσαι **τελευταία Expo Go** από store.

---

## Login

- Email: `nikos.tseberlidis@gmail.com`
- Password: `123456`
