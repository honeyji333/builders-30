# 🎬 AnimeVault - 30-Day Project Challenge

> A modern, ad-free full-stack anime streaming platform and personal media library.
> Built as part of the **#ALTABuilder30** 30-Day Project Challenge.

---

## 📌 Progress Highlights
### Day 1: Project Planning & Feature Specification
- [x] Defined core problem statement and target audience.
- [x] Outlined user roles: Guest, Registered Member, and Admin.
- [x] Structured MVP features (10 core capabilities) vs Phase 2 enhancements in [`FEATURES.md`](./FEATURES.md).
- [x] Designed the full 30-day execution roadmap.
- [x] Initialized Git repository and project planning documentation.

### Day 2: Database Modeling & Screen Wireframes
- [x] Modeled relational SQLite schema with Entity-Relationship (ER) diagram in [`docs/schema.md`](./docs/schema.md).
- [x] Defined tables for `users`, `anime`, `genres`, `anime_genres`, `episodes`, `watchlist`, `favorites`, `watch_history`, and `comments`.
- [x] Added index optimization strategies for high-frequency queries (slugs, statuses, user IDs).
- [x] Sketched 4 core UI wireframes (Auth Modal, Catalog Browsing, Detail/Streaming Player, and User Library) in [`docs/wireframes.md`](./docs/wireframes.md).

---

## 🛠️ Planned Tech Stack
- **Backend**: Node.js, Express.js
- **Database**: SQLite with `better-sqlite3`
- **Authentication**: JWT (JSON Web Tokens), `bcryptjs`, Secure Cookies
- **Frontend**: Modern Vanilla JS (Single Page Architecture), Semantic HTML5, CSS3 Glassmorphism
- **DevOps**: Docker, Render / Railway

---

## 📅 30-Day Roadmap Overview

- [x] **Day 1**: Project Concept & Feature Specification (`FEATURES.md`)
- [x] **Day 2**: Database Schema Design & Screen Wireframes (`/docs`)
- [ ] **Day 3**: Express Server Skeleton & Health Check Endpoint
- [ ] **Day 4**: SQLite Engine Integration & Core Tables
- [ ] **Day 5**: Relational Schema (Episodes, Watchlist, Favorites)
- [ ] **Day 6**: Core Anime Catalog Seeding
- [ ] **Day 7**: Extended Anime Catalog & Rich Metadata
- [ ] **Day 8**: User Registration API with Password Hashing
- [ ] **Day 9**: Login API with JWT & HTTP-Only Cookies
- [ ] **Day 10**: Auth Middleware & Protected Session Verification
- [ ] **Day 11**: Paginated Anime Catalog Browsing API
- [ ] **Day 12**: Trending & Top-Rated Highlights API
- [ ] **Day 13**: Instant Catalog Search & Filtering API
- [ ] **Day 14**: Detailed Anime View & Episode Listing API
- [ ] **Day 15**: Genre Taxonomy & Aggregation API
- [ ] **Day 16**: User Watchlist Management API
- [ ] **Day 17**: User Favorites API
- [ ] **Day 18**: Watch History & Playback Progress API
- [ ] **Day 19**: Background Episode Sync Service
- [ ] **Day 20**: Media Artwork Enrichment Scripts
- [ ] **Day 21**: Semantic HTML5 Shell & UI Layout
- [ ] **Day 22**: Dark Anime Aesthetic & CSS Variables
- [ ] **Day 23**: Anime Card Grid & Glassmorphism Styling
- [ ] **Day 24**: Client-Side SPA Router & API Layer
- [ ] **Day 25**: Interactive Auth Modals & Session UI
- [ ] **Day 26**: Featured Hero Banner & Spotlight Carousel
- [ ] **Day 27**: Real-Time Search Bar & Genre Filter Pills
- [ ] **Day 28**: Embedded Video Player & Episode Selection
- [ ] **Day 29**: User Library Dashboard & Continue Watching UI
- [ ] **Day 30**: Dynamic SEO Meta, Dockerization & Cloud Deployment 🚀

---

## 🚀 Getting Started
```bash
# Clone the repository
git clone https://github.com/your-username/anime-vault.git
cd anime-vault

# Review Day 1 feature breakdown
cat FEATURES.md
```
