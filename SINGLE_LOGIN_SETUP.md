# RankWorld AI — single Supabase login

## What is unified
- The My Study Desk workspace at `/` and RankVault application at `/rankvault/` use the **same Supabase Auth account** for visible sign-in, sign-up, password reset and sign-out.
- The RankVault frontend exchanges the signed-in Supabase access token with the Firebase HTTPS function `exchangeSupabaseToken`.
- The function asks the Supabase Auth API to validate the access token and require a confirmed email, and returns a Firebase custom token.
- When the verified email already exists in Firebase Auth, the existing Firebase UID is reused. This is important because RankVault Firestore documents are keyed by that UID. A new email receives a Firebase UID equal to the Supabase user UUID.

## Important architecture boundary
This is **single sign-in**, not a database replacement. My Study Desk's tasks/backlog/notes remain in Supabase. RankVault profiles, tests, credits, artifacts and related records remain in Firebase. The browser sees one Supabase login; the Firebase custom token is a server-issued compatibility session for the existing RankVault backend. Do not delete Firebase or its data.

## One-time deployment setup

1. In Supabase, keep email confirmation enabled. Set **Authentication → URL Configuration → Site URL** to the deployed RankWorld origin and add both the origin and `https://YOUR_DOMAIN/rankvault/` to Redirect URLs.
2. In `functions/.env`, set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` to the same existing Supabase project values. The publishable key is public; never use a service-role/secret key here.
3. Install and deploy Functions from the repository root:

   ```bash
   cd functions
   npm install
   cd ..
   firebase deploy --only functions
   ```

4. In Vercel, set the existing RankVault Firebase web config variables (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_FUNCTIONS_REGION`) and App Check site key. Keep the existing Supabase project URL and publishable key in the source's public config or corresponding `VITE_SUPABASE_*` variables.
5. Deploy the Vercel project and test: existing Supabase user with matching Firebase email, brand-new Supabase user, email verification, password reset, logout, My Desk sync, RankVault profile provisioning, test creation/submission and Firestore security rules.

## Existing-account behavior
- Existing Firebase Auth user with the same confirmed email: its Firebase UID is reused, so existing Firestore data stays attached.
- Existing My Study Desk Supabase user: signs in normally with the same Supabase credentials.
- New Supabase user: after email confirmation, first RankVault sign-in provisions the Firebase-side student profile through the existing trusted function.
- A user who has different emails in the two systems will not be automatically merged. Resolve those identities deliberately before deleting or disabling any old account.

## Rollback
Keep the previous GitHub branch, Firebase project, Supabase project and all existing records. Do not delete either provider or its data as part of the frontend replacement. If the exchange function or staging tests fail, roll back the Vercel deployment and restore the previous GitHub commit.

## Verification status
The source implementation and backend unit tests are included in this package. The live Firebase secret, deployed exchange function, Vercel environment variables, Supabase redirect settings and end-to-end account flows must still be configured and tested in the owner's projects. This ZIP cannot perform those account-level actions by itself.
