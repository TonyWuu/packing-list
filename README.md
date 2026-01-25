# Packing List

A progressive web app to track what you need to pack for trips. Add items when you forget something, and over time build the perfect packing list.

## Features

- Google Sign-In authentication
- User-defined categories and trip types
- Filter items by trip type (non-matching items are grayed out)
- Share read-only view with travel companions
- PWA - installable on mobile home screen
- Dark mode support
- Real-time sync across devices via Firebase

## Setup

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project (or use existing)
3. Enable **Authentication** → Sign-in method → Google
4. Enable **Firestore Database** in production mode
5. Add your domain to authorized domains (Settings → Authorized domains)

### 2. Configure Firebase

1. In Firebase Console, go to Project Settings → Your apps → Add web app
2. Copy the config values
3. Create `.env` file from the example:

```bash
cp .env.example .env
```

4. Fill in your Firebase config values in `.env`

### 3. Set Firestore Security Rules

In Firebase Console → Firestore → Rules, paste the contents of `firestore.rules`

### 4. Install and Run

```bash
npm install
npm run dev
```

### 5. Deploy to GitHub Pages

```bash
npm run build
```

Push the contents of `dist/` to your GitHub Pages branch, or configure GitHub Actions:

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

Add your Firebase config values as repository secrets in GitHub.

## PWA Icons

Replace `public/icon.svg` with your own icon. You can generate PNG icons at various sizes using tools like:
- https://realfavicongenerator.net/
- https://maskable.app/editor

## Usage

1. Sign in with Google
2. Go to Settings to customize your categories and trip types
3. Add items to your list, optionally tagging them with trip types
4. When packing for a trip, filter by trip type to see relevant items
5. Check off items as you pack
6. Click "Reset All" when starting a new trip
7. Share a read-only link with travel companions if needed
