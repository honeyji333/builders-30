# 📋 FEATURES.md - AnimeVault

## 1. Project Overview & Problem Statement
Anime enthusiasts often face cluttered, ad-ridden platforms with sluggish load times, inconsistent metadata, and poor personal library features. **AnimeVault** is a fast, responsive, and ad-free full-stack anime streaming catalog and library platform. It gives users a seamless viewing experience with instant search, rich metadata, personalized watchlists, and reliable playback tracking.

---

## 2. User Roles & Permissions

### 👤 Guest User (Unauthenticated)
- Browse featured hero banners, trending, and top-rated anime.
- Explore the complete anime catalog with genre-based filtering.
- Instant search by title or keyword.
- View anime detail pages (synopsis, genres, episode count, rating).
- Preview streaming player for available episodes.

### 🌟 Registered Member (Authenticated)
- All Guest User features.
- Persistent **Watchlist** to bookmark anime for future viewing.
- **Favorites** collection for quick one-click access.
- **Watch History & Resume**: Automatically records watched episodes and playback timestamps.
- Manage user profile and active sessions.

### 🛠️ Administrator
- Seed and manage database records.
- Trigger background episode synchronization services.
- Monitor catalog health and media endpoints.

---

## 3. Feature Breakdown

### 🎯 MVP Features (Phase 1 Must-Haves)
1. **Secure Authentication**: User registration and login using `bcryptjs` password hashing and JWT cookies.
2. **Catalog Browsing**: Paginated anime listings with sorting by popularity, rating, and status.
3. **Genre Exploration**: Dynamic genre taxonomy with real-time title counts.
4. **Live Search**: Debounced search bar with instant query matching.
5. **Anime Detail Showcase**: Rich overview including status, studio, episode count, and synopsis.
6. **Episode Video Player**: Embedded streaming player with episode drawer and server fallback.
7. **Personal Watchlist**: Add/remove titles to a saved watchlist with one click.
8. **Favorites Collection**: Quick bookmarking system for favorite anime.
9. **Watch History Tracker**: Saves the user's progress and last-watched episode.
10. **Modern Dark UI**: Glassmorphic theme, responsive mobile navigation drawer, and animated hero banner.

### 🚀 Advanced Features (Phase 2 & Polish)
1. **Background Episode Sync**: Automated worker service updating new episode releases.
2. **Media Enrichment Utility**: Script to enrich high-resolution thumbnails and stream sources.
3. **SEO & Meta Engine**: Dynamic OpenGraph tags, canonical links, XML sitemap, and robots.txt.
4. **Production DevOps**: Containerized Dockerfile, Render/Railway cloud configuration.
