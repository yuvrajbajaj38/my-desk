# RankWorld AI — admin setup

## 1. Firebase Authentication
1. Open Firebase Console → Authentication → Sign-in method.
2. Enable **Email/Password**. Google provider is no longer used by the app.
3. Set the authorized domains for your production and preview deployments.

## 2. Free-trial abuse protection
- New profiles and free credits are created by the trusted `registerStudentAccount` Cloud Function, not by browser code.
- A server-only `deviceFreeTrials` record allows one free trial per stable browser fingerprint. Repeated email signups from the same browser/device are rejected before a second free credit grant.
- This is a friction/abuse control, not proof of physical-device identity. Fingerprints can change or be spoofed. Enable Firebase App Check for the web app and monitor suspicious signup patterns before launching publicly.
- Firebase App Check is enforced on account registration and AI job callables. In Firebase Console → App Check, register the web app with reCAPTCHA v3. Put the public site key in Vercel as `VITE_FIREBASE_APPCHECK_SITE_KEY` and in local `.env.local` if testing locally. Configure authorized domains and deploy the frontend with that site key before deploying/enabling these Functions. Requests without a valid App Check token will be rejected. Do not remove enforcement for a public production deployment.
- Firebase Authentication email enumeration protection and reasonable password/rate-limit controls should remain enabled.

## 3. Seed platform configuration before allowing registrations
Use a trusted machine with Firebase Admin Application Default Credentials and access to the intended Firebase project:

```bash
npm install
npx firebase use <your-firebase-project-id>
node scripts/init-platform.js
```

This creates `creditConfig/default` with the initial 50 free credits and default pricing. Existing values are preserved. This document must exist before the first signup because Firestore rules validate the configured initial credit balance.

## 4. Grant administrator access
First create and verify the intended admin account using the normal email signup flow. Then, from the trusted machine:

```bash
node scripts/set-admin.js verified-admin@example.com
```

Sign out and sign in again. Do not grant admin claims to student accounts. Never put service-account JSON files in the repository.

## 5. Configure AI key encryption and deploy Firebase backend

Generate a 32-byte random encryption key (64 hex characters), then save it as a Firebase Functions secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
npx firebase functions:secrets:set AI_CONFIG_ENCRYPTION_KEY
npx firebase deploy --only firestore:rules,functions
```

After the first admin account is provisioned, the Admin Panel accepts the provider API key and sends it to a protected callable. The callable encrypts it with AES-256-GCM before writing it to the server-only `privateConfig/ai` document. Keep `AI_CONFIG_ENCRYPTION_KEY` backed up securely. Rotating it requires re-saving the provider key. The AI key must be saved from Admin Panel after the admin account is provisioned. Never put either secret in `.env`, `VITE_*`, source code, or GitHub. For OpenAI-compatible mode, the default endpoint/model are OpenAI's chat-completions endpoint and `gpt-4o-mini`; custom mode requires a base URL entered in Admin Panel.

## 6. Vercel
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Set the `VITE_FIREBASE_*` environment variables from `.env.example` in Vercel.
- Do not upload `.env.local`, service-account credentials, or any secret key.

## Important limitations inherited from the source
- Razorpay payment fulfillment is deliberately disabled (`PAYMENT_BUSINESS_RULES_READY = false`). The editable plan values do not mean purchases/subscriptions are ready; checkout will reject orders until payment fulfillment, webhook crediting, refunds, and subscription lifecycle rules are implemented and tested.
- The admin list shows the first 50 Firebase Auth users; pagination/search is not yet implemented.
- Existing Firebase data/backend is retained. This package does not migrate RankVault to Supabase or merge it into the My Desk application automatically.


## Release verification status

The latest local review passed ESLint across the frontend and setup scripts, Node.js syntax checks for Firebase Functions and setup scripts, JSON configuration checks, relative import checks, and ZIP integrity validation. The Vite production build has **not** been verified in this environment: the supplied dependency archive is missing the Linux Rolldown native binding, and npm registry access timed out while trying to retrieve it. The GitHub Actions workflow runs `npm ci`, `npm run lint`, and `npm run build` on a clean Linux runner. Treat the release as deployable only after that workflow passes.

Razorpay payment fulfillment is intentionally disabled (`PAYMENT_BUSINESS_RULES_READY = false`). Do not advertise paid checkout as active until payment capture, webhook verification, subscription lifecycle, refunds, and credit fulfillment have been tested end-to-end.
