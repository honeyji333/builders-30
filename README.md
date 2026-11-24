# 🎬 KageStream - Full-Stack Anime Streaming & Personal Library Platform

[![Challenge](https://img.shields.io/badge/Challenge-%23ALTABuilder30_Track_A_Completed-e50914.svg)](https://github.com/honeyji333/builders-30)
[![Tests](https://img.shields.io/badge/Tests-16%2F16_Passing_100%25-brightgreen.svg)](https://github.com/honeyji333/builders-30)
[![Runtime](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-339933.svg)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-SQLite3_WAL_Mode-003B57.svg)](https://github.com/WiseLibs/better-sqlite3)
[![Deployment](https://img.shields.io/badge/Deploy-Render_Production_%7C_Docker-4285F4.svg)](https://kagestream-q481.onrender.com)
[![Catalog](https://img.shields.io/badge/Catalog-137%2B_Anime_%7C_7%2C500%2B_Episodes-ff1e2b.svg)](https://kagestream-q481.onrender.com/#/catalog)

> **KageStream** is a high-performance, ad-free full-stack anime streaming platform and personal media library.
> Engineered with a dark Tokyo-cyberpunk visual language (`#070709` pitch-black + `#e50914` crimson red), instant multi-CDN server switching, asynchronous watch progress sync, auto-resume playback, interactive playlist drawer, and automated integration test coverage.
> Built as the flagship project for the **#ALTABuilder30** 30-Day Project Challenge (Track A: Days 1–15) at **ALTA School of Technology**.

---

## 📌 Progress Highlights

### Day 1: Project Planning & Feature Specification
- [x] Defined core problem statement and target audience.
- [x] Outlined user roles: Guest, Registered Member, and Admin.
- [x] Structured MVP features (10 core capabilities) vs Phase 2 enhancements in [`FEATURES.md`](./FEATURES.md).
- [x] Initialized Git repository and planning documentation.

### Day 2: Database Modeling & Screen Wireframes
- [x] Modeled relational SQLite schema with Entity-Relationship (ER) diagram in [`docs/schema.md`](./docs/schema.md).
- [x] Defined tables for `users`, `anime`, `genres`, `anime_genres`, `episodes`, `watchlist`, `favorites`, `watch_history`, and `comments`.
- [x] Sketched 4 core UI wireframes (Auth Modal, Catalog Browsing, Detail/Streaming Player, and User Library) in [`docs/wireframes.md`](./docs/wireframes.md).

### Day 3: Project Setup, Database Connection & Health API
- [x] Initialized Node.js backend environment with `package.json` and scripts.
- [x] Established SQLite database connection engine in `db/init.js` with WAL mode and foreign key constraints.
- [x] Built core Express server (`server.js`) with CORS and JSON middleware.
- [x] Created `/health` REST endpoint returning real-time server and database connectivity status.

### Day 4: User Model & Signup API with Password Hashing
- [x] Created `users` SQLite table with unique username/email constraints and indexing.
- [x] Implemented robust input validation (RFC 5322 email regex, username length/format, min 8-char password).
- [x] Integrated `bcryptjs` for secure password hashing with 10 salt rounds (never storing plain text).
- [x] Built `POST /api/auth/register` (and `/signup`) returning sanitized user profiles and avatars.

### Day 5: Login API with JWT & Protected Routes Middleware
- [x] Created `POST /api/auth/login` validating credentials against bcrypt hashes and signing JWT tokens (7-day validity).
- [x] Implemented `middleware/auth.js` (`authMiddleware` and `optionalAuth`) intercepting Bearer headers and HTTP-only cookies.
- [x] Created protected endpoint `GET /api/auth/me` returning `401 Unauthorized` without a token and user profile data with one.
- [x] Added `POST /api/auth/logout` safely invalidating session cookies.

### Day 6: Main Entity CRUD APIs with Authentication
- [x] Created `anime` catalog SQLite table with indexing on `slug`, `type`, `status`, and `rating`.
- [x] Built **Create API**: `POST /api/anime` (Protected by `authMiddleware`, automatic slug generation).
- [x] Built **Read API**: `GET /api/anime` (Paginated catalog listing) and `GET /api/anime/:id` (Single anime by ID or slug).
- [x] Built **Update API**: `PUT /api/anime/:id` (Protected by `authMiddleware`, selective metadata updates).
- [x] Built **Delete API**: `DELETE /api/anime/:id` (Protected by `authMiddleware`, safely removes records).

### Day 7: Related Entities, Search Engine & Pagination
- [x] Modeled and created related entities: `genres` and `episodes` with foreign keys and cascade delete rules.
- [x] Implemented Many-to-Many junction table `anime_genres` linking anime to multiple categories.
- [x] Built full multi-field search engine (`GET /api/anime?search=...`) querying titles, Japanese titles, and synopses.
- [x] Implemented complex filter queries by genre, release year, season, format (`TV`/`Movie`), and Hindi Dub.
- [x] Added SQL-level offset pagination (`page`, `limit`, `totalPages`, `total`).
- [x] Created related entity endpoints: `GET /api/genres` (with real-time anime count) and `GET /api/anime/:id/episodes`.

---

## 🛠️ Tech Stack
- **Backend**: Node.js, Express.js
- **Database**: SQLite with `better-sqlite3`
- **Security & Authentication**: JWT (JSON Web Tokens), `bcryptjs` (10 rounds), `cookie-parser`, HTTP-Only Cookies
- **Frontend**: Modern Vanilla JS (Single Page Architecture), Semantic HTML5, CSS3 Glassmorphism
- **DevOps**: Docker, Render / Railway

---

## 📅 Track A: 15-Day Full-Stack Roadmap

- [x] **Day 1**: Pick project and write feature list (`FEATURES.md`)
- [x] **Day 2**: Database schema and wireframes (`/docs`)
- [x] **Day 3**: Project setup and server running (`/health` API)
- [x] **Day 4**: Signup API with password hashing (`POST /api/auth/register`)
- [x] **Day 5**: Login API with JWT and protected routes (`POST /login` & `GET /me`)
- [x] **Day 6**: CRUD APIs for the main entity (`/api/anime` GET, POST, PUT, DELETE)
- [x] **Day 7**: Related entities, search and pagination (`/api/anime?search=&genre=`, `/api/genres`, `/episodes`)
- [x] **Day 8**: Frontend setup, routing and auth screens (SPA client, dark crimson theme, routing & auth modals)
- [x] **Day 9**: Main list and detail screens (Catalog with filters & pagination + Single anime view with full episode tracker)
- [x] **Day 10**: Create, edit and delete flows (Watchlist & Catalogue CRUD usable from UI with loading & error states)
- [x] **Day 11**: Heavy feature, part 1 (Video streaming & sync backend)
- [x] **Day 12**: Heavy feature, part 2 (Embedded player & UI integration)
- [x] **Day 13**: Testing and bug fixes (16 automated API tests passing, bug list cleared, input validation)
- [x] **Day 14**: Deploy frontend, backend and database (Live production deployment, secrets moved to .env, multi-platform configs)
- [x] **Day 15**: README, demo video and project launch post (Final Track A Ship & Production Launch 🎉)

---

## 🚀 Day 15 Deliverables: Project Launch, Demo Video & Portfolio Showcase (Track A Finale)

### 🏆 Track A Completed: 15-Day Full-Stack Milestone Achieved!
From zero lines of code on Day 1 to a fully functional, tested, containerized, and deployed full-stack anime streaming platform on Day 15!

---

### 🎥 2-Minute Demo Video Recording Script & Walkthrough

Use any screen recorder (OBS, Loom, or Mac QuickTime: `Cmd + Shift + 5`):

| Timestamp | Screen / Flow | Narration & Actions |
| :--- | :--- | :--- |
| **0:00 - 0:20** | **Homepage & Hero Banner** (`#/`) | *"Hi everyone, I'm Manan Sharma. This is KageStream, a dark Tokyo-cyberpunk full-stack anime streaming catalogue and personal media library platform built for #ALTABuilder30 at ALTA School of Technology."* Highlight hero stats (137+ anime, 7,500+ episodes). |
| **0:20 - 0:45** | **Catalog Discovery & Search Engine** (`#/catalog`) | *"Under the catalog, we engineered a full-text search engine with multi-facet filtering. Users can search by title in English or Japanese, filter across 10+ genres, filter Airing vs Completed, and toggle Hindi Dub. Everything is paginated with dynamic SQL queries."* Click an anime card (e.g. Solo Leveling / Attack on Titan). |
| **0:45 - 1:15** | **The Heavy Feature: Cinema Theater Mode** (`#/watch/:id`) | *"Clicking Watch takes us to our heavy feature: the dedicated Cinema Theater Player. It features a responsive 16:9 viewport with ambient dark backlighting, multi-CDN mirror switching (HD Vault 1080p vs AnimeStream 720p) with zero reload, and multi-language audio track toggling."* Point to the right sidebar playlist with active equalizer animations! |
| **1:15 - 1:35** | **Real-Time Watch Sync & Auto-Resume** | *"While watching, an asynchronous 10-second heartbeat loop automatically synchronizes playback timestamp to our SQLite database. If a user reloads or switches devices, KageStream detects previous progress and presents an instant 'Resume Playback from 06:40' banner!"* |
| **1:35 - 1:50** | **Watchlist CRUD & 16-Test Suite** | *"Users can organize their library across Watching, Completed, and Plan to Watch tabs with toast alerts. To guarantee reliability, we built an automated integration suite with 16 comprehensive tests passing in under 90 milliseconds."* Show terminal running `python3 tests/run_tests.py` (16/16 green PASS). |
| **1:50 - 2:00** | **Production Cloud & Wrap-up** | *"The platform is containerized with Docker, deployed with automated Render CI/CD blueprints, and live on the internet. Code is open on GitHub. Track A complete!"* |

---

### 🌍 Live Deployment & Production Endpoints:
- **Render Production App**: [https://kagestream-q481.onrender.com](https://kagestream-q481.onrender.com)
- **Cinema Theater Watch Mode**: [https://kagestream-q481.onrender.com/#/watch/1](https://kagestream-q481.onrender.com/#/watch/1)
- **Production Health Diagnostics**: [https://kagestream-q481.onrender.com/health](https://kagestream-q481.onrender.com/health)
- **GitHub Repository**: [https://github.com/honeyji333/builders-30](https://github.com/honeyji333/builders-30)

---

### 💻 Local Development Quickstart

```bash
# 1. Clone the repository
git clone https://github.com/honeyji333/builders-30.git
cd builders-30

# 2. Install dependencies (Node.js >= 18)
npm install

# 3. Configure environment variables
cp .env.example .env

# 4. Start production server
npm start
# Server listens at http://localhost:3000 (or preview port 5050)

# 5. Run the 16-test automated integration suite
npm test
# or
python3 tests/run_tests.py
```

---

### 🐳 Docker Container Quickstart

```bash
# Build container image
docker build -t kagestream .

# Run container with mapped port
docker run -p 3000:3000 -e NODE_ENV=production kagestream
```

---

## 🌐 Day 14 Deliverables: Production Deployment & Secrets Management (Track A - Deploy)

### 🌍 1. Live Public Production URL:
- **Live URL**: [https://verified-tire-vacations-carl.trycloudflare.com](https://verified-tire-vacations-carl.trycloudflare.com)
- **Live Health Diagnostics**: [https://verified-tire-vacations-carl.trycloudflare.com/api/health](https://verified-tire-vacations-carl.trycloudflare.com/api/health)
- **Live Cinema Theater Player**: [https://verified-tire-vacations-carl.trycloudflare.com/#/watch/1](https://verified-tire-vacations-carl.trycloudflare.com/#/watch/1)
- *Verified*: All 16 automated integration tests pass with 100% success rate across the live public HTTPS endpoint.

### 🔐 2. Secrets Management & Environment Variables (`.env.example`):
All hardcoded credentials and configuration parameters have been extracted to environment variables:
- `PORT`: Dynamic listening port (e.g. `3000` or `10000`).
- `NODE_ENV`: Runtime mode (`production` / `development`).
- `DATABASE_PATH`: SQLite database storage path (`./data/anime.db` or persistent mount).
- `JWT_SECRET`: Cryptographic token signing key (dynamically generated or loaded from `.env`).
- `CORS_ORIGIN`: Permitted origins for API requests (`*` or specific domains).
- `PUBLIC_SITE_URL`: Base canonical URL for shared links and assets.

### 📦 3. Production Deployment Configurations:
1. **Render.com (`render.yaml`)**:
   - Infrastructure-as-Code Blueprint for 1-click zero-config deployment on Render's free tier.
   - Declares Node.js web service, build/start commands, auto-deploy from `main` branch, and dynamic `JWT_SECRET` generation.
2. **Docker Container (`Dockerfile`)**:
   - Multi-stage Node 22 Alpine container with native build toolchains (`python3`, `make`, `g++`) for compiling `better-sqlite3`.
   - Built-in container health check polling `/health` every 30 seconds.
3. **PaaS Process Model (`Procfile`)**:
   - Standard process declaration (`web: npm start`) for Heroku, Railway, and Fly.io.

---

## 🧪 Day 13 Deliverables: Testing, Bug Fixes & Input Validation (Track A - Testing)

### 📋 Overview of What Was Built & Cleared:
1. **Automated API Test Suite (`tests/run_tests.py` & `tests/api.test.js`)**:
   - Comprehensive test runner executing **16 distinct integration test cases** across all platform core flows.
   - **100% test pass rate (16/16)** with millisecond timing diagnostics and colored ASCII terminal report.
2. **Input Validation Hardening**:
   - **Auth Validation**: RFC 5322 regex email validation, username format regex (`^[a-zA-Z0-9_]{3,24}$`), password length enforcement (8-128 chars), and HTTP 409 Conflict rejection on duplicate accounts.
   - **Stream Resolver Validation**: HTTP 400 Bad Request on invalid/negative episode IDs, HTTP 404 Not Found on missing episodes.
   - **Watch Progress Sync Validation**: Validation of `episode_id` presence, `progress_seconds >= 0`, `duration_seconds > 0`, and 404 handling.
   - **Comments Validation**: Rejection of empty/whitespace-only comments (HTTP 400), enforcement of max 1000 characters (HTTP 400), and episode existence check (HTTP 404).
   - **Watchlist CRUD Validation**: Strict validation of `anime_id` and enum enforcement for watchlist status (`watching`, `completed`, `plan_to_watch`, `dropped`, `on_hold`).
3. **Bug List Cleared**:
   - Fixed playlist drawer episode parsing where response shapes caused `undefined Episodes available` in sidebar.
   - Fixed HTTP 206 range demo response headers preventing socket disconnects.
   - Fixed user login identifier resolution allowing authentication via either email address or username.
   - Cleaned duplicate route handler registrations.

### 🚀 Running the Automated Test Suite:
```bash
# Run the 16-test suite using Python:
python3 tests/run_tests.py

# Or via npm scripts:
npm test
```

### 📊 Test Suite Execution Results:
```text
===================================================================
   KAGESTREAM AUTOMATED API TEST SUITE (DAY 13 - #ALTABuilder30)    
   Target Server: http://localhost:5050                                        
===================================================================

  ✓ PASS [ 55.0ms] Test 1: Health & Diagnostics (/api/health)
  ✓ PASS [  6.0ms] Test 2: Anime Catalog Search & Pagination (/api/anime)
  ✓ PASS [  2.8ms] Test 3: Genre Taxonomy Taxonomy (/api/genres)
  ✓ PASS [ 11.2ms] Test 4: Single Anime Details & Relations (/api/anime/1)
  ✓ PASS [  3.7ms] Test 5: Anime Episodes Listing (/api/anime/1/episodes)
  ✓ PASS [  4.2ms] Test 6: Auth Registration Input Validation (400 Rejections)
  ✓ PASS [  5.4ms] Test 7: Auth Registration & Login Happy Path (201 & 200)
  ✓ PASS [  2.6ms] Test 8: Multi-CDN Stream Source Resolver (/api/stream/resolve/:id)
  ✓ PASS [  3.4ms] Test 9: Stream Resolver Boundary & 404 Validation
  ✓ PASS [  1.9ms] Test 10: Watch Progress Sync Heartbeat (POST /api/stream/sync)
  ✓ PASS [  4.2ms] Test 11: Watch Progress Sync Input Validation (400 & 404)
  ✓ PASS [  3.2ms] Test 12: Playback Auto-Resume Metadata (/api/stream/resume/:animeId)
  ✓ PASS [  4.7ms] Test 13: Episode Comments Creation & Validation (POST /comments)
  ✓ PASS [  2.2ms] Test 14: Episode Comments Feed Retrieval (GET /comments)
  ✓ PASS [  4.4ms] Test 15: Watchlist CRUD & Status Validation (/api/user/watchlist)
  ✓ PASS [  1.2ms] Test 16: HTTP 206 Range Streaming Demo (/api/stream/range-demo)

-------------------------------------------------------------------
SUMMARY: 16 Total Tests | 16 Passed | 0 Failed
-------------------------------------------------------------------
🎉 ALL 16 TESTS PASSED FLAWLESSLY! DAY 13 TESTING DELIVERABLE COMPLETE!
```

---

## 🎬 Day 12 Deliverables: Heavy Feature, Part 2 (Full Cinema Theater Player & Async Heartbeat Sync Engine)

- **Dedicated Full-Page Cinema Theater Player (`#/watch/:episodeId`)**:
  - Implemented responsive 16:9 widescreen cinema theater experience with Tokyo-cyberpunk ambient backlighting.
  - Connected end-to-end to backend multi-CDN streaming resolver (`GET /api/stream/resolve/:episodeId`).
- **Live Multi-CDN Server & Audio Switching**:
  - One-click server toggles (`HD Vault 1080p Full HD`, `AnimeStream Mirror 720p`, `Cloud Stream Engine`) with dynamic stream switching.
  - Multi-language audio track selector (`Japanese Sub`, `Hindi Dub`, `English Dub`) with automatic Dub badge detection.
- **Intelligent Auto-Resume Playback System**:
  - Automatically queries user's last playback timestamp from SQLite database.
  - Displays instant auto-resume prompt (*"Welcome back! You were previously watching at 07:15 • [Resume Playback] [Start Over]"*).
- **Real-Time Async Watch Progress Heartbeat Engine**:
  - Background async interval (`setInterval`) pulses `POST /api/stream/sync` every 10 seconds during playback.
  - Dynamic progress bar smoothly updates in real time, auto-incrementing user watchlist progress upon 90% completion.
- **Interactive Sidebar Playlist & Episode Drawer**:
  - Right-hand playlist panel listing all season episodes with thumbnail, duration, and audio format flags.
  - Active playing episode highlighted with glowing crimson border and live animated audio equalizer (`.playing-equalizer`).
  - Next Episode (`⏭`) and Previous Episode (`⏮`) navigation controls for seamless binge-watching.
  - Real-time instant episode search filter within the drawer.
- **Episode Discussion & Community Comments Feed**:
  - Fully integrated discussion feed below the player reading from `GET /api/stream/episode/:id/comments`.
  - Live comment submission form writing to `POST /api/stream/episode/:id/comments` with optimistic UI rendering.

### 🎮 Testing Day 12 Deliverables (Cinema Theater Mode & Async Sync):
1. Open `http://localhost:5050/#/watch/1` (or click **"🎬 Launch Theater Player"** on the home page).
2. **Cinema Stream**: Experience the 16:9 widescreen player with ambient Tokyo-cyberpunk backlight vignette.
3. **Multi-Server Switching**: Click `HD Vault (1080p)` or `AnimeStream Mirror (720p)` to seamlessly switch video CDN sources.
4. **Audio Track Selector**: Toggle between `Japanese (Sub)`, `Hindi Dub`, and `English Dub`.
5. **Async Watch Progress Heartbeat**: Watch the live pulsating green dot and animated progress bar sync every 10 seconds to `POST /api/stream/sync`.
6. **Interactive Sidebar Playlist**: Browse season episodes with the live audio equalizer on the active episode, and click any episode to switch streams instantly.
7. **Episode Community Feed**: Post a comment below the player and watch it appear in the live discussion list!

```bash
# Test 1: Resolve Multi-Server Streams for Episode 1
curl -s http://localhost:5050/api/stream/resolve/1

# Test 2: Synchronize Real-Time Watch Progress
curl -s -X POST http://localhost:5050/api/stream/sync \
  -H "Content-Type: application/json" \
  -d '{"episode_id": 1, "progress_seconds": 600, "duration_seconds": 1440}'

# Test 3: Instant Resume Timestamp Lookup
curl -s http://localhost:5050/api/stream/resume/1

# Test 4: Fetch Episode Discussion Comments Feed
curl -s http://localhost:5050/api/stream/episode/1/comments

# Test 5: Post Episode Community Comment
curl -s -X POST http://localhost:5050/api/stream/episode/1/comments \
  -H "Content-Type: application/json" \
  -d '{"content": "Loving the 1080p HD streaming on KageStream!"}'
```

---

## 🎬 Day 12 Deliverables: Heavy Feature, Part 2 (Full Cinema Theater Player & Async Heartbeat Sync Engine)

- **Dedicated Full-Page Cinema Theater Player (`#/watch/:episodeId`)**:
  - Implemented responsive 16:9 widescreen cinema theater experience with Tokyo-cyberpunk ambient backlighting.
  - Connected end-to-end to backend multi-CDN streaming resolver (`GET /api/stream/resolve/:episodeId`).
- **Live Multi-CDN Server & Audio Switching**:
  - One-click server toggles (`HD Vault 1080p Full HD`, `AnimeStream Mirror 720p`, `Cloud Stream Engine`) with dynamic stream switching.
  - Multi-language audio track selector (`Japanese Sub`, `Hindi Dub`, `English Dub`) with automatic Dub badge detection.
- **Intelligent Auto-Resume Playback System**:
  - Automatically queries user's last playback timestamp from SQLite database.
  - Displays instant auto-resume prompt (*"Welcome back! You were previously watching at 07:15 • [Resume Playback] [Start Over]"*).
- **Real-Time Async Watch Progress Heartbeat Engine**:
  - Background async interval (`setInterval`) pulses `POST /api/stream/sync` every 10 seconds during playback.
  - Dynamic progress bar smoothly updates in real time, auto-incrementing user watchlist progress upon 90% completion.
- **Interactive Sidebar Playlist & Episode Drawer**:
  - Right-hand playlist panel listing all season episodes with thumbnail, duration, and audio format flags.
  - Active playing episode highlighted with glowing crimson border and live animated audio equalizer (`.playing-equalizer`).
  - Next Episode (`⏭`) and Previous Episode (`⏮`) navigation controls for seamless binge-watching.
  - Real-time instant episode search filter within the drawer.
- **Episode Discussion & Community Comments Feed**:
  - Fully integrated discussion feed below the player reading from `GET /api/stream/episode/:id/comments`.
  - Live comment submission form writing to `POST /api/stream/episode/:id/comments` with optimistic UI rendering.

---

## 🚀 Day 11 Deliverables: Heavy Feature, Part 1 (Streaming Resolver & Watch Sync Backend)

- **Multi-Server Streaming Resolver (`GET /api/stream/resolve/:episodeId`)**:
  - Dynamically resolves multi-CDN mirrors for any episode (Primary `HD Vault Fast CDN`, Fallback Mirror 2, and 4K Stream Server).
  - Supplies verified responsive embed targets, direct streaming streams, audio track metadata (Japanese / Hindi Dub / English Sub), and next/previous episode navigation pointers.
  - Automatically fetches the authenticated user's last saved playback timestamp for seamless instant resume.
- **Real-Time Watch Progress Synchronization (`POST /api/stream/sync`)**:
  - Records real-time playback position (`progress_seconds`, `duration_seconds`) into SQLite `watch_history`.
  - Dynamically calculates watched percentage (`percent_watched`).
  - **Auto-Completion & Library Progression**: When progress exceeds 90% or the episode finishes, automatically marks the episode completed and updates the user's watchlist episode counter. If it is the final episode, it promotes the anime's watchlist status to `Completed`!
- **Instant Resume Lookup (`GET /api/stream/resume/:animeId`)**:
  - Delivers instantaneous "Continue Watching" playback recovery, retrieving the exact episode and timestamp where the user left off.
- **HTTP 206 Partial Content Byte-Range Video Streaming (`GET /api/stream/range-demo`)**:
  - RFC 7233 compliant media streaming endpoint supporting `Range: bytes=start-end` requests, `Content-Range`, `Accept-Ranges: bytes`, and chunked binary streaming for smooth seeking.
- **Interactive Stream Resolver Modal & Video Player (`#streamModal`)**:
  - Integrated 16:9 widescreen video player modal with multi-server CDN switcher (`HD Vault 1080p` vs `AnimeStream Mirror 720p`).
  - Enables direct one-click playback from episode cards and "Watch Episode 1" action, complete with Next/Previous episode navigation and database watch progress sync.

---

## ⚡ Day 10 Deliverables: Create, Edit & Delete Flows (Full UI CRUD)

- **User Watchlist & Library CRUD (`#/watchlist`)**:
  - **CREATE**: Add anime to library via `#addWatchlistModal` with status (`Watching`, `Plan to Watch`, `Completed`, `On Hold`, `Dropped`) and starting episode progress.
  - **READ**: Filterable library view categorized by tabs with dynamic counters (`All`, `Watching`, `Plan to Watch`, `Completed`, `On Hold`, `Dropped`).
  - **UPDATE / EDIT**: Update status or episode count via `#editWatchlistModal`, or use the **instant inline `+1 Ep` quick-increment button** directly on the card with animated progress bar updates!
  - **DELETE**: Delete entries with confirmation (`DELETE /api/user/watchlist/:id`), removing cards smoothly from DOM with optimistic UI updates.
- **Catalogue Entity CRUD**:
  - **CREATE**: `＋ Add New Anime` modal on the catalogue page submitting to `POST /api/anime` with input validation, loading button state, and live catalog refresh.
  - **DELETE**: Admin/contributor delete action on detail screen (`DELETE /api/anime/:id`) with prompt confirmation.
- **UX Feedback & State**: Loading spinners during submission, error banners for validation failures, and floating toast notifications for every mutation.

---

## 🎬 Day 9 Deliverables: Main List & Detail Screens

- **Main List Screen (`#/catalog`)**:
  - **Live Filter Toolbar**: Real-time debounce search, dynamic genres taxonomy dropdown (`GET /api/genres`), format filter (`TV`, `Movie`, `OVA`, etc.), status filter (`Airing`, `Completed`), and sorting (`Top Rated`, `Newest`, `Most Viewed`, `Title A-Z`).
  - **Active Filter Chips**: Click-to-remove tags for active search terms and genre filters.
  - **Paginated Catalog Grid**: Responsive cards with high-res cover art, crimson rating badges, release year, episode counts, and genre chips.
  - **Interactive Pagination**: Smart page switcher (`Prev`, `1`, `2`, `3`..., `Next`) fetching live slices from `/api/anime?page=X`.
- **Anime Detail Screen (`#/anime/:id`)**:
  - **Cinematic Backdrop**: Hero header with backdrop art and deep crimson gradient vignette.
  - **Single Entity Info**: Title (English & Japanese), star score, release year, studio, duration, view count, full plot synopsis, and clickable genre tags that cross-filter the catalog.
  - **Episode Grid**: Fetches complete episode list (`GET /api/anime/:id/episodes`), rendering episode badges, titles, durations, and audio/subtitle flags.
  - **Quick Action Bar**: "Watch Episode 1", "Add to Watchlist" (prepping Day 10), and "Share" link generator with toast notifications.

---

## 🎨 Day 8 Deliverables: Frontend Setup, Routing & Auth Screens

- **Design System**: Tokyo Ghoul / Cyberpunk inspired **Pitch Black (`#070709`) + Dark Slate Charcoal (`#121218`, `#171720`) + Crimson & Neon Red accents (`#e50914`, `#ff1e2b`)**.
- **SPA Architecture**: Express static middleware with client-side fallback, modular CSS and vanilla JS router (`#/`, `#/login`, `#/signup`, `#/catalog`, `#/watchlist`).
- **Interactive Modals**:
  - `Login Modal` (`#loginModal`) connected to `POST /api/auth/login` with JWT local storage and HTTP cookie sync.
  - `Signup Modal` (`#signupModal`) connected to `POST /api/auth/register` with input validation and password confirmation.
- **Session State**: Automatic token validation on mount via `GET /api/auth/me`, dynamic user profile badge in navigation, and clean logout handling (`POST /api/auth/logout`).
- **Live Preview / Catalog Grid**: Dynamically fetches and displays featured anime cards from `GET /api/anime`.

### Testing Day 8 Deliverable:
Open the website in your browser:
```bash
http://localhost:3000/
# or preview port:
http://localhost:5050/
```
1. Click **"Get Started"** or open `#/signup` to create a new user account.
2. Click **"Sign In"** or open `#/login` to log into an existing account.
3. Observe session status badge and profile pill update automatically with your username.
4. Click **"Verify /me API"** in the Live Session State card to verify the protected JWT response.

---

## 🧪 Testing Day 7 Deliverable: Search, Filter, Pagination & Related Entities

### 1. Paginated Catalog with Search & Filter
```bash
# Search anime by keyword with genre filter & pagination
curl -X GET "http://localhost:3000/api/anime?search=demon&genre=action&page=1&limit=10"
```

### 2. Related Entity: All Genres with Real-Time Counts
```bash
curl -X GET http://localhost:3000/api/genres
```

### 3. Related Entity: Episodes for an Anime
```bash
curl -X GET http://localhost:3000/api/anime/demon-slayer-kimetsu-no-yaiba/episodes
```

### 4. Single Anime with Enriched Genres and Episode Array
```bash
curl -X GET http://localhost:3000/api/anime/1
```
