# 🎬 AnimeVault - 30-Day Project Challenge

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
- [ ] **Day 8**: Frontend setup, routing and auth screens
- [ ] **Day 9**: Main list and detail screens
- [ ] **Day 10**: Create, edit and delete flows (Watchlist & Favorites)
- [ ] **Day 11**: Heavy feature, part 1 (Video streaming & sync backend)
- [ ] **Day 12**: Heavy feature, part 2 (Embedded player & UI integration)
- [ ] **Day 13**: Testing and bug fixes (5+ API tests)
- [ ] **Day 14**: Deploy frontend, backend and database
- [ ] **Day 15**: README, demo video and project launch post

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
