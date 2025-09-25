# 📦 Zenexis Tracking

A mobile application for **parcel tracking and field logistics**, built with **Expo**, **React Native**, **TypeScript**, and **Expo Router**.  
Designed to simplify parcel creation, management, and real-time logistics workflows.

---

## 🚀 Quick Access

- 🎥 **Demo Video:** [Watch on YouTube](https://youtube.com/shorts/5pg4EINtt8A?feature=share)  
- 📱 **Download APK (Android):** [Zenexis Tracking v1.0.0](https://expo.dev/artifacts/eas/5HTvfXrTDv8CKvD3QgyAHh.apk)

---

## ✨ Features

- 🔐 **Authentication** – Secure login with token storage  
- 📦 **Parcel Management** – Create and manage tracking numbers, receivers, and addresses  
- 🧭 **Navigation** – Expo Router with auth group and tab layout  
- 🚪 **Logout Handling** – Clears tokens and resets navigation reliably  
- 🎨 **UI Styling** – TailwindCSS / NativeWind for utility-first design  

---

## 🛠 Tech Stack

- **Framework:** Expo (React Native) + TypeScript  
- **Navigation:** Expo Router  
- **State Management:** React Context + Hooks  
- **Styling:** TailwindCSS with NativeWind  
- **API Layer:** Custom fetch wrapper with typed services  
- **Secure Storage:** `expo-secure-store`

---

## 📋 Prerequisites

Before running the app, ensure you have:

- Node.js ≥ 18  
- Git  
- Android Studio (for emulator) and/or Xcode (for iOS simulator on macOS)  
- Expo account *(optional but recommended for EAS builds)*  

---

## ⚙️ Installation & Setup

### 1) Clone & Install

```bash
# Clone repository
git clone https://github.com/Chathura0607/Zenexis_Tracking.git
cd Zenexis_Tracking

# Install dependencies
npm install
# or: pnpm install / yarn install
```

### 2) Configure Environment

The app requires an API base URL for parcel endpoints.

#### Option A: Simple (`app.json`)

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

#### Option B: Dynamic (`app.config.ts` + `.env`)

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

Create a `.env` file:

```env
API_BASE=https://api.yourdomain.com
```

---

## ▶️ Running the App

```bash
# Start development server
npx expo start
```

Open the app in:

- 📱 **Expo Go** (scan QR code)  
- 🤖 **Android Emulator** (`a` in terminal)  
- 🍏 **iOS Simulator** (`i` in terminal, macOS only)  

---

## 📂 Project Structure

```
.
├─ app/                     # Screens (Expo Router)
│  ├─ (auth)/               # Auth flow (Login/Signup)
│  └─ (tabs)/               # App tabs
│     └─ parcels/
│        └─ add.tsx         # Add Parcel screen
├─ components/              # Shared UI components
├─ contexts/                # React Context providers
│  └─ AuthContext.tsx
├─ hooks/                   # Custom hooks
├─ services/                # API services (fetch wrapper, parcels)
├─ types/                   # TypeScript types
├─ assets/                  # Images & assets
├─ navigation/              # Navigation helpers
├─ app.json | app.config.ts # Expo config
├─ tailwind.config.js
├─ tsconfig.json
└─ eslint.config.js
```

---

## 📱 Using the App

### 🔑 Authentication
- Log in → token stored securely via `expo-secure-store`.  
- Navigation automatically switches from `(auth)` → `(tabs)`.

### ➕ Adding a Parcel
1. Navigate to **Parcels → Add**.  
2. Fill in:
   - Tracking Number  
   - Receiver Name  
   - Address *(required)*  
   - Notes *(optional)*  
3. Submit to create the parcel.

### 🚪 Logout
- Available from **Settings → Log out**.  
- Tokens cleared, navigation resets to login flow.

---

## 📡 API Contract

### Create Parcel

`POST /parcels`

**Request:**
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

## 🧑‍💻 Development Scripts

```bash
# Start dev server
npm run start

# Type checking
npm run typecheck

# Lint with auto-fix
npm run lint -- --fix

# Reset cache if stuck
npx expo start -c
```

---

## 🏗️ Building with EAS

```bash
# Login to Expo
eas login

# Configure
eas build:configure

# Build Android
eas build -p android

# Build iOS
eas build -p ios
```

---

## 🐞 Troubleshooting

- ❌ **Stuck on caching** → `npx expo start -c`  
- 🌐 **Network request failed** → Ensure `API_BASE` is correct and reachable  
- 🔒 Always prefer HTTPS for API endpoints  

---

## 📬 Contact

Maintained by **[Chathura Lakmina](https://github.com/Chathura0607)**.  
For issues, open a [GitHub Issue](https://github.com/Chathura0607/Zenexis_Tracking/issues).

---
