# Android Self-Use APK

This project can be packaged as a personal Android APK with Capacitor.

## 1. Set production API URL

Create `frontend/.env.production.local` with your deployed backend URL:

```env
VITE_API_BASE_URL=https://your-render-service.onrender.com/api
```

## 2. Allow Android WebView origins in the backend

Set Render `FRONTEND_URL` to a comma-separated list that includes:

```env
http://127.0.0.1:3000,https://your-frontend.vercel.app,http://localhost,https://localhost
```

## 3. Install Capacitor packages

From `frontend/`:

```bash
npm install
```

## 4. Create the Android project

From `frontend/`:

```bash
npx cap add android
```

## 5. Sync the web build into Android

```bash
npm run android:sync
```

## 6. Open Android Studio

```bash
npm run android:open
```

## 7. Build a debug APK for personal use

In Android Studio:

`Build` -> `Build Bundle(s) / APK(s)` -> `Build APK(s)`

The debug APK is usually created under:

`frontend/android/app/build/outputs/apk/debug/`

## Notes

- This setup packages the local Vite production build into the Android app.
- The app still talks to your deployed Render backend and Supabase project.
- Render free tier cold starts can make the first request feel slow after inactivity.
