# PillTime

Stupid-easy local pill reminders for iOS and Android.

Add a pill, pick the time and days, choose how long (**Keep reminding me** / until a date / for N days), and get reminders on time and 5 minutes early. Tap **Taken** or **Skip** on Today.

## Stack

- Expo (dev client) + Expo Router
- Unistyles v3
- Zustand + AsyncStorage (local only)
- expo-notifications

## Run (Android)

Unistyles needs a **development build** (not Expo Go):

```bash
npm install
npx expo prebuild
npm run android
```

Or with EAS:

```bash
npx eas build --profile development --platform android
npx expo start --dev-client
```

iOS project files are kept for later; build on a Mac when you have one.

## App map

- **Today** — what to take now
- **My pills** — list / edit
- **Add pill** — name → time → days → how long → reminders
- **Settings** — allow notifications
