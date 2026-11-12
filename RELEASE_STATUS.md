# RankWorld AI — release status

## What this package contains
- RankWorld AI React/Vite application is the primary UI at `/`.
- My Study Desk is not the primary UI, homepage, or separate destination; selected capabilities are integrated into RankWorld AI's design.
- Original RankVault React components, services, Firebase Functions, Firestore rules/indexes, Storage rules and AI provider integration retained.
- Vercel selected as the website host; GitHub Actions CI is configured.
- Product-facing brand text updated to RankWorld AI.
- Vercel builds the RankWorld AI Vite application directly to `dist/`.

## Checks completed in this workspace
- `node --test functions/test/*.test.js`: PASS (7/7).
- `node --check` across JavaScript files under `src`, `functions`, and `scripts`: PASS (JSX excluded from Node's parser).
- `node --check scripts/assemble-site.js`: PASS.
- JSON parsing for package manifests, lockfile, Firebase/Vercel config, indexes and PWA manifest: PASS.
- ZIP archive integrity: PASS (verified with `ZipFile.testzip()` after packaging).

## Not verified / not completed
- Full Vite production build: not run successfully in this offline workspace because the required Linux Rolldown optional native package is unavailable and npm registry DNS/network access is blocked.
- ESLint: not rerun in this packaging workspace because dependencies are not installed here.
- Firebase Emulator or live staging tests: not run.
- Supabase staging tests: not run.
- GitHub repository connection: not performed; no repository URL or authorization was provided.
- Vercel project connection or production deployment: not performed; no Vercel authorization was provided.
- Single visible login: source code now uses the existing My Study Desk Supabase Auth session as the primary sign-in and exchanges a verified Supabase token for a Firebase custom token. Existing RankVault Firebase UID is reused by matching confirmed email, which is intended to preserve Firestore records. This bridge is implemented in source but not yet deployed or tested against live Supabase/Firebase projects. My Desk data remains in Supabase and RankVault data remains in Firebase; this is one login, not a full database consolidation.
- Firebase/Supabase project ownership, domain, secrets and email/account transfer: not performed.
- Payments: fulfillment is intentionally disabled. Do not collect payment for plans until order creation, verified webhooks, credit/subscription fulfillment, refunds and lifecycle handling are implemented and tested.

## Required before public production launch
1. Push this source to the intended GitHub repository and require the included Actions workflow to pass.
2. Import the repository into Vercel with root `.`, build `npm run build`, output `dist`.
3. Configure Firebase web settings and App Check site key in Vercel; configure `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` for Functions and AI/payment secrets only in Firebase Secret Manager; deploy the `exchangeSupabaseToken` function.
4. Deploy Firebase Functions, Firestore rules/indexes and Storage rules to the correct existing project.
5. Verify Supabase project URL, publishable key, schema, redirect URLs and RLS policies.
6. Run end-to-end tests for signup, email verification, password reset, AI job execution, answer secrecy, CBT scoring, credits, admin authorization and workspace sync.
7. Test the Supabase-to-Firebase token bridge with an existing Firebase email and a new Supabase email; verify existing Firestore UID/data is preserved and new profiles provision correctly. Preserve backups before enabling for real users.
8. Keep paid checkout disabled until the payment flow is production-safe.

The product direction is RankWorld-first. This is **not a certified production-ready release**. A ZIP alone cannot connect GitHub/Vercel accounts, configure live secrets, migrate production user identities, or verify a live deployment.
