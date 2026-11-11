# RankWorld AI — Vercel production deployment

This repository produces one website origin with two integrated application areas:

- `/` — RankWorld AI student workspace (the former My Study Desk dashboard/PWA)
- `/rankvault/` — the original React/Vite RankVault testing and AI experience, rebranded as RankWorld AI

## Vercel project settings

Import this repository from GitHub into Vercel and use:

- Framework preset: Vite
- Root directory: `.`
- Install command: `npm ci --include=optional`
- Build command: `npm run build`
- Output directory: `dist`
- Production branch: `main`

The included `vercel.json` contains these settings. Static assets are intentionally left to Vercel's filesystem routing; broad rewrites are avoided because they can return the SPA HTML in place of JavaScript/CSS chunks.

## Required environment variables

Add the Firebase web configuration from `.env.example` to Vercel Project Settings → Environment Variables. These are browser Firebase configuration values, not admin secrets. Also set `VITE_FIREBASE_APPCHECK_SITE_KEY` for production App Check.

Never add Firebase service-account JSON, `AI_CONFIG_ENCRYPTION_KEY`, AI provider API keys, Supabase service-role keys, database passwords, or Razorpay secrets to Vercel's `VITE_*` variables or GitHub.

## Backend services currently retained

- RankWorld test/AI experience: Firebase Auth, Firestore, Storage, Cloud Functions.
- Former My Study Desk cloud sync: existing Supabase Auth and database.

The applications are delivered from one domain, but the two identity stores and data models have **not** been merged. A true single-account migration requires authenticated access to the live Firebase and Supabase projects, an export/backup, UID mapping, data transformation, import, and end-to-end verification. Do not disable either old auth provider until that is completed.

## Launch gate

Do not announce a public production launch until:

1. GitHub Actions passes clean install, unit tests, lint, and production build.
2. Vercel preview deployment serves `/`, `/rankvault/`, and their JS/CSS assets correctly.
3. Firebase App Check, Authentication, Functions secrets, rules, indexes, and admin claim are configured and tested in staging.
4. Supabase URL/publishable key, schema, auth redirect URLs, and RLS are verified.
5. Signup, password reset, account permissions, AI jobs, question-answer secrecy, CBT scoring, credits, and cross-device sync pass end-to-end tests.
6. Payments remain disabled until order creation, webhook signature verification, credit fulfillment, refunds, and subscription lifecycle are implemented and tested.

GitHub/Vercel account connection and deployment must be completed by an owner who can authorize access. No account transfer or live deployment is performed by building this ZIP.
