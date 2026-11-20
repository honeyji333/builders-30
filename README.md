# 🎬 KageStream - 30-Day Project Challenge

> A modern, ad-free full-stack anime streaming platform and personal media library.
> Built as part of the **#ALTABuilder30** 30-Day Project Challenge (Track A: Days 1–15).

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
- [ ] **Day 12**: Heavy feature, part 2 (Embedded player & UI integration)
- [ ] **Day 13**: Testing and bug fixes (5+ API tests)
- [ ] **Day 14**: Deploy frontend, backend and database
- [ ] **Day 15**: README, demo video and project launch post

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
- **Interactive UI Testing Controls**:
  - Added dedicated Day 11 test action triggers on the frontend navigation bar to test stream resolution and watch progress sync end-to-end with visual toast confirmations.

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
