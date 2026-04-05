# AI Agent Handoff

> Workspace root: /Users/rummanahmed/Dropbox/Dev/PROJECT/CODE/_MY_PROJECT/JOB_HUNTER
> Last updated: 2026-04-05
> Last agent: Claude Code (Opus 4.6, Ship It + Wrap Up)
> Last machine: Rummans-MacBook-Pro

## Production
- Frontend: https://app-job-hunter.vercel.app (Vercel, auto-deploys from `main`)
- API: https://api-job-hunter.onrender.com (Render, auto-deploys from `main`)
- Preview: https://app-job-hunter-git-test-knoflers-projects.vercel.app

## What was done this session
- **Ship It**: Committed, pushed, and merged all pending changes across 3 repos
  - API PR #17: API versioning (`/api/v1/*`), structured JSON logging, enhanced health checks, request logging middleware
  - App PR #22: User guide screenshot support, AI framework sync
  - Docker PR #4: AI framework sync
- **LLM key blocker closed**: DeepSeek ConnectError was office firewall (PH11911), not code. Removed from blockers.
- All CI passed, production frontend verified (200), API redeploying on Render

### Previous session:
- **Bug/Feature Sprint #3 — 1 bug fixed, 6 features implemented**
  - Bug: JD content not displaying — fixed `div`/`whitespace-pre-line` → `pre`/`whitespace-pre-wrap`
  - Feature: Delete → Archive button with archive icon on job role tiles
  - Feature: Company name moved above title on job role tile cards
  - Feature: Recruiters dashboard now shows all metrics (companies, candidates, bugs, features)
  - Feature: Assessment job dropdown shows Company Name prefix
  - Feature: Company filter moved to leftmost position with "Company Name" label
  - Feature: Company filter displays with label and increased text size
- **Roadmap seeded**: 22 items across Q1-Q4 2026 to production API
- **DMARC DNS record generated**: user needs to add TXT `_dmarc` to Vercel DNS
- All DB statuses updated: 1 bug → solved, 6 features → solved
- App PRs #20 + #21 merged to main — production deploying via Vercel
- Follow-up #21: Copilot review fixes (unused import, a11y, nullish coalesce)
- 1 feature deferred: User guide screenshots (needs actual app screenshots)

### Previous session:
- **ConnectHub Discovery Document** — comprehensive 13-section audit
- **Bug/Feature Sprint #2 — 2 bugs fixed, 13 features resolved**
- **Release notes seeded**: v1.0.0–v1.3.0
- **Live Status seeded**: 10 status updates
- **Email domain**: rummanahmed.com verified on Resend

## CRITICAL RULES (learned across sessions)
- **NEVER rotate/change ADMIN_API_KEY, LLM_SETTINGS_SECRET_KEY, or any secrets** unless user explicitly asks
- **Don't ask permission every step** — user prefers autonomous execution
- **Resend API key**: set in Docker .env and Render — do NOT rotate
- **Email domain**: rummanahmed.com verified, notifications@rummanahmed.com is the sender
- **Dashboard bug pattern**: always use Next.js proxy routes (fetch("/api/...")) not fetchFromApi on client components — fetchFromApi resolves to remote backend on Vercel but can't inject admin token from browser

## Priority actions for next session
1. ~~Fix LLM API keys~~ CLOSED — DeepSeek was office firewall (PH11911), not a code bug. Works from home. OpenAI key refresh deferred
2. Add DMARC DNS record to Vercel DNS (record generated, user action): TXT `_dmarc` → `v=DMARC1; p=none; rua=mailto:dmarc@rummanahmed.com; pct=100; adkim=r; aspf=r`
3. Add `RENDER_DEPLOY_HOOK_URL` to API repo GitHub secrets (user action)
4. User guide screenshots (needs actual app screenshots)
5. API versioning
6. Monitoring/APM

## Docker local dev
- Compose project: `job-hunter-docker` (from folder name)
- Container names: `job-hunter-app`, `job-hunter-api`, `job-hunter-mongo`, `job-hunter-selenium`
- NO bind mounts (Dropbox breaks them) — services use built images
- After code changes: `cd job-hunter-docker && docker compose up -d --build`
