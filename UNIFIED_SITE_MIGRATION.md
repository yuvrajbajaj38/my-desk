# RankWorld AI — primary application architecture

## Product direction
- RankWorld AI is the primary product and the only primary UI.
- The existing RankWorld AI React/Vite application is served at `/`.
- My Study Desk is not the homepage, shell, or separate product destination.
- Reuse selected My Study Desk capabilities inside RankWorld AI's existing visual system: study planner, lecture tracking, backlog planning, daily targets, tasks, quick notes, calculator, and progress tracking.
- Keep RankWorld AI's existing landing page, authentication flow, student dashboard, mock tests, CBT, question bank, notes AI, leaderboard, and admin tools.

## Build and routing
- Vercel builds the root Vite application directly to `dist/` using `npm run build`.
- Do not copy the standalone My Study Desk HTML shell over `dist/index.html`.
- Legacy `/my-study-desk` URLs redirect to `/`.
- Do not introduce a separate `/rankvault/` primary app path.

## Data safety
- Preserve existing Firebase and Supabase data and accounts.
- Integrate features through explicit adapters and user-scoped persistence. Do not silently overwrite, migrate, or delete production records.
- Any cross-backend identity/data migration requires backups, mapping, staging tests, and explicit sign-off.
