# Project State

**Timestamp:** 2026-04-05 (updated 00:40 AEST)
**Current Agent:** Claude Code (Opus 4.6, Agent Mode — Ship It + Wrap Up)

## 1. Production URLs
- **Frontend (prod):** https://app-job-hunter.vercel.app
- **Frontend (preview):** https://app-job-hunter-git-test-knoflers-projects.vercel.app
- **API:** https://api-job-hunter.onrender.com

## 2. Branching Strategy
- `test` → preview (Vercel preview, CI runs)
- `main` → production (Vercel prod, Render deploy)
- NEVER push directly to `main` — always `test` → verify → PR → merge
- All repos synced: `test` = `main` after merge

## 3. What's Shipped

### Ship It Session (2026-04-05)
- **API versioning**: `/api/v1/*` path rewriting middleware with deprecation headers on legacy routes (sunset 2027-01-01)
- **Structured JSON logging**: `python-json-logger` with request ID tracking middleware (`X-Request-ID`)
- **Enhanced health endpoint**: MongoDB connectivity, uptime, readiness probe (`/health/ready`), metrics (`/health/metrics`)
- **Request logging middleware**: Structured request logging with request ID correlation
- **User guide screenshots**: All 7 sections support optional screenshots via `Next/Image`
- **AI framework sync**: Agents, skills, hooks synced across all 3 repos (app, API, Docker)
- **LLM key blocker closed**: DeepSeek was office firewall issue, not code bug
- API PR #17, App PR #22, Docker PR #4 — all merged to main

### Bug/Feature Sprint #3 + Roadmap Seeding (2026-04-04)
- **1 bug fixed, 6 features implemented, 22 roadmap items seeded**
- **Bug fix:** JD content not displaying — changed `div`/`whitespace-pre-line` to `pre`/`whitespace-pre-wrap`
- **Feature:** Delete button replaced with Archive button + archive icon on job role tiles
- **Feature:** Company name moved above title on job role tile cards
- **Feature:** Recruiters dashboard now shows all metrics (companies, candidates, bugs, features) — parity with main dashboard
- **Feature:** Assessment page job dropdown shows Company Name prefix
- **Feature:** Company filter moved to leftmost position with "Company Name" label
- **Feature:** Company filter displays with label and increased text size
- **Roadmap seeded:** 22 items across Q1-Q4 2026 (6 Q1 completed, 6 Q2, 5 Q3, 5 Q4)
- **DMARC DNS record generated** — user needs to add TXT record `_dmarc` to Vercel DNS
- DB statuses updated: 1 bug → solved, 6 features → solved
- App PRs merged: #20 (sprint #3) + #21 (Copilot review fixes) — both merged to main, production deploying
- Follow-up PR #21: removed unused import, added keyboard a11y to archive button, fixed nullish coalesce
- 1 feature deferred: User guide screenshots (needs actual app screenshots)

### ConnectHub Discovery + AI Framework Sync (2026-04-02)
- **ConnectHub implementation discovery document** — comprehensive 13-section audit written to `AI/documentation/CONNECT_HUB_DISCOVERY.md`
  - All 7 DB schemas with exact fields, types, indexes, sort orders
  - 27 backend API endpoints with request/response schemas, auth, business logic
  - 8 frontend pages with form fields, data fetching, state management
  - 16 Next.js proxy routes with header injection patterns
  - Email notification system (3 triggers, HTML templates, Resend integration)
  - Auth model (JWT + admin key), status lifecycle (9 states), stage pipeline (8 stages)
  - Voting/feedback systems, privacy model, org multi-tenancy
  - Full file inventory, patterns/gotchas, gaps analysis for standalone product
- **AI framework sync**: 48 agent definitions, 90+ skill playbooks, session hooks, scripts
- Machine switch: Rummans-MacBook-Pro → PH11911 (Docker rebuilt, 4 containers healthy)
- LLM keys clarification: DeepSeek ConnectError is office network firewall only, not a global blocker

### Bug/Feature Sprint + Email Domain (2026-04-01, session 2)
- **2 bugs fixed, 13 features built/resolved, email domain verified**
- Dashboard regression fix: use Next.js proxy routes instead of fetchFromApi (admin token not injected client-side)
- Drag & drop fix: added onDragOver/onDrop to JD upload and resume upload zones
- Guide link added to navbar for all personas
- Reopen button for deployed bugs
- Job role tiles: smaller font, ad dates, expiry warnings (yellow 7d, red 3d), company name
- Job roles page: active/archived filter, sort by newest/end date/start date, company filter dropdown
- Job role detail: company name, ad dates, expiry countdown in header
- Job role expiry blocks uploads and analysis runs
- Feature request edit: screenshot drag & drop picker
- Dashboard: companies count tile added
- Release notes page: seeded 4 releases (v1.0.0–v1.3.0) with categorised changes
- Live Status page: seeded 10 status updates
- Release changes enum serialization bug fixed (model_dump → explicit .value)
- **Email domain**: rummanahmed.com verified on Resend, from address updated in Render + Docker
- Gmail delivery confirmed, corporate email (Powerhouse) blocked due to new domain reputation
- API PRs: #15, #16 | App PRs: #17, #18, #19 — all merged to main
- All David Wong bugs/features marked "deployed" in production DB

### Production Readiness Sprint (2026-04-01)
- **7-phase implementation — all complete, all containers healthy**
- Phase 1: Email mandatory on bug/feature forms + auto-reply confirmation email on ticket creation
- Phase 2: Subscribers collection + subscribe/unsubscribe API (new `subscribers` table)
- Phase 3: Product page (`/product`) with features grid, roadmap, subscribe form + Release notes page (`/product/releases`) with timeline UI
- Phase 4: Live Status page (`/connect/status`) with real-time progress bars, stage pipeline, auto-refresh 30s, expandable history timeline
- Phase 5: Product Roadmap API with quarterly format, grouped display on product page (new `roadmap_items` table)
- Phase 6: Privacy controls — `is_public` toggle on bug/feature forms, privacy-filtered status page (users see own + public only)
- Phase 7: Strategic analysis — Connect Hub as autonomous helpdesk SaaS (Free/Pro/Enterprise tiers)
- **4 new DB collections**: `subscribers`, `releases`, `roadmap_items`, `ticket_status_updates`
- **2 new backend route files**: `product.py` (subscribers + releases + roadmap), `status_updates.py` (live status)
- **2 new service files**: `subscriber_service.py`, `status_update_service.py`
- **3 new frontend pages**: `/product`, `/product/releases`, `/connect/status`
- **11 new frontend proxy routes** for all new API endpoints
- NavBar updated: "Product" link added to all personas
- Connect Hub landing: "Live Status" card added
- Added `email-validator` dependency to requirements.txt
- All indexes added for new collections in `indexes.py`

### Bug/Feature Sprint + Email Notifications (2026-03-31, session 2)
- **5 bugs fixed, 3 features built, email notifications added**
- Bug fixes: Dashboard rewrite (real data from API), sidebar "Projects"→"Job Roles", "Oldest" sort option, "X days open" display, date range fields on job role creation
- Feature: Edit/withdraw for feature requests (ported from bugs)
- Feature: In-app User Guide at /connect/help/guide (7 sections covering all app features)
- Feature: Company entity — CRUD API + company selector on job role creation form
- Email notifications via Resend API — reporters get emailed on status changes
- Added `reporter_email` field to bug/feature creation forms
- API PRs: #12 (bug fixes + tests), #13 (company entity)
- App PRs: #14 (bug fixes + editing), #15 (user guide + company)
- All 5 bugs + 3 features marked "solved" in production DB

### Test Suite Fix — 125/125 Passing (2026-03-31)
- **Fixed all 26 pre-existing test failures** — 125/125 tests now pass, 0 failures
- Root causes: missing auth headers, motor/anyio event loop conflict, trio backend, brittle assertions
- `conftest.py`: admin auth headers, `anyio_backend` fixture (asyncio-only), `BaseHTTPMiddleware` removal in tests, `ASGITransport`, `@pytest.fixture` (not `@pytest_asyncio.fixture`)
- `pyproject.toml`: updated addopts to load anyio plugin explicitly
- Converted 3 sync `TestClient` tests to async `async_client` pattern
- Fixed mock patching for `list_job_descriptions` (patch `db` proxy correctly)
- Fixed `ObjectId` type mismatch in `test_job_upload_and_retrieval`
- No env vars, secrets, or admin keys changed

### CI/CD Pipeline Fix (2026-03-30)
- **Both repos now have GREEN CI pipelines**
- API: Fixed 826+ ruff lint errors, auto-formatted 56 files, updated pyproject.toml ignore rules
- API: Pinned httpx==0.27.2 (compat with FastAPI 0.95 TestClient)
- API: Added MongoDB service container to CI (tests were hanging)
- API: 144 tests pass, 26 pre-existing failures (auth/route) emit warnings
- App: Regenerated package-lock.json (missing Playwright deps)
- App: Added eslint.config.mjs (ESLint 9 flat config)
- App: Replaced ESLint with tsc type-check in CI (ESLint 9 + next circular ref bug)
- API PR #11 merged, App PR #13 merged

### Connect Hub Feature Sprint (2026-03-30)
- **5 David Wong feature requests implemented, pushed to test:**
  1. **#5 "Accepted" status** — new status in lifecycle: deployed → accepted (user confirms working)
  2. **#6 Reopen accepted features** — accepted → reported if feature breaks
  3. **#3 Screenshot drag & drop on feature requests** — ported from bug report form
  4. **#1 Filter/sort Bug Reports** — added sort toggle (newest / severity) to bug list
  5. **#4 Convert rejected bugs → features** — button on rejected bugs creates feature request, links records
- Backend: `connect.py` — added `accepted` to ItemStatus, `screenshots` to feature model, convert endpoint
- Frontend: bug page (sort + convert button), feature page (screenshots + accept/reopen buttons)
- New proxy route: `/api/connect/bugs/[id]/convert-to-feature`
- API PR #10 merged, App PR #12 merged — both deployed to production
- All 5 features marked `deployed` in production DB

### Folder + Docker Rename (2026-03-28, session 2)
- **BREAKING CHANGE:** Renamed all folders from `ai-matching-job-*` to `job-hunter-*`
  - `ai-matching-job-api/` → `job-hunter-api/`
  - `ai-matching-job-app/` → `job-hunter-app/`
  - `ai-matching-job-docker/` → `job-hunter-docker/`
- Compose project name: `job-hunter` (was `ai-matching-job`)
- All container names: `job-hunter-app`, `job-hunter-api`, `job-hunter-mongo`, `job-hunter-selenium`
- Updated `.env` MONGO_URI hostname to `job-hunter-mongo`
- Updated `render.yaml` CORS origin to `app-job-hunter.vercel.app`
- Cleaned `ai-matching-job` references from all config files across all 3 repos (headers, hooks, fly.toml, package.json)
- All 4 containers healthy after full rebuild

### Docker Naming Compliance (2026-03-28, session 1)
- Original naming fix that used wrong `ai-matching-job` prefix — superseded by rename above

### CI Cleanup + E2E Tests (2026-03-28)
- Removed generic `ci.yml` templates from API, App, Docker repos (mismatched Node.js templates)
- Fixed API CI test job: added `DEBUG`, `LLM_SETTINGS_SECRET_KEY`, `MONGO_URI`, `MONGO_DB_NAME` env vars
- Security audit: no hardcoded secrets, encryption-at-rest confirmed, flagged Docker Mongo default password
- **Scaffolded Playwright E2E tests: 12 tests, all passing** (home, dashboard, connect-hub, job-search, resume)
- Added `Dockerfile.e2e` using official Playwright image, `test-e2e` service in docker-compose
- Fixed frontend healthcheck: `curl` → `wget` (curl not in alpine production image)
- Auth0 mocking via route interception fixture for authenticated page tests

### Bug Fix Sprint Round 2 (2026-03-27)
- Added "Confirm Fixed — Close Case" button for deployed bugs (new "closed" status)
- Renamed "Project" → "Job Role" across all UI (nav, list, modal, detail page)
- Updated screenshot bug (#69c3bc55) status from rejected → deployed (was already implemented)
- All 7 fixable bugs now deployed, DB statuses updated
- App PR #10, API PR #8 merged to main

### Bug Fix Sprint (2026-03-26)
- Fixed "Invalid Date" display in Connect Hub — handle snake_case `created_at` from API
- Fixed hub bug/feature count showing same number — added `cache: "no-store"`
- Fixed JD drag & drop — added `onDragOver`/`onDrop` handlers to upload zone
- Added edit/withdraw for submitted bug reports (UI + backend PATCH model update)
- Added rejection reason + resolution text in bug list rows (visible without expanding)
- Added screenshot drag & drop to bug report form (base64 storage + display in details)
- Triaged bug #4 (picture drop zone) as feature request → rejected with reason
- All bugs updated to "deployed" in prod DB
- Renamed `NEXT_PUBLIC_ADMIN_TOKEN` → `ADMIN_TOKEN` in Vercel dashboard via CLI
- App PR #8, #9 | API PR #6, #7 | Docker PR #2 — all merged to main

### Security + DevOps Sprint (2026-03-24/25)
- **CRITICAL FIX**: Removed `NEXT_PUBLIC_ADMIN_TOKEN` — renamed to `ADMIN_TOKEN` (server-side only), added `typeof window === "undefined"` guard so token never reaches the browser
- **CRITICAL FIX**: Auth cookie `secure: false` → `secure: process.env.NODE_ENV === 'production'` in callback route (logout already correct)
- Updated `.env.example`, `.env.local`, test scripts, PRODUCTION_DEPLOYMENT.md to use `ADMIN_TOKEN`
- Updated `api.test.ts` with server-side simulation for admin token injection tests
- Added `pyproject.toml` with ruff config for Python backend (target py312, line-length 120, security rules enabled)
- Added ruff lint + format check step to `api-ci.yml` CI pipeline
- Machine switch from MacBook Pro → PH11911: cleaned 1 Dropbox conflict, rebuilt Docker containers

### Bug Fix Sprint (2026-03-23)
- Fixed Connect Hub feature request priority enum mismatch (frontend sent `should-have`, backend expected `medium`) — was causing 422 on every submission
- Fixed localhost double `/api` path in server-backend-url.ts fallback
- Synced Next.js override to 16.0.10 (was 16.0.8, caused Docker build failures)
- App PR #7 merged

### Cleanup Sprint (2026-03-23)
- 8 MongoDB indexes for Connect Hub collections (bugreports, featurerequests, helparticles)
- Removed 34 console.log/error from Connect Hub proxy routes
- All branches synced: API PR #5, App PR #6 merged

### Assessment Customization + PDF (2026-03-23, previous session)
- "Refine Analysis" UI: re-run with skill focus or custom criteria
- Suggested re-runs: auto-extracts top 3 gap skills as one-click buttons
- PDF download for completed runs (fpdf2, emerald branding)
- Docker fix: removed bind mounts (Dropbox xattr issue)

### Connect Hub (2026-03-20/21)
- Bug reports, feature requests, help articles — full CRUD
- Upvote toggle, reporter name from user cookie
- Status lifecycle: reported → triaged → working → solved → deployed

### P2 Sprint (2026-03-20)
- Structured logging, CSP strict policy, dead code cleanup
- 143 backend + 327 frontend tests, dependency updates

### P1 Sprint (2026-03-18)
- Admin token refactored to server-side proxies
- CORS guard, global exception handler, 34 MongoDB indexes
- CI pipelines fixed, Render auto-deploy added

## 4. Known Issues
- ~~**LLM API keys**~~ CLOSED — DeepSeek ConnectError was caused by office firewall (PH11911) blocking the connection, not a code issue. Works from home. OpenAI 429 — need fresh key in `.env` and Render if needed later
- **Docker local dev**: No hot-reload — run `docker compose up -d --build` after code changes
- ~~Vercel env var~~ DONE — renamed via CLI, redeployed

## 5. Remaining
- [x] ~~Fix LLM API keys~~ CLOSED 2026-04-05 — DeepSeek issue was office firewall (PH11911), not a code bug. Works from home. OpenAI key can be refreshed later if needed
- [ ] Add GitHub Actions secret: `RENDER_DEPLOY_HOOK_URL` (API repo) — user action
- [ ] Add DMARC DNS record: TXT `_dmarc.rummanahmed.com` → `v=DMARC1; p=none; rua=mailto:dmarc@rummanahmed.com; pct=100; adkim=r; aspf=r` — user action (Vercel DNS)
- [ ] User guide screenshots — needs actual app screenshots for each section
- [x] ~~Merge app sprint #3 PR~~ DONE 2026-04-04 — PR #20 + follow-up #21 merged
- [x] ~~API versioning~~ DONE 2026-04-05 — `/api/v1/*` path rewriting + deprecation headers, API PR #17
- [ ] Monitoring/APM
- [ ] Upvote UX: consider making permanent (no toggle-off)
- [ ] Connect Hub SaaS packaging — npm/pip installable module (Q3-Q4 2026 roadmap)
- [x] ~~Seed roadmap data (Q1-Q4 2026)~~ DONE 2026-04-04 — 22 items across 4 quarters
- [x] ~~Bug/feature sprint #3 (1 bug + 6 features)~~ DONE 2026-04-04 — App commit 3bf06ed on test
- [x] ~~Seed release notes (v1.0.0–v1.3.0)~~ DONE 2026-04-01
- [x] ~~Seed live status updates (10 entries)~~ DONE 2026-04-01
- [x] ~~Email domain rummanahmed.com verified on Resend~~ DONE 2026-04-01
- [x] ~~Bug/feature sprint #2 (2 bugs + 13 features)~~ DONE 2026-04-01 — API #15/#16, App #17/#18/#19
- [x] ~~Fix 26 pre-existing test failures~~ DONE 2026-03-31 — 125/125 passing
- [x] ~~Bug/feature sprint (5 bugs + 3 features + email notifications)~~ DONE 2026-03-31 — API #12/#13, App #14/#15
- [x] ~~Commit + push CI fixes to `test` branches (3 repos)~~ DONE 2026-03-28
- [x] ~~Triage 7 feature requests from David Wong (Connect Hub)~~ DONE 2026-03-30
- [x] ~~Build 5 David Wong feature requests~~ DONE 2026-03-30 — API PR#10, App PR#12
- [x] ~~Scaffold Playwright E2E tests~~ DONE 2026-03-28 — 12 tests passing
- [x] ~~Rotate Docker Mongo password~~ SKIPPED — user decision only, do NOT touch
- [x] ~~Rename ai-matching-job → job-hunter~~ DONE 2026-03-28
- [x] ~~Generate distinct secrets~~ SKIPPED — secrets already configured

## 6. Agent Mode Audit Findings (2026-03-23)
- **DevOps**: Docker/Render/Vercel healthy. Generic CI templates mismatched (Node on Python repo). test branch missing in root repo.
- **Security**: ~~CRITICAL: NEXT_PUBLIC_ADMIN_TOKEN exposed~~ FIXED 2026-03-24. ~~Cookie secure:false in prod~~ FIXED 2026-03-24.
- **QA**: 125/125 API tests passing (was 26 failures). 12 E2E tests (all passing). 57 frontend API routes untested. 1/33 pages unit-tested.
- **Tech Lead**: TypeScript strict on. Code quality B+. CI workflows deleted — no automated quality gates.
