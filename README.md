# Zenexis Tracking (Expo + TypeScript)

A mobile app for parcel tracking and field logistics built with **Expo**, **React Native**, **TypeScript**, and **Expo Router**.

> 🎥 **Quick demo:** [YouTube Short](https://youtube.com/shorts/5pg4EINtt8A?feature=share)

---

## Features

- 🔐 Auth flow with secure token storage
- 📦 Create & manage parcels (tracking number, receiver, address, notes)
- 🚪 Reliable logout that clears state and resets navigation
- 🧭 Expo Router navigation (auth group + app tabs)
- 🎨 Tailwind/NativeWind styling (utility-first)

---

## Tech Stack

- **App:** Expo (React Native), TypeScript, Expo Router  
- **State:** React Context + Hooks  
- **Styling:** Tailwind/NativeWind  
- **API Layer:** Fetch wrapper with typed services  
- **Secure Storage:** `expo-secure-store`

---

## Prerequisites

- Node.js ≥ 18
- Git
- Android Studio (for Android emulator) and/or Xcode (for iOS Simulator on macOS)
- Expo account (optional but recommended for EAS builds)

---

## 1) Clone & Install

```bash
# Clone
git clone https://github.com/Chathura0607/Zenexis_Tracking.git
cd Zenexis_Tracking

# Install deps
npm install
# or: pnpm install / yarn
```

---

## 2) Configure Environment

The app expects an API base URL for parcel endpoints.

### Option A: `app.json` (simple)
Edit `app.json`:

```json
{
  "expo": {
    "name": "Zenexis Tracking",
    "slug": "zenexis-tracking",
    "extra": {
      "API_BASE": "https://api.yourdomain.com"
    }
  }
}
```

### Option B: `app.config.ts` (dynamic)
Create `app.config.ts` to read from environment variables:

```ts
import 'dotenv/config';

export default {
  expo: {
    name: "Zenexis Tracking",
    slug: "zenexis-tracking",
    extra: {
      API_BASE: process.env.API_BASE
    }
  }
};
```

Then create a `.env`:

```env
API_BASE=https://api.yourdomain.com
```

---

## 3) Run the App

```bash
# Start the dev server
npx expo start
```

Open it in:

- **Expo Go** (scan QR code)  
- **Android emulator** (press `a`)  
- **iOS Simulator** (press `i` on macOS)

---

## 4) Common Scripts

```bash
# Dev server
npm run start

# Typecheck
npm run typecheck

# Lint (fix)
npm run lint -- --fix

# Clear Metro/Expo cache if stuck
npx expo start -c
```

---

## Project Structure

```
.
├─ app/                     # Expo Router screens
│  ├─ (auth)/               # Login/Signup screens
│  └─ (tabs)/               # App tabs
│     └─ parcels/
│        └─ add.tsx         # Add Parcel screen
├─ components/              # Reusable UI
├─ contexts/
│  └─ AuthContext.tsx       # Auth provider (token, login, logout)
├─ hooks/
├─ services/
│  ├─ http.ts               # Fetch wrapper (API_BASE, errors)
│  └─ parcels.ts            # Parcel service (create, list)
├─ types/
├─ assets/
│  └─ images/
├─ navigation/
│  └─ navigationRef.ts      # Imperative nav reset helper
├─ app.json | app.config.ts # Expo configuration + extra.API_BASE
├─ tailwind.config.js
├─ tsconfig.json
└─ eslint.config.js
```

---

## Using the App

### Authentication
- Log in to obtain a token (stored via `expo-secure-store`).
- The navigation swaps from `(auth)` to `(tabs)` automatically.

### Add a Parcel
- Go to **Parcels → Add**.
- Provide **Tracking Number**, **Receiver Name**, **Address** (required), plus optional notes.
- Press **Add Parcel** to submit.

### Logout
- From **Settings**, tap **Log out**.
- Tokens are deleted; navigation resets to the auth stack.

---

## API Contract

`POST /parcels`  
**Body:**
```json
{
  "trackingNumber": "ZX-123456",
  "receiverName": "Jane Doe",
  "address": "221B Baker Street, London",
  "notes": "Leave at reception",
  "weightKg": 1.25
}
```
**Response:**
```json
{
  "id": "abc123",
  "trackingNumber": "ZX-123456",
  "receiverName": "Jane Doe",
  "address": "221B Baker Street, London",
  "notes": "Leave at reception",
  "weightKg": 1.25,
  "createdAt": "2025-09-10T10:11:12.000Z"
}
```

---

## Troubleshooting

- Run `npx expo start -c` if stuck on caching.  
- For “Network request failed”, ensure `API_BASE` is reachable.  
- Prefer HTTPS APIs.  

---

## Building (EAS)

```bash
eas login
eas build:configure

# Build
eas build -p android
eas build -p ios
```

---
