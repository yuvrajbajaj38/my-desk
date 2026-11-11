# RankWorld AI — unified website architecture

## Selected stack
- Website hosting and deployment: Vercel
- Source control and CI: GitHub
- RankVault student testing/AI backend: existing Firebase Auth, Firestore, Storage and Cloud Functions
- Existing workspace cloud sync: existing Supabase Auth and database

## One site origin
- `/` serves the existing student workspace/PWA, branded RankWorld AI.
- `/rankvault/` serves the original React/Vite test and AI application, also branded RankWorld AI.
- Vite builds the React application to `dist/rankvault/`; `scripts/assemble-site.js` copies the workspace shell to `dist/`.

## Important boundary
This is one deployable website and one brand, but not yet one identity/database. The workspace currently signs users in with Supabase; the test/AI application signs users in with Firebase. They have separate user identifiers, sessions and data. A safe true account migration needs access to both live projects, backups, a user-ID mapping strategy, migration scripts, data reconciliation, and staging sign-off. No production data has been moved by this package.

## Hosting
Deploy the repository from GitHub to Vercel using root `.`, `npm ci --include=optional`, `npm run build`, and output directory `dist`. See `VERCEL_DEPLOYMENT.md`.

## Preserve old services until verified
Do not delete the existing Firebase or Supabase projects, disable their auth providers, rotate production secrets, or remove old account owners until backups and new-owner access are verified. No password/OTP sharing or security bypass is needed or appropriate.
