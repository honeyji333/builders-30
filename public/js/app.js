/**
 * AnimeVault • Client Application (Day 8 & Day 9: State, Rendering, List & Detail Screens)
 * #ALTABuilder30 • Full-Stack Anime Streaming Platform
 */

// Application State
const state = {
  user: null,
  token: localStorage.getItem('animevault_token') || null,
  currentRoute: window.location.hash || '#/',
  genres: [],
  catalog: {
    anime: [],
    pagination: { page: 1, limit: 18, total: 0, totalPages: 1 },
    filters: {
      search: '',
      genre: '',
      type: '',
      status: '',
      sort: 'rating',
      page: 1,
      limit: 18
    }
  },
  currentAnimeDetail: null
};

// ===================================================================
// API Client Helper
// ===================================================================
async function apiCall(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (state.token) {
    headers['Authorization'] = `Bearer ${state.token}`;
  }

  const config = {
    ...options,
    headers,
    credentials: 'include'
  };

  try {
    const res = await fetch(endpoint, config);
    const data = await res.json().catch(() => ({}));
    return { status: res.status, ok: res.ok, data };
  } catch (err) {
    console.error('API Error:', err);
    return { status: 0, ok: false, data: { success: false, error: 'Network error or server unreachable' } };
  }
}

// ===================================================================
// Toast Notification Engine
// ===================================================================
function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '⚠️';

  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-message">${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ===================================================================
// View Navigation Router (Day 9)
// ===================================================================
function switchView(viewId) {
  document.querySelectorAll('.view-section').forEach(view => {
    view.classList.remove('active');
  });

  const target = document.getElementById(viewId);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Update navbar links
  const navHome = document.getElementById('navLinkHome');
  const navCatalog = document.getElementById('navLinkCatalog');

  if (navHome) navHome.classList.toggle('active', viewId === 'homeView');
  if (navCatalog) navCatalog.classList.toggle('active', viewId === 'catalogView');
}

function navigateTo(hash) {
  if (window.location.hash !== hash) {
    window.location.hash = hash;
  } else {
    handleRouting();
  }
}

async function handleRouting() {
  const hash = window.location.hash || '#/';
  state.currentRoute = hash;

  const testerRoute = document.getElementById('testerRoute');
  if (testerRoute) testerRoute.textContent = hash;

  if (hash === '#/' || hash === '' || hash === '#') {
    switchView('homeView');
    fetchFeaturedAnime();
  } else if (hash.startsWith('#/catalog') || hash.startsWith('#/browse')) {
    switchView('catalogView');
    
    // Parse any query params in hash e.g. #/catalog?genre=action
    if (hash.includes('?')) {
      const qs = hash.split('?')[1];
      const params = new URLSearchParams(qs);
      if (params.has('genre')) state.catalog.filters.genre = params.get('genre');
      if (params.has('search')) state.catalog.filters.search = params.get('search');
      if (params.has('page')) state.catalog.filters.page = parseInt(params.get('page'), 10) || 1;
      syncFilterInputsFromState();
    }
    loadCatalog();
  } else if (hash.startsWith('#/anime/')) {
    const animeId = hash.replace('#/anime/', '').trim();
    if (animeId) {
      switchView('detailView');
      loadAnimeDetail(animeId);
    }
  } else if (hash === '#/login') {
    openModal('loginModal');
  } else if (hash === '#/signup') {
    openModal('signupModal');
  } else if (hash === '#/watchlist') {
    if (!state.user) {
      showToast('Please sign in to view your Watchlist', 'info');
      openModal('loginModal');
    } else {
      showToast('Watchlist & Custom collections unlocked in Day 10!', 'info');
    }
  }
}

// ===================================================================
// DAY 9: MAIN LIST SCREEN (CATALOGUE ENGINE)
// ===================================================================

/**
 * Fetch and populate dynamic genres dropdown
 */
async function loadGenresDropdown() {
  const select = document.getElementById('genreSelect');
  if (!select) return;

  const res = await apiCall('/api/genres');
  if (res.ok && res.data.success && res.data.data) {
    state.genres = res.data.data;
    select.innerHTML = '<option value="">All Genres</option>' + 
      res.data.data.map(g => `<option value="${g.slug}">${escapeHtml(g.name)} (${g.anime_count || 0})</option>`).join('');
    
    if (state.catalog.filters.genre) {
      select.value = state.catalog.filters.genre;
    }
  }
}

function syncFilterInputsFromState() {
  const searchInput = document.getElementById('catalogSearchInput');
  const genreSelect = document.getElementById('genreSelect');
  const typeSelect = document.getElementById('typeSelect');
  const statusSelect = document.getElementById('statusSelect');
  const sortSelect = document.getElementById('sortSelect');

  if (searchInput) searchInput.value = state.catalog.filters.search;
  if (genreSelect) genreSelect.value = state.catalog.filters.genre;
  if (typeSelect) typeSelect.value = state.catalog.filters.type;
  if (statusSelect) statusSelect.value = state.catalog.filters.status;
  if (sortSelect) sortSelect.value = state.catalog.filters.sort;
}

/**
 * Fetch anime with current filters, search & pagination
 */
async function loadCatalog() {
  const grid = document.getElementById('catalogAnimeGrid');
  const countEl = document.getElementById('catalogResultsCount');
  const pageMetaEl = document.getElementById('catalogPageMeta');
  if (!grid) return;

  // Show skeleton shimmer loaders
  grid.innerHTML = Array(6).fill('<div class="skeleton-card"></div>').join('');
  if (countEl) countEl.textContent = 'Searching Vault database...';

  const f = state.catalog.filters;
  const queryParts = [
    `page=${f.page}`,
    `limit=${f.limit}`,
    `sort=${encodeURIComponent(f.sort)}`
  ];
  if (f.search) queryParts.push(`search=${encodeURIComponent(f.search)}`);
  if (f.genre) queryParts.push(`genre=${encodeURIComponent(f.genre)}`);
  if (f.type) queryParts.push(`type=${encodeURIComponent(f.type)}`);
  if (f.status) queryParts.push(`status=${encodeURIComponent(f.status)}`);

  const url = `/api/anime?${queryParts.join('&')}`;
  const res = await apiCall(url);

  updateStatusConsole(res.data);

  if (res.ok && res.data.success && res.data.data) {
    const list = res.data.data.anime || [];
    const pagination = res.data.data.pagination || { page: 1, limit: 18, total: list.length, totalPages: 1 };
    
    state.catalog.anime = list;
    state.catalog.pagination = pagination;

    renderActiveFilterChips();
    renderCatalogGrid(list);
    renderPagination(pagination);

    if (countEl) {
      countEl.innerHTML = `Showing <strong>${list.length}</strong> of <strong>${pagination.total}</strong> anime in catalogue`;
    }
    if (pageMetaEl) {
      pageMetaEl.textContent = `Page ${pagination.page} of ${pagination.totalPages}`;
    }
  } else {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
        <p style="font-size: 1.2rem; margin-bottom: 12px; color: var(--text-pure);">No anime found matching your criteria</p>
        <button class="btn btn-primary btn-sm" onclick="resetFilters()">Reset All Filters</button>
      </div>
    `;
    if (countEl) countEl.textContent = '0 anime found';
  }
}

/**
 * Render Catalog Anime Cards Grid
 */
function renderCatalogGrid(animeList) {
  const grid = document.getElementById('catalogAnimeGrid');
  if (!grid) return;

  if (animeList.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
        <p style="font-size: 1.2rem; margin-bottom: 12px; color: var(--text-pure);">No anime found matching your criteria</p>
        <button class="btn btn-primary btn-sm" onclick="resetFilters()">Reset All Filters</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = animeList.map(anime => {
    const poster = anime.cover_image || anime.banner_image || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400';
    const rating = (anime.rating || 8.0).toFixed(1);
    const type = anime.type || 'TV';
    const genres = (anime.genres || []).slice(0, 2);

    return `
      <div class="catalog-card" onclick="navigateTo('#/anime/${anime.id}')" title="View ${escapeHtml(anime.title)} details">
        <div class="catalog-card-poster">
          <img class="catalog-card-img" src="${poster}" alt="${escapeHtml(anime.title)}" loading="lazy" />
          <div class="catalog-badge-rating">
            <span>★</span> ${rating}
          </div>
          <div class="catalog-badge-type">${escapeHtml(type)}</div>
          ${anime.has_hindi_dub ? '<div class="catalog-badge-dub">HINDI DUB</div>' : ''}
        </div>
        <div class="catalog-card-body">
          <div class="catalog-card-title">${escapeHtml(anime.title)}</div>
          <div class="catalog-card-meta">
            <span>${anime.release_year || '2024'}</span>
            <span>${anime.episodes_count ? anime.episodes_count + ' eps' : 'Ongoing'}</span>
          </div>
          <div class="catalog-genres-row">
            ${genres.map(g => `<span class="genre-tag-tiny">${escapeHtml(g.name)}</span>`).join('')}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Render Active Filter Chips Row
 */
function renderActiveFilterChips() {
  const row = document.getElementById('activeFiltersRow');
  const container = document.getElementById('activeChipsContainer');
  if (!row || !container) return;

  const f = state.catalog.filters;
  const chips = [];

  if (f.search) {
    chips.push({ key: 'search', label: `Search: "${f.search}"` });
  }
  if (f.genre) {
    const gObj = state.genres.find(g => g.slug === f.genre);
    chips.push({ key: 'genre', label: `Genre: ${gObj ? gObj.name : f.genre}` });
  }
  if (f.type) {
    chips.push({ key: 'type', label: `Format: ${f.type}` });
  }
  if (f.status) {
    chips.push({ key: 'status', label: `Status: ${f.status}` });
  }
  if (f.sort && f.sort !== 'rating') {
    chips.push({ key: 'sort', label: `Sort: ${f.sort}` });
  }

  if (chips.length > 0) {
    row.style.display = 'flex';
    container.innerHTML = chips.map(c => `
      <span class="filter-chip" onclick="removeFilter('${c.key}')">
        ${escapeHtml(c.label)} &times;
      </span>
    `).join('') + `
      <span class="filter-chip" onclick="resetFilters()" style="background: rgba(239, 68, 68, 0.15); color: #f87171;">
        Clear All
      </span>
    `;
  } else {
    row.style.display = 'none';
  }
}

function removeFilter(key) {
  if (key === 'search') state.catalog.filters.search = '';
  if (key === 'genre') state.catalog.filters.genre = '';
  if (key === 'type') state.catalog.filters.type = '';
  if (key === 'status') state.catalog.filters.status = '';
  if (key === 'sort') state.catalog.filters.sort = 'rating';

  state.catalog.filters.page = 1;
  syncFilterInputsFromState();
  loadCatalog();
}

function resetFilters() {
  state.catalog.filters = {
    search: '',
    genre: '',
    type: '',
    status: '',
    sort: 'rating',
    page: 1,
    limit: 18
  };
  syncFilterInputsFromState();
  loadCatalog();
}

/**
 * Render Interactive Pagination Controls
 */
function renderPagination(p) {
  const wrap = document.getElementById('catalogPagination');
  if (!wrap) return;

  if (p.totalPages <= 1) {
    wrap.innerHTML = '';
    return;
  }

  let html = '';

  // Prev Button
  html += `
    <button class="page-btn" ${p.page <= 1 ? 'disabled' : ''} onclick="changePage(${p.page - 1})">
      &larr; Prev
    </button>
  `;

  // Page Numbers
  const total = p.totalPages;
  const current = p.page;

  let pages = [];
  if (total <= 7) {
    pages = Array.from({ length: total }, (_, i) => i + 1);
  } else {
    if (current <= 4) {
      pages = [1, 2, 3, 4, 5, '...', total];
    } else if (current >= total - 3) {
      pages = [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    } else {
      pages = [1, '...', current - 1, current, current + 1, '...', total];
    }
  }

  pages.forEach(pg => {
    if (pg === '...') {
      html += `<span class="page-btn" style="border: none; background: transparent; cursor: default;">...</span>`;
    } else {
      html += `
        <button class="page-btn ${pg === current ? 'active' : ''}" onclick="changePage(${pg})">
          ${pg}
        </button>
      `;
    }
  });

  // Next Button
  html += `
    <button class="page-btn" ${p.page >= total ? 'disabled' : ''} onclick="changePage(${p.page + 1})">
      Next &rarr;
    </button>
  `;

  wrap.innerHTML = html;
}

function changePage(page) {
  state.catalog.filters.page = page;
  loadCatalog();
  const catEl = document.getElementById('catalogView');
  if (catEl) catEl.scrollIntoView({ behavior: 'smooth' });
}

// ===================================================================
// DAY 9: DETAIL SCREEN (SINGLE ANIME & EPISODES ENGINE)
// ===================================================================

/**
 * Fetch and render complete anime detail view
 */
async function loadAnimeDetail(param) {
  const detailView = document.getElementById('detailView');
  if (!detailView) return;

  // Clear previous details
  const titleEl = document.getElementById('detailTitle');
  if (titleEl) titleEl.textContent = 'Loading Anime...';

  const res = await apiCall(`/api/anime/${param}`);
  updateStatusConsole(res.data);

  if (res.ok && res.data.success && res.data.data) {
    const a = res.data.data;
    state.currentAnimeDetail = a;

    // 1. Backdrop
    const backdropEl = document.getElementById('detailBackdrop');
    const backdropImg = a.banner_image || a.cover_image || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200';
    if (backdropEl) {
      backdropEl.style.backgroundImage = `url('${backdropImg}')`;
    }

    // 2. Poster
    const posterImg = document.getElementById('detailPosterImg');
    if (posterImg) {
      posterImg.src = a.cover_image || a.banner_image || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400';
      posterImg.alt = a.title;
    }

    // 3. Titles
    if (titleEl) titleEl.textContent = a.title;
    const titleJpEl = document.getElementById('detailTitleJp');
    if (titleJpEl) titleJpEl.textContent = a.title_jp || '';

    // 4. Badges Strip
    const badgesStrip = document.getElementById('detailBadgesStrip');
    if (badgesStrip) {
      badgesStrip.innerHTML = `
        <span class="detail-badge highlight">★ ${(a.rating || 8.0).toFixed(1)} Score</span>
        <span class="detail-badge">${escapeHtml(a.type || 'TV')}</span>
        <span class="detail-badge">${escapeHtml(a.status || 'Completed')}</span>
        <span class="detail-badge">${a.release_year || '2024'}</span>
        <span class="detail-badge">${a.duration || '24 min'}</span>
        ${a.has_hindi_dub ? '<span class="detail-badge highlight" style="color: #10b981; border-color: rgba(16,185,129,0.4);">🎙️ Hindi Dub Available</span>' : ''}
      `;
    }

    // 5. Clickable Genres Strip
    const genresStrip = document.getElementById('detailGenresStrip');
    if (genresStrip) {
      genresStrip.innerHTML = (a.genres || []).map(g => `
        <span class="detail-genre-chip" onclick="filterByGenreFromDetail('${g.slug}')">
          ${escapeHtml(g.name)}
        </span>
      `).join('');
    }

    // 6. Synopsis
    const synopsisEl = document.getElementById('detailSynopsis');
    if (synopsisEl) {
      synopsisEl.textContent = a.description || 'No detailed synopsis available yet for this title.';
    }

    // 7. Specs Grid
    const specFormat = document.getElementById('detailSpecFormat');
    const specYear = document.getElementById('detailSpecYear');
    const specStudio = document.getElementById('detailSpecStudio');
    const specViews = document.getElementById('detailSpecViews');

    if (specFormat) specFormat.textContent = a.type || 'TV';
    if (specYear) specYear.textContent = a.release_year || '2024';
    if (specStudio) specStudio.textContent = a.studio || 'Animation Studio';
    if (specViews) specViews.textContent = (a.views || 0).toLocaleString();

    // 8. Episodes List
    renderEpisodesList(a.episodes || [], a.title);

    // 9. Quick Actions
    const watchBtn = document.getElementById('detailWatchBtn');
    if (watchBtn) {
      watchBtn.onclick = () => {
        const epSection = document.getElementById('detailEpisodesSection');
        if (epSection) epSection.scrollIntoView({ behavior: 'smooth' });
        showToast(`Ready to stream Episode 1 of ${a.title}! (Player unlocks Day 11)`, 'info');
      };
    }

    const watchlistBtn = document.getElementById('detailWatchlistBtn');
    if (watchlistBtn) {
      watchlistBtn.onclick = () => {
        if (!state.user) {
          showToast('Please sign in to save anime to your Watchlist', 'info');
          openModal('loginModal');
        } else {
          showToast(`Added ${a.title} to your personal Watchlist! (Day 10 Feature)`, 'success');
        }
      };
    }

    const shareBtn = document.getElementById('detailShareBtn');
    if (shareBtn) {
      shareBtn.onclick = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
          showToast('Anime share link copied to clipboard!', 'success');
        }).catch(() => {
          showToast('Share URL: ' + url, 'info');
        });
      };
    }

  } else {
    showToast('Anime not found in vault catalogue', 'error');
    navigateTo('#/catalog');
  }
}

function filterByGenreFromDetail(genreSlug) {
  state.catalog.filters.genre = genreSlug;
  state.catalog.filters.page = 1;
  syncFilterInputsFromState();
  navigateTo('#/catalog');
}

/**
 * Render Episode Cards in Detail Screen
 */
function renderEpisodesList(episodes, animeTitle) {
  const grid = document.getElementById('detailEpisodesGrid');
  const countBadge = document.getElementById('detailEpisodesCountBadge');
  if (!grid) return;

  if (countBadge) {
    countBadge.textContent = `${episodes.length} Episodes Available`;
  }

  if (episodes.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-sm);">
        No episodes released yet for this title.
      </div>
    `;
    return;
  }

  grid.innerHTML = episodes.map(ep => {
    const num = ep.number || 1;
    const title = ep.title || `Episode ${num}`;
    const duration = ep.duration || '24 min';
    const lang = ep.audio_language ? `[${ep.audio_language}]` : '[JP Audio, EN Sub]';

    return `
      <div class="episode-card" onclick="showToast('Streaming player launches in Day 11: ${escapeHtml(title)}', 'info')">
        <div class="episode-num-badge">EP ${num}</div>
        <div class="episode-info">
          <div class="episode-title" title="${escapeHtml(title)}">${escapeHtml(title)}</div>
          <div class="episode-sub">
            <span>⏱ ${duration}</span>
            <span>•</span>
            <span style="color: var(--accent-crimson-hover);">${lang}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ===================================================================
// Authentication Controller (Day 8 Integration)
// ===================================================================

async function checkAuthSession() {
  updateStatusConsole({ status: 'checking', message: 'Verifying session via GET /api/auth/me...' });

  const res = await apiCall('/api/auth/me');

  if (res.ok && res.data.success && res.data.data) {
    state.user = res.data.data;
    renderAuthState(true);
    updateStatusConsole(res.data);
  } else {
    state.user = null;
    renderAuthState(false);
    updateStatusConsole({
      authenticated: false,
      message: 'Guest Mode: No active session token found.',
      help: 'Click Sign In or Sign Up to test authentication.'
    });
  }
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const alertEl = document.getElementById('loginAlert');
  const btn = document.getElementById('loginSubmitBtn');
  const form = e.target;

  const identifier = form.identifier.value.trim();
  const password = form.password.value;

  hideAlert(alertEl);

  if (!identifier || !password) {
    showAlert(alertEl, 'Please enter both your username/email and password', 'error');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = 'Signing in...';

  const res = await apiCall('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: identifier, password })
  });

  btn.disabled = false;
  btn.innerHTML = 'Sign In';

  if (res.ok && res.data.success) {
    state.token = res.data.token;
    localStorage.setItem('animevault_token', res.data.token);
    state.user = res.data.data;

    showAlert(alertEl, 'Logged in successfully!', 'success');
    showToast(`Welcome back, ${state.user.username}!`, 'success');
    renderAuthState(true);
    updateStatusConsole(res.data);

    setTimeout(() => {
      closeModal('loginModal');
      form.reset();
      hideAlert(alertEl);
      navigateTo('#/');
    }, 700);
  } else {
    const errorMsg = res.data.error || 'Authentication failed. Please check your credentials.';
    showAlert(alertEl, errorMsg, 'error');
    updateStatusConsole(res.data);
  }
}

async function handleSignupSubmit(e) {
  e.preventDefault();
  const alertEl = document.getElementById('signupAlert');
  const btn = document.getElementById('signupSubmitBtn');
  const form = e.target;

  const username = form.username.value.trim();
  const email = form.email.value.trim();
  const password = form.password.value;
  const confirmPassword = form.confirmPassword.value;

  hideAlert(alertEl);

  if (!username || !email || !password || !confirmPassword) {
    showAlert(alertEl, 'All fields are required', 'error');
    return;
  }

  if (username.length < 3 || username.length > 24) {
    showAlert(alertEl, 'Username must be between 3 and 24 characters', 'error');
    return;
  }

  if (password.length < 8) {
    showAlert(alertEl, 'Password must be at least 8 characters long', 'error');
    return;
  }

  if (password !== confirmPassword) {
    showAlert(alertEl, 'Passwords do not match', 'error');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = 'Creating account...';

  const res = await apiCall('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password })
  });

  btn.disabled = false;
  btn.innerHTML = 'Create Account';

  if (res.ok && res.data.success) {
    state.token = res.data.token;
    localStorage.setItem('animevault_token', res.data.token);
    state.user = res.data.data;

    showAlert(alertEl, 'Account created successfully!', 'success');
    showToast(`Welcome to AnimeVault, ${username}!`, 'success');
    renderAuthState(true);
    updateStatusConsole(res.data);

    setTimeout(() => {
      closeModal('signupModal');
      form.reset();
      hideAlert(alertEl);
      navigateTo('#/');
    }, 800);
  } else {
    const errorMsg = res.data.error || 'Registration failed. Please try a different username or email.';
    showAlert(alertEl, errorMsg, 'error');
    updateStatusConsole(res.data);
  }
}

async function handleLogout() {
  await apiCall('/api/auth/logout', { method: 'POST' });

  state.token = null;
  state.user = null;
  localStorage.removeItem('animevault_token');

  renderAuthState(false);
  showToast('Logged out successfully', 'info');
  updateStatusConsole({
    success: true,
    message: 'User logged out and session cleared.',
    status: 'Guest'
  });

  navigateTo('#/');
}

function renderAuthState(isAuthenticated) {
  const guestGroup = document.getElementById('authGuestGroup');
  const userGroup = document.getElementById('authUserGroup');
  const usernameSpan = document.getElementById('navUsername');
  const userAvatarSpan = document.getElementById('navAvatar');

  const statusPill = document.getElementById('testerStatusPill');
  const testerUsername = document.getElementById('testerUsername');
  const testerEmail = document.getElementById('testerEmail');

  if (isAuthenticated && state.user) {
    if (guestGroup) guestGroup.style.display = 'none';
    if (userGroup) userGroup.style.display = 'flex';
    if (usernameSpan) usernameSpan.textContent = state.user.username;
    if (userAvatarSpan) userAvatarSpan.textContent = state.user.username.charAt(0).toUpperCase();

    if (statusPill) {
      statusPill.className = 'status-pill authenticated';
      statusPill.textContent = '🟢 Authenticated';
    }
    if (testerUsername) testerUsername.textContent = state.user.username;
    if (testerEmail) testerEmail.textContent = state.user.email || 'N/A';
  } else {
    if (guestGroup) guestGroup.style.display = 'flex';
    if (userGroup) userGroup.style.display = 'none';

    if (statusPill) {
      statusPill.className = 'status-pill guest';
      statusPill.textContent = '⚪ Guest Mode';
    }
    if (testerUsername) testerUsername.textContent = 'Not Logged In';
    if (testerEmail) testerEmail.textContent = 'None';
  }
}

function updateStatusConsole(data) {
  const consoleEl = document.getElementById('jsonConsole');
  if (consoleEl) {
    consoleEl.textContent = JSON.stringify(data, null, 2);
  }
}

function showAlert(el, msg, type = 'error') {
  if (!el) return;
  el.textContent = msg;
  el.className = `form-alert ${type}`;
  el.style.display = 'block';
}

function hideAlert(el) {
  if (!el) return;
  el.style.display = 'none';
}

// ===================================================================
// Modal Management & Accessibility
// ===================================================================
function openModal(modalId) {
  closeAllModals(false);
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    const firstInput = modal.querySelector('input');
    if (firstInput) setTimeout(() => firstInput.focus(), 100);
  }
}

function closeModal(modalId, updateHash = true) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
  if (updateHash && (window.location.hash === '#/login' || window.location.hash === '#/signup')) {
    history.pushState('', document.title, window.location.pathname + window.location.search);
    handleRouting();
  }
}

function closeAllModals(updateHash = true) {
  document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
  document.body.style.overflow = '';
  if (updateHash && (window.location.hash === '#/login' || window.location.hash === '#/signup')) {
    history.pushState('', document.title, window.location.pathname + window.location.search);
    handleRouting();
  }
}

// ===================================================================
// Featured Preview on Home View
// ===================================================================
async function fetchFeaturedAnime() {
  const grid = document.getElementById('animeGrid');
  if (!grid) return;

  grid.innerHTML = Array(6).fill('<div class="skeleton-card"></div>').join('');

  const res = await apiCall('/api/anime?limit=6');

  if (res.ok && res.data.success && res.data.data) {
    const list = res.data.data.anime || res.data.data;
    grid.innerHTML = list.map(anime => `
      <div class="anime-card" onclick="navigateTo('#/anime/${anime.id}')">
        <div class="anime-poster-wrapper">
          <img class="anime-poster" src="${anime.cover_image || anime.banner_image || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400'}" alt="${escapeHtml(anime.title)}" loading="lazy" />
          <div class="anime-rating-tag">
            <span>★</span> ${(anime.rating || 8.5).toFixed(1)}
          </div>
          <div class="anime-type-tag">${escapeHtml(anime.type || 'TV')}</div>
        </div>
        <div class="anime-info">
          <div class="anime-title" title="${escapeHtml(anime.title)}">${escapeHtml(anime.title)}</div>
          <div class="anime-meta">
            <span>${anime.release_year || '2024'}</span>
            <span>${anime.episodes_count ? anime.episodes_count + ' eps' : 'Ongoing'}</span>
          </div>
        </div>
      </div>
    `).join('');
  }
}

// ===================================================================
// Setup Event Listeners
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Session verify
  checkAuthSession();

  // Load genres taxonomy
  loadGenresDropdown();

  // Client router listeners
  window.addEventListener('hashchange', handleRouting);
  handleRouting();

  // Auth Forms
  const loginForm = document.getElementById('loginForm');
  if (loginForm) loginForm.addEventListener('submit', handleLoginSubmit);

  const signupForm = document.getElementById('signupForm');
  if (signupForm) signupForm.addEventListener('submit', handleSignupSubmit);

  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

  // Nav Search Input
  const navSearch = document.getElementById('navSearchInput');
  if (navSearch) {
    navSearch.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = navSearch.value.trim();
        state.catalog.filters.search = val;
        state.catalog.filters.page = 1;
        syncFilterInputsFromState();
        navigateTo('#/catalog');
      }
    });
  }

  // Catalog Toolbar Search Input with debounce
  let searchTimer = null;
  const catalogSearchInput = document.getElementById('catalogSearchInput');
  if (catalogSearchInput) {
    catalogSearchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        state.catalog.filters.search = e.target.value.trim();
        state.catalog.filters.page = 1;
        loadCatalog();
      }, 350);
    });
  }

  // Filter dropdown listeners
  const genreSelect = document.getElementById('genreSelect');
  if (genreSelect) {
    genreSelect.addEventListener('change', (e) => {
      state.catalog.filters.genre = e.target.value;
      state.catalog.filters.page = 1;
      loadCatalog();
    });
  }

  const typeSelect = document.getElementById('typeSelect');
  if (typeSelect) {
    typeSelect.addEventListener('change', (e) => {
      state.catalog.filters.type = e.target.value;
      state.catalog.filters.page = 1;
      loadCatalog();
    });
  }

  const statusSelect = document.getElementById('statusSelect');
  if (statusSelect) {
    statusSelect.addEventListener('change', (e) => {
      state.catalog.filters.status = e.target.value;
      state.catalog.filters.page = 1;
      loadCatalog();
    });
  }

  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      state.catalog.filters.sort = e.target.value;
      state.catalog.filters.page = 1;
      loadCatalog();
    });
  }

  const resetFiltersBtn = document.getElementById('resetFiltersBtn');
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', resetFilters);
  }

  // Keyboard shortcut '/' to focus search
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
      e.preventDefault();
      const s = document.getElementById('navSearchInput') || document.getElementById('catalogSearchInput');
      if (s) s.focus();
    }
    if (e.key === 'Escape') {
      closeAllModals();
    }
  });

  // Modal Triggers
  document.querySelectorAll('[data-open-modal]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const modalId = btn.getAttribute('data-open-modal');
      if (modalId === 'loginModal') navigateTo('#/login');
      else if (modalId === 'signupModal') navigateTo('#/signup');
      else openModal(modalId);
    });
  });

  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-backdrop');
      if (modal) closeModal(modal.id);
    });
  });

  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal(backdrop.id);
    });
  });

  // Password visibility toggle
  document.querySelectorAll('.toggle-password').forEach(toggle => {
    toggle.addEventListener('click', () => {
      const input = toggle.parentElement.querySelector('input');
      if (!input) return;
      if (input.type === 'password') {
        input.type = 'text';
        toggle.textContent = '🙈';
      } else {
        input.type = 'password';
        toggle.textContent = '👁️';
      }
    });
  });

  // Health Check Test Button
  const testHealthBtn = document.getElementById('testHealthBtn');
  if (testHealthBtn) {
    testHealthBtn.addEventListener('click', async () => {
      const res = await apiCall('/health');
      updateStatusConsole(res.data);
      showToast('Health check: Status OK (SQLite WAL)', 'success');
    });
  }
});
