# 📱 UI Wireframes & Screen Architecture - AnimeVault

> **Day 2 Deliverable | ALTA BUILDER 30 Challenge**  
> 4 Key UI Screens: Authentication, Main Catalog, Anime Detail/Player, and User Library Dashboard.

---

## 🖼️ Screen 1: Authentication Modal (Login / Sign Up)
Accessible from the global navigation bar via a glassmorphic overlay dialog.

```text
+--------------------------------------------------------------+
|                        [X Close]                             |
|                                                              |
|                  🎬 AnimeVault Account                       |
|           [  Sign In  ]   |   [  Register  ]                 |
|                                                              |
|   Username / Email:                                          |
|   +------------------------------------------------------+   |
|   | Enter your email or username...                      |   |
|   +------------------------------------------------------+   |
|                                                              |
|   Password:                                                  |
|   +------------------------------------------------------+   |
|   | •••••••••••••••••                                    |   |
|   +------------------------------------------------------+   |
|                                                              |
|   [x] Remember me                   Forgot password?         |
|                                                              |
|   +------------------------------------------------------+   |
|   |                   LOGIN TO ACCOUNT                   |   |
|   +------------------------------------------------------+   |
|                                                              |
|   Don't have an account yet? Switch to Register              |
+--------------------------------------------------------------+
```

---

## 🖼️ Screen 2: Main Catalog & Discovery Screen
The public home view featuring dynamic hero banner, instant search, genre filters, and trending grids.

```text
+-------------------------------------------------------------------------------+
| [LOGO] AnimeVault   [Browse] [Genres] [Movies]    [🔍 Search Anime...] [👤 Login] |
+-------------------------------------------------------------------------------+
|                                                                               |
|  =========================== HERO BANNER SPOTLIGHT ========================  |
|  |  JUJUTSU KAISEN (Season 2)                                             |  |
|  |  ⭐ 8.9/10  |  2023  |  TV Series  |  Action, Supernatural             |  |
|  |  "A boy swallows a cursed talisman and becomes cursed himself..."      |  |
|  |  [ ▶ Watch Ep 1 ]    [ + Add to Watchlist ]                            |  |
|  ==========================================================================  |
|                                                                               |
|  Genres: [ All ] [ Action ] [ Shonen ] [ Romance ] [ Fantasy ] [ Sci-Fi ]     |
|                                                                               |
|  🔥 TRENDING NOW                              [View All ->]                   |
|  +------------+  +------------+  +------------+  +------------+  +------------+ |
|  | [Poster]   |  | [Poster]   |  | [Poster]   |  | [Poster]   |  | [Poster]   | |
|  | Solo       |  | Demon      |  | Attack on  |  | One        |  | Bleach:    | |
|  | Leveling   |  | Slayer     |  | Titan      |  | Piece      |  | TYBW       | |
|  | ⭐ 8.7 (TV)|  | ⭐ 8.8 (TV)|  | ⭐ 9.1 (TV)|  | ⭐ 9.0 (TV)|  | ⭐ 8.9 (TV)| |
|  +------------+  +------------+  +------------+  +------------+  +------------+ |
|                                                                               |
|  ⭐ TOP RATED ANIMES                          [Sort: Highest Rating ▼]         |
|  +------------+  +------------+  +------------+  +------------+  +------------+ |
|  | Frieren    |  | Steins;Gate|  | Fullmetal  |  | Hunter x   |  | Death      | |
|  | Beyond     |  | 0          |  | Alchemist  |  | Hunter     |  | Note       | |
|  +------------+  +------------+  +------------+  +------------+  +------------+ |
+-------------------------------------------------------------------------------+
```

---

## 🖼️ Screen 3: Anime Detail & Streaming Player
Shows metadata, quick actions (Watchlist/Favorite), embedded streaming player, and episode selector.

```text
+-------------------------------------------------------------------------------+
| [LOGO] AnimeVault                                  [🔍 Search...] [👤 Profile]|
+-------------------------------------------------------------------------------+
|  < Back to Browse                                                             |
|                                                                               |
|  +--------------------------------------------+  +--------------------------+ |
|  |                                            |  | EPISODES (24 Total)      | |
|  |                                            |  | [🔍 Search Episode...]   | |
|  |            EMBEDDED VIDEO PLAYER           |  |                          | |
|  |                  [ ▶ PLAY ]                |  | [x] Ep 1: I'm Luffy!     | |
|  |                                            |  | [ ] Ep 2: Great Swordsman| |
|  |                                            |  | [ ] Ep 3: Morgan vs Luffy| |
|  |  [00:14 / 24:00] ------------●---------- 🔊 |  | [ ] Ep 4: Luffy's Past   | |
|  +--------------------------------------------+  | [ ] Ep 5: Pirate Clown   | |
|  Server: [ Server 1 (HD) ▼ ]   [ Next Ep ▶ ]   |  +--------------------------+ |
|                                                                               |
|  ONE PIECE (1999)                                                             |
|  ⭐ 9.0/10  |  Studio: Toei Animation  |  Status: Airing  |  Hindi Dub [✓]   |
|  [ ❤️ Favorite ]   [ 📑 In Watchlist ▼ ]   [ ↗ Share ]                         |
|                                                                               |
|  Synopsis:                                                                    |
|  Monkey D. Luffy embarks on a journey with his pirate crew across the Grand   |
|  Line to find the ultimate treasure, the 'One Piece'.                         |
+-------------------------------------------------------------------------------+
```

---

## 🖼️ Screen 4: User Dashboard (Personal Library & History)
Authenticated user's personal control center for tracking progress, favorites, and watch history.

```text
+-------------------------------------------------------------------------------+
| [LOGO] AnimeVault                                  [🔍 Search...] [👤 Logout] |
+-------------------------------------------------------------------------------+
|  👋 Welcome back, Manan!                                                      |
|  Tabs: [ 🕒 Continue Watching ]  [ 📑 My Watchlist (14) ]  [ ❤️ Favorites (8) ]|
|                                                                               |
|  CONTINUE WATCHING:                                                           |
|  +--------------------------+  +--------------------------+                   |
|  | [Thumbnail]              |  | [Thumbnail]              |                   |
|  | Jujutsu Kaisen S2        |  | Solo Leveling            |                   |
|  | Episode 14 (18:42 / 24:00|  | Episode 7 (05:10 / 24:00)|                   |
|  | [=========------] 75%    |  | [====--------------] 22% |                   |
|  | [ ▶ Resume Episode ]     |  | [ ▶ Resume Episode ]     |                   |
|  +--------------------------+  +--------------------------+                   |
|                                                                               |
|  MY WATCHLIST: Filter: [ All Status ▼ ]                                       |
|  +------------+  +------------+  +------------+  +------------+               |
|  | [Poster]   |  | [Poster]   |  | [Poster]   |  | [Poster]   |               |
|  | Bleach     |  | Chainsaw   |  | Naruto     |  | Vinland    |               |
|  | Status:    |  | Status:    |  | Status:    |  | Status:    |               |
|  | Watching   |  | Plan Watch |  | Completed  |  | On Hold    |               |
|  +------------+  +------------+  +------------+  +------------+               |
+-------------------------------------------------------------------------------+
```
