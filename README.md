# RankWorld AI

Student platform for JEE/NEET practice: mock tests, notes extraction, question bank, backlog planner, and results.

## Local development

1. Copy `.env.example` to `.env.local`.
2. Fill `VITE_FIREBASE_*` with the Firebase **web** config (this is public client config, not an AI secret).
3. Copy `functions/.env.example` to `functions/.env` for local Functions configuration. Do not add an API key to either file.
4. Install and run:

```bash
npm install
npm run dev
```

Never put AI provider keys, `AI_CONFIG_ENCRYPTION_KEY`, Razorpay secrets, or service-account credentials in Vite env files.

## Production backend and AI provider key

```bash
firebase login
firebase use <your-firebase-project-id>
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
firebase functions:secrets:set AI_CONFIG_ENCRYPTION_KEY
firebase deploy --only firestore:rules,functions
```

The secret must be a 64-character hexadecimal string generated from 32 random bytes. Back it up securely. After creating and verifying your admin account and granting the `admin: true` custom claim, use the Admin Panel to choose the provider, model, optional base URL, and save the provider API key. The callable encrypts the key with AES-256-GCM before storing it in a server-only Firestore document. The browser never reads the stored key.

Provider options:
- `gemini` — defaults to Gemini `generateContent` and `gemini-3.1-flash-lite`.
- `openai` — defaults to OpenAI-compatible chat completions and `gpt-4o-mini`.
- `custom` — requires a custom endpoint URL in Admin Panel.

For local emulation, use non-secret provider settings in `functions/.env`; do not put API keys there. Rotate the provider key from Admin Panel. If the encryption secret is rotated, re-save the provider API key.

Razorpay secrets are not required while payment business rules remain unapproved. Payment fulfillment stays disabled.

## Hosting on Vercel

Import this GitHub repository into Vercel. Use the root directory `.`, install command `npm ci --include=optional`, build command `npm run build`, and output directory `dist`. See `VERCEL_DEPLOYMENT.md`. Firebase remains a backend provider for the original RankVault features; Vercel is the selected website host.

## Scripts

- `npm run lint`
- `npm run build`

## Email authentication and Admin Panel

- Student accounts use Firebase Email/Password authentication, email verification, and password reset. Enable **Email/Password** in Firebase Console → Authentication → Sign-in method.
- Admin routes and callable functions require the Firebase Auth custom claim `admin: true`; a client cannot grant itself admin access.
- Create the first admin only from a trusted machine with Firebase Admin Application Default Credentials: `node scripts/set-admin.js verified-admin@example.com`. Sign out and back in after granting the claim.
- Admin Panel controls the free signup credit amount, plan prices/credit quantities, AI provider/model/base URL, and encrypted AI API key. New registrations read the server-managed `creditConfig/default` value (fallback 50).
- The Admin Panel sends an API key only to an admin-claim-protected callable. The key is encrypted server-side with AES-256-GCM and stored in a Firestore collection that client rules deny to all users.
- Student account listing/disable/enable and settings updates run through admin-claim-protected Cloud Functions.

## Deploy

This is a Vite + React project. In Vercel, use Root Directory `.` (or the folder containing this `package.json`), Build Command `npm run build`, and Output Directory `dist`. Set the `VITE_FIREBASE_*` variables from `.env.example` in Vercel. Deploy Firebase rules and Functions separately with `firebase deploy --only firestore:rules,functions` after configuring Firebase project access and secrets.

**Important existing limitation:** payment fulfillment is intentionally disabled in the source (`PAYMENT_BUSINESS_RULES_READY = false`). Admin-editable pricing is displayed and used to form payment-order amounts if payments are later enabled, but checkout will continue to reject orders until the payment/subscription fulfillment rules are completed and tested.


## Free-trial protection
New student profiles and free-credit grants are provisioned server-side. A server-only device fingerprint claim prevents repeated free-trial claims from the same browser/device fingerprint. This reduces casual multi-email abuse but is not a guaranteed physical-device identity; configure Firebase App Check before public launch. See `ADMIN_SETUP.md`.


## Production gate

Before public launch, require a green GitHub Actions run (clean `npm ci`, lint, Vite build, and Functions syntax checks), configure Firebase App Check reCAPTCHA v3 and Firebase Auth email/password, deploy Firestore rules and Functions, seed platform settings, provision the verified admin custom claim, and run a staging signup/credit/AI smoke test. Paid checkout is not enabled; keep it hidden or clearly labelled unavailable until payment fulfillment is implemented. See `ADMIN_SETUP.md` and `RELEASE_STATUS.md`.


## Unified My Study Desk site
RankWorld AI's React/Vite application is the primary UI at `/`. My Study Desk is not the homepage or a separate destination. Selected study-workspace capabilities are being integrated into RankWorld AI's existing design. Run `npm run build` to build the RankWorld AI app directly. See `UNIFIED_SITE_MIGRATION.md`.


## Existing account/data boundary
- Preserve existing RankWorld AI Firebase accounts and records.
- Any optional Supabase-backed study feature must use a verified, user-scoped integration; do not replace RankWorld AI's primary UI or auth without a tested migration plan.
- No production data migration is implied by the UI integration.

### Required one-time server setup
1. Install Functions dependencies: `cd functions && npm install`.
2. Set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in `functions/.env` to the existing Supabase project values. The publishable key is public; never use a service-role/secret key.
3. Deploy Functions: `firebase deploy --only functions`.
5. Ensure Supabase email confirmation is enabled and configure Site URL / Redirect URLs for the deployed RankWorld domain.
6. Configure Vercel `VITE_FIREBASE_*` values and deploy. Keep the Supabase publishable key public; never use service-role key in Vercel frontend variables.

The exchange endpoint validates the bearer token directly with Supabase Auth (`/auth/v1/user`), so it supports the signing method already configured in the existing Supabase project.
