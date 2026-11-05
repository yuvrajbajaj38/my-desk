# My Desk — cloud version

## Included
- `index.html` — My Desk dashboard
- `config.js` — Supabase Project URL + publishable key
- `schema.sql` — private user data table and Row Level Security policies
- `manifest.json`, `sw.js` — installable PWA shell

## Setup (do these in order)
1. In Supabase, open **SQL Editor** → **New query**.
2. Paste all of `schema.sql` and click **Run**.
3. In Supabase **Authentication → URL Configuration**, add your eventual GitHub Pages site URL to **Site URL** and **Redirect URLs**. You can do this after GitHub Pages is enabled.
4. Upload all files in this folder to the root of your GitHub repository `my-desk`.
5. In GitHub repository **Settings → Pages**, choose **Deploy from a branch**, branch `main`, folder `/ (root)`, then Save.
6. Open the published GitHub Pages URL. Create a My Desk account with email/password, then sign in.
7. On iPhone, open the same published URL in Safari, sign in with the same account, then Share → Add to Home Screen.

## Important data behavior
- First successful sign-in on the laptop uploads the local browser data if the cloud table has no row for this account.
- When a cloud row already exists, the app loads that cloud data on sign-in.
- Use the same account on both devices.
- Keep using Export backup in the Backlog Manager as an extra backup.
- This simple version syncs after edits and when you press **Sync now**. Avoid editing on both devices at exactly the same time.

## Security
- `config.js` contains only the Supabase publishable key, which is intended for browser use.
- Never add a Supabase secret key, service_role key, database password, or personal data to GitHub.
- `schema.sql` enables Row Level Security and restricts each account to its own row.
