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
- [x] Added duplicate prevention and error handling for existing usernames/emails.

---

## 🛠️ Tech Stack
- **Backend**: Node.js, Express.js
- **Database**: SQLite with `better-sqlite3`
- **Security & Auth**: `bcryptjs` password hashing, input validation, JWT (upcoming Day 5)
- **Frontend**: Modern Vanilla JS (Single Page Architecture), Semantic HTML5, CSS3 Glassmorphism
- **DevOps**: Docker, Render / Railway

---

## 📅 Track A: 15-Day Full-Stack Roadmap

- [x] **Day 1**: Pick project and write feature list (`FEATURES.md`)
- [x] **Day 2**: Database schema and wireframes (`/docs`)
- [x] **Day 3**: Project setup and server running (`/health` API)
- [x] **Day 4**: Signup API with password hashing (`POST /api/auth/register`)
- [ ] **Day 5**: Login API with JWT and protected routes
- [ ] **Day 6**: CRUD APIs for the main entity (Anime Catalog)
- [ ] **Day 7**: Related entities, search and pagination
- [ ] **Day 8**: Frontend setup, routing and auth screens
- [ ] **Day 9**: Main list and detail screens
- [ ] **Day 10**: Create, edit and delete flows (Watchlist & Favorites)
- [ ] **Day 11**: Heavy feature, part 1 (Video streaming & sync backend)
- [ ] **Day 12**: Heavy feature, part 2 (Embedded player & UI integration)
- [ ] **Day 13**: Testing and bug fixes (5+ API tests)
- [ ] **Day 14**: Deploy frontend, backend and database
- [ ] **Day 15**: README, demo video and project launch post

---

## 🧪 Testing the Signup API (Postman / cURL)

You can test user registration using Postman or cURL:

```bash
# Register a new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "eren_jaeger",
    "email": "eren@paradis.island",
    "password": "TatacawPassword123"
  }'
```

**Successful Response (`201 Created`):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": 1,
    "username": "eren_jaeger",
    "email": "eren@paradis.island",
    "avatar_url": "https://api.dicebear.com/7.x/adventurer/svg?seed=eren_jaeger",
    "created_at": "2026-11-15T04:45:00.000Z"
  }
}
```
