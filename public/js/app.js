/**
 * KageStream • Client Application (Day 10: Create, Edit and Delete Flows)
 * #ALTABuilder30 • Full-Stack Anime Streaming Platform
 */

// Application State
const state = {
  user: null,
  token: localStorage.getItem('kagestream_token') || localStorage.getItem('animevault_token') || null,
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
  watchlist: {
    items: [],
    activeTab: 'all'
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
// View Navigation Router
// ===================================================================
function switchView(viewId) {
  if (viewId !== 'watchView') {
    stopWatchTheaterHeartbeat();
  }

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
  const navWatchlist = document.getElementById('navLinkWatchlist');

  if (navHome) navHome.classList.toggle('active', viewId === 'homeView');
  if (navCatalog) navCatalog.classList.toggle('active', viewId === 'catalogView');
  if (navWatchlist) navWatchlist.classList.toggle('active', viewId === 'watchlistView');
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
    if (hash.includes('?')) {
      const qs = hash.split('?')[1];
      const params = new URLSearchParams(qs);
      if (params.has('genre')) state.catalog.filters.genre = params.get('genre');
      if (params.has('search')) state.catalog.filters.search = params.get('search');
      if (params.has('page')) state.catalog.filters.page = parseInt(params.get('page'), 10) || 1;
      syncFilterInputsFromState();
    }
    loadCatalog();
  } else if (hash.startsWith('#/watchlist')) {
    switchView('watchlistView');
    loadWatchlist(state.watchlist.activeTab);
  } else if (hash.startsWith('#/watch/')) {
    const epId = parseInt(hash.replace('#/watch/', '').trim(), 10) || 1;
    switchView('watchView');
    loadWatchTheater(epId);
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
  }
}

// ===================================================================
// DAY 10: USER WATCHLIST & LIBRARY CRUD FLOWS
// ===================================================================

/**
 * READ Watchlist
 */
async function loadWatchlist(activeTab = 'all') {
  state.watchlist.activeTab = activeTab;
  const grid = document.getElementById('watchlistGrid');
  if (!grid) return;

  grid.innerHTML = '<div style=\"grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 40px;\">Loading your library...</div>';

  const res = await apiCall('/api/user/watchlist');
  updateStatusConsole(res.data);

  if (res.ok && res.data.success) {
    const allItems = res.data.data || [];
    state.watchlist.items = allItems;

    // Update tab badges
    updateWatchlistTabCounts(allItems);

    // Update Home Tester stats
    const wlTester = document.getElementById('testerWatchlistCount');
    if (wlTester) wlTester.textContent = `${allItems.length} items in library`;

    // Filter by active tab
    const filtered = activeTab === 'all' 
      ? allItems 
      : allItems.filter(item => item.status === activeTab);

    renderWatchlistGrid(filtered);
  } else {
    grid.innerHTML = `
      <div class="empty-watchlist-box">
        <div class="empty-watchlist-icon">🔒</div>
        <h3 style="color: var(--text-pure); font-size: 1.25rem;">Sign In Required</h3>
        <p style="color: var(--text-secondary); max-width: 420px;">
          Please sign in to access your personal watchlist, track episode progress, and manage your collection.
        </p>
        <button class="btn btn-primary" data-open-modal="loginModal">Sign In to View Watchlist</button>
      </div>
    `;
  }
}

function updateWatchlistTabCounts(items) {
  const counts = {
    all: items.length,
    watching: 0,
    plan_to_watch: 0,
    completed: 0,
    on_hold: 0,
    dropped: 0
  };

  items.forEach(item => {
    if (counts[item.status] !== undefined) {
      counts[item.status]++;
    }
  });

  const setBadge = (id, count) => {
    const el = document.getElementById(id);
    if (el) el.textContent = count;
  };

  setBadge('wlCountAll', counts.all);
  setBadge('wlCountWatching', counts.watching);
  setBadge('wlCountPlan', counts.plan_to_watch);
  setBadge('wlCountCompleted', counts.completed);
  setBadge('wlCountHold', counts.on_hold);
  setBadge('wlCountDropped', counts.dropped);
}

function renderWatchlistGrid(items) {
  const grid = document.getElementById('watchlistGrid');
  if (!grid) return;

  if (items.length === 0) {
    grid.innerHTML = `
      <div class="empty-watchlist-box">
        <div class="empty-watchlist-icon">📑</div>
        <h3 style="color: var(--text-pure); font-size: 1.25rem;">No anime in this section</h3>
        <p style="color: var(--text-secondary); max-width: 420px;">
          You don't have any titles saved under "${state.watchlist.activeTab}". Explore the streaming catalogue and add anime to track!
        </p>
        <a href="#/catalog" class="btn btn-primary btn-sm">Explore Catalogue →</a>
      </div>
    `;
    return;
  }

  grid.innerHTML = items.map(item => {
    const poster = item.cover_image || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400';
    const totalEps = item.episodes_count || 12;
    const currentEp = item.current_episode || 0;
    const percent = Math.min(100, Math.round((currentEp / totalEps) * 100));

    return `
      <div class="watchlist-card" id="wl-card-${item.id}">
        <div class="watchlist-card-top">
          <div class="watchlist-card-poster" onclick="navigateTo('#/anime/${item.anime_id}')" style="cursor: pointer;">
            <img src="${poster}" alt="${escapeHtml(item.title)}" loading="lazy" />
          </div>
          <div class="watchlist-card-info">
            <div class="watchlist-card-title" title="${escapeHtml(item.title)}" onclick="navigateTo('#/anime/${item.anime_id}')" style="cursor: pointer;">
              ${escapeHtml(item.title)}
            </div>
            <div style="font-size: 0.76rem; color: var(--text-muted);">${item.type || 'TV'} • ${item.release_year || '2024'}</div>
            <span class="watchlist-status-pill status-${item.status}">
              ${formatStatusLabel(item.status)}
            </span>
          </div>
        </div>

        <div class="watchlist-card-body">
          <div class="progress-header">
            <span>Progress: <strong style="color: var(--text-pure);">${currentEp}</strong> / ${totalEps} eps</span>
            <span style="font-weight: 700; color: var(--accent-crimson-hover);">${percent}%</span>
          </div>
          <div class="progress-bar-wrap">
            <div class="progress-bar-fill" style="width: ${percent}%;"></div>
          </div>

          <div class="watchlist-card-actions">
            <button class="quick-inc-btn" onclick="quickIncrementEpisode(${item.id}, ${currentEp}, ${totalEps})" title="Watched 1 more episode">
              <span>+1 Ep</span>
            </button>
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-outline btn-sm" onclick="openEditWatchlistModal(${item.id})" style="padding: 4px 10px; font-size: 0.78rem;">
                ✏️ Edit
              </button>
              <button class="btn btn-danger-ghost btn-sm" onclick="deleteWatchlistEntry(${item.id}, '${escapeHtml(item.title)}')" style="padding: 4px 10px; font-size: 0.78rem;" title="Remove from library">
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function formatStatusLabel(st) {
  if (st === 'plan_to_watch') return 'Plan to Watch';
  if (st === 'on_hold') return 'On Hold';
  return st.charAt(0).toUpperCase() + st.slice(1);
}

/**
 * CREATE Flow: Open Add to Watchlist Modal
 */
function openAddWatchlistModal(animeId, animeTitle, maxEpisodes) {
  if (!state.user) {
    showToast('Please sign in to add anime to your Watchlist', 'info');
    openModal('loginModal');
    return;
  }

  const idInput = document.getElementById('addWlAnimeId');
  const titleSub = document.getElementById('addWlAnimeTitle');
  const epInput = document.getElementById('addWlEpisode');
  const epHelper = document.getElementById('addWlEpisodeHelper');
  const alertEl = document.getElementById('addWlAlert');

  hideAlert(alertEl);
  if (idInput) idInput.value = animeId;
  if (titleSub) titleSub.textContent = `Adding "${animeTitle}" to your library`;
  if (epInput) {
    epInput.max = maxEpisodes || 2000;
    epInput.value = 1;
  }
  if (epHelper) epHelper.textContent = `Total Episodes: ${maxEpisodes || 'Ongoing'}`;

  openModal('addWatchlistModal');
}

/**
 * CREATE Flow: Handle Add Watchlist Form Submit
 */
async function handleAddWatchlistSubmit(e) {
  e.preventDefault();
  const alertEl = document.getElementById('addWlAlert');
  const btn = document.getElementById('addWlSubmitBtn');
  const form = e.target;

  const anime_id = parseInt(form.anime_id.value, 10);
  const status = form.status.value;
  const current_episode = parseInt(form.current_episode.value, 10) || 0;

  btn.disabled = true;
  btn.innerHTML = 'Saving to Watchlist...';
  hideAlert(alertEl);

  const res = await apiCall('/api/user/watchlist', {
    method: 'POST',
    body: JSON.stringify({ anime_id, status, current_episode })
  });

  btn.disabled = false;
  btn.innerHTML = 'Save to Watchlist';
  updateStatusConsole(res.data);

  if (res.ok && res.data.success) {
    showToast('Saved to your Watchlist!', 'success');
    closeModal('addWatchlistModal');
    form.reset();

    // If on detail page, update button text
    const wlBtn = document.getElementById('detailWatchlistBtn');
    if (wlBtn) wlBtn.innerHTML = '✓ In Watchlist (Edit)';

    // Refresh watchlist cache if user visits later
    if (state.currentRoute === '#/watchlist') {
      loadWatchlist(state.watchlist.activeTab);
    }
  } else {
    showAlert(alertEl, res.data.error || 'Failed to save to watchlist', 'error');
  }
}

/**
 * EDIT Flow: Open Edit Watchlist Modal
 */
function openEditWatchlistModal(entryId) {
  const item = state.watchlist.items.find(i => i.id === entryId);
  if (!item) return;

  const idInput = document.getElementById('editWlEntryId');
  const titleSub = document.getElementById('editWlAnimeTitle');
  const statusSelect = document.getElementById('editWlStatus');
  const epInput = document.getElementById('editWlEpisode');
  const epHelper = document.getElementById('editWlEpisodeHelper');
  const alertEl = document.getElementById('editWlAlert');
  const deleteBtn = document.getElementById('editWlDeleteBtn');

  hideAlert(alertEl);
  if (idInput) idInput.value = item.id;
  if (titleSub) titleSub.textContent = `Editing "${item.title}" progress`;
  if (statusSelect) statusSelect.value = item.status || 'watching';
  if (epInput) {
    epInput.max = item.episodes_count || 2000;
    epInput.value = item.current_episode || 0;
  }
  if (epHelper) epHelper.textContent = `Total Episodes: ${item.episodes_count || 'Ongoing'}`;

  if (deleteBtn) {
    deleteBtn.onclick = () => {
      closeModal('editWatchlistModal');
      deleteWatchlistEntry(item.id, item.title);
    };
  }

  openModal('editWatchlistModal');
}

/**
 * EDIT Flow: Handle Edit Watchlist Form Submit
 */
async function handleEditWatchlistSubmit(e) {
  e.preventDefault();
  const alertEl = document.getElementById('editWlAlert');
  const btn = document.getElementById('editWlSubmitBtn');
  const form = e.target;

  const entry_id = parseInt(form.entry_id.value, 10);
  const status = form.status.value;
  const current_episode = parseInt(form.current_episode.value, 10) || 0;

  btn.disabled = true;
  btn.innerHTML = 'Updating...';
  hideAlert(alertEl);

  const res = await apiCall(`/api/user/watchlist/${entry_id}`, {
    method: 'PUT',
    body: JSON.stringify({ status, current_episode })
  });

  btn.disabled = false;
  btn.innerHTML = 'Update Progress';
  updateStatusConsole(res.data);

  if (res.ok && res.data.success) {
    showToast('Watchlist entry updated!', 'success');
    closeModal('editWatchlistModal');
    loadWatchlist(state.watchlist.activeTab);
  } else {
    showAlert(alertEl, res.data.error || 'Failed to update entry', 'error');
  }
}

/**
 * EDIT Flow: Quick Increment (+1 Ep)
 */
async function quickIncrementEpisode(entryId, currentEp, maxEp) {
  const nextEp = currentEp + 1;
  if (maxEp && nextEp > maxEp) {
    showToast(`Already reached final episode (${maxEp})!`, 'info');
    return;
  }

  const res = await apiCall(`/api/user/watchlist/${entryId}`, {
    method: 'PUT',
    body: JSON.stringify({ current_episode: nextEp })
  });

  if (res.ok && res.data.success) {
    showToast(`Watched Episode ${nextEp}!`, 'success');
    loadWatchlist(state.watchlist.activeTab);
  } else {
    showToast('Failed to update episode progress', 'error');
  }
}

/**
 * DELETE Flow: Remove Watchlist Entry
 */
async function deleteWatchlistEntry(entryId, animeTitle = 'Anime') {
  if (!confirm(`Are you sure you want to remove "${animeTitle}" from your Watchlist?`)) {
    return;
  }

  const card = document.getElementById(`wl-card-${entryId}`);
  if (card) {
    card.style.opacity = '0.4';
    card.style.pointerEvents = 'none';
  }

  const res = await apiCall(`/api/user/watchlist/${entryId}`, {
    method: 'DELETE'
  });

  updateStatusConsole(res.data);

  if (res.ok && res.data.success) {
    showToast(`Removed "${animeTitle}" from Watchlist`, 'info');
    if (card) card.remove();
    loadWatchlist(state.watchlist.activeTab);
  } else {
    if (card) {
      card.style.opacity = '1';
      card.style.pointerEvents = 'auto';
    }
    showToast(res.data.error || 'Failed to delete from watchlist', 'error');
  }
}

// ===================================================================
// DAY 10: CATALOGUE ENTITY CRUD (ADD & DELETE ANIME)
// ===================================================================

/**
 * Handle Add Anime Form Submit
 */
async function handleAddAnimeSubmit(e) {
  e.preventDefault();
  const alertEl = document.getElementById('addAnimeAlert');
  const btn = document.getElementById('addAnimeSubmitBtn');
  const form = e.target;

  const title = form.title.value.trim();
  const title_jp = form.title_jp.value.trim();
  const type = form.type.value;
  const status = form.status.value;
  const rating = parseFloat(form.rating.value) || 8.0;
  const episodes_count = parseInt(form.episodes_count.value, 10) || 12;
  const release_year = parseInt(form.release_year.value, 10) || 2024;
  const cover_image = form.cover_image.value.trim();
  const description = form.description.value.trim();

  hideAlert(alertEl);

  if (!title) {
    showAlert(alertEl, 'Anime title is required', 'error');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = 'Adding Anime to Vault...';

  const res = await apiCall('/api/anime', {
    method: 'POST',
    body: JSON.stringify({
      title,
      title_jp,
      type,
      status,
      rating,
      episodes_count,
      release_year,
      cover_image,
      description
    })
  });

  btn.disabled = false;
  btn.innerHTML = 'Create Anime in Catalogue';
  updateStatusConsole(res.data);

  if (res.ok && res.data.success) {
    showToast(`"${title}" successfully created in Catalogue!`, 'success');
    closeModal('addAnimeModal');
    form.reset();
    navigateTo('#/catalog');
    loadCatalog();
  } else {
    showAlert(alertEl, res.data.error || 'Failed to create anime', 'error');
  }
}

/**
 * Handle Delete Anime from Detail Screen
 */
async function handleDeleteAnimeFromDetail(animeId, animeTitle) {
  if (!confirm(`CAUTION: Are you sure you want to delete "${animeTitle}" from the streaming catalogue? This action cannot be undone.`)) {
    return;
  }

  const res = await apiCall(`/api/anime/${animeId}`, {
    method: 'DELETE'
  });

  updateStatusConsole(res.data);

  if (res.ok && res.data.success) {
    showToast(`"${animeTitle}" deleted from catalogue`, 'info');
    navigateTo('#/catalog');
    loadCatalog();
  } else {
    showToast(res.data.error || 'Failed to delete anime', 'error');
  }
}

// ===================================================================
// DAY 9: MAIN LIST SCREEN (CATALOGUE ENGINE)
// ===================================================================

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

async function loadCatalog() {
  const grid = document.getElementById('catalogAnimeGrid');
  const countEl = document.getElementById('catalogResultsCount');
  const pageMetaEl = document.getElementById('catalogPageMeta');
  if (!grid) return;

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

function renderActiveFilterChips() {
  const row = document.getElementById('activeFiltersRow');
  const container = document.getElementById('activeChipsContainer');
  if (!row || !container) return;

  const f = state.catalog.filters;
  const chips = [];

  if (f.search) chips.push({ key: 'search', label: `Search: "${f.search}"` });
  if (f.genre) {
    const gObj = state.genres.find(g => g.slug === f.genre);
    chips.push({ key: 'genre', label: `Genre: ${gObj ? gObj.name : f.genre}` });
  }
  if (f.type) chips.push({ key: 'type', label: `Format: ${f.type}` });
  if (f.status) chips.push({ key: 'status', label: `Status: ${f.status}` });
  if (f.sort && f.sort !== 'rating') chips.push({ key: 'sort', label: `Sort: ${f.sort}` });

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

function renderPagination(p) {
  const wrap = document.getElementById('catalogPagination');
  if (!wrap) return;

  if (p.totalPages <= 1) {
    wrap.innerHTML = '';
    return;
  }

  let html = `
    <button class="page-btn" ${p.page <= 1 ? 'disabled' : ''} onclick="changePage(${p.page - 1})">
      &larr; Prev
    </button>
  `;

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

async function loadAnimeDetail(param) {
  const detailView = document.getElementById('detailView');
  if (!detailView) return;

  const titleEl = document.getElementById('detailTitle');
  if (titleEl) titleEl.textContent = 'Loading Anime...';

  const res = await apiCall(`/api/anime/${param}`);
  updateStatusConsole(res.data);

  if (res.ok && res.data.success && res.data.data) {
    const a = res.data.data;
    state.currentAnimeDetail = a;

    const backdropEl = document.getElementById('detailBackdrop');
    const backdropImg = a.banner_image || a.cover_image || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200';
    if (backdropEl) backdropEl.style.backgroundImage = `url('${backdropImg}')`;

    const posterImg = document.getElementById('detailPosterImg');
    if (posterImg) {
      posterImg.src = a.cover_image || a.banner_image || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400';
      posterImg.alt = a.title;
    }

    if (titleEl) titleEl.textContent = a.title;
    const titleJpEl = document.getElementById('detailTitleJp');
    if (titleJpEl) titleJpEl.textContent = a.title_jp || '';

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

    const genresStrip = document.getElementById('detailGenresStrip');
    if (genresStrip) {
      genresStrip.innerHTML = (a.genres || []).map(g => `
        <span class="detail-genre-chip" onclick="filterByGenreFromDetail('${g.slug}')">
          ${escapeHtml(g.name)}
        </span>
      `).join('');
    }

    const synopsisEl = document.getElementById('detailSynopsis');
    if (synopsisEl) synopsisEl.textContent = a.description || 'No detailed synopsis available yet for this title.';

    const specFormat = document.getElementById('detailSpecFormat');
    const specYear = document.getElementById('detailSpecYear');
    const specStudio = document.getElementById('detailSpecStudio');
    const specViews = document.getElementById('detailSpecViews');

    if (specFormat) specFormat.textContent = a.type || 'TV';
    if (specYear) specYear.textContent = a.release_year || '2024';
    if (specStudio) specStudio.textContent = a.studio || 'Animation Studio';
    if (specViews) specViews.textContent = (a.views || 0).toLocaleString();

    renderEpisodesList(a.episodes || [], a.title);

    // Quick Actions
    const watchBtn = document.getElementById('detailWatchBtn');
    if (watchBtn) {
      watchBtn.onclick = () => {
        const firstEp = (a.episodes && a.episodes.length > 0) ? a.episodes[0] : null;
        navigateTo('#/watch/' + (firstEp ? firstEp.id : 1));
      };
    }

    const watchlistBtn = document.getElementById('detailWatchlistBtn');
    if (watchlistBtn) {
      watchlistBtn.onclick = () => {
        openAddWatchlistModal(a.id, a.title, a.episodes_count || 12);
      };
    }

    const editAnimeBtn = document.getElementById('detailEditAnimeBtn');
    if (editAnimeBtn) {
      editAnimeBtn.onclick = () => {
        showToast(`Editing metadata for "${a.title}"`, 'info');
      };
    }

    const deleteAnimeBtn = document.getElementById('detailDeleteAnimeBtn');
    if (deleteAnimeBtn) {
      deleteAnimeBtn.onclick = () => {
        handleDeleteAnimeFromDetail(a.id, a.title);
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

function renderEpisodesList(episodes, animeTitle) {
  const grid = document.getElementById('detailEpisodesGrid');
  const countBadge = document.getElementById('detailEpisodesCountBadge');
  if (!grid) return;

  if (countBadge) countBadge.textContent = `${episodes.length} Episodes Available`;

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
      <div class="episode-card" onclick="navigateTo('#/watch/${ep.id}')" style="cursor: pointer;" title="Click to stream ${escapeHtml(title)} in Theater Mode">
        <div class="episode-num-badge">EP ${num}</div>
        <div class="episode-info">
          <div class="episode-title" title="${escapeHtml(title)}">${escapeHtml(title)}</div>
          <div class="episode-sub">
            <span>⏱ ${duration}</span>
            <span>•</span>
            <span style="color: var(--accent-crimson-hover);">${lang}</span>
            <span style="margin-left: auto; color: var(--color-success); font-weight: 600;">▶ Watch HD</span>
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
    localStorage.setItem('kagestream_token', res.data.token);
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
    localStorage.setItem('kagestream_token', res.data.token);
    state.user = res.data.data;

    showAlert(alertEl, 'Account created successfully!', 'success');
    showToast(`Welcome to KageStream, ${username}!`, 'success');
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
  localStorage.removeItem('kagestream_token');
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
  } else {
    if (guestGroup) guestGroup.style.display = 'flex';
    if (userGroup) userGroup.style.display = 'none';

    if (statusPill) {
      statusPill.className = 'status-pill guest';
      statusPill.textContent = '⚪ Guest Mode';
    }
    if (testerUsername) testerUsername.textContent = 'Not Logged In';
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
    if (modalId === 'streamModal') {
      const iframe = document.getElementById('streamIframe');
      if (iframe) iframe.src = '';
    }
  }
  if (updateHash && (window.location.hash === '#/login' || window.location.hash === '#/signup')) {
    history.pushState('', document.title, window.location.pathname + window.location.search);
    handleRouting();
  }
}

function closeAllModals(updateHash = true) {
  document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
  const iframe = document.getElementById('streamIframe');
  if (iframe) iframe.src = '';
  document.body.style.overflow = '';
  if (updateHash && (window.location.hash === '#/login' || window.location.hash === '#/signup')) {
    history.pushState('', document.title, window.location.pathname + window.location.search);
    handleRouting();
  }
}

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
// DAY 12: CINEMATIC THEATER WATCH VIEW & ASYNC PROGRESS ENGINE
// ===================================================================

let theaterState = {
  episodeId: null,
  animeId: null,
  animeTitle: '',
  allEpisodes: [],
  currentServer: null,
  currentAudio: 'Japanese',
  progressSeconds: 0,
  durationSeconds: 1440,
  heartbeatTimer: null
};

function stopWatchTheaterHeartbeat() {
  if (theaterState.heartbeatTimer) {
    clearInterval(theaterState.heartbeatTimer);
    theaterState.heartbeatTimer = null;
  }
  const iframe = document.getElementById('theaterIframe');
  if (iframe) iframe.src = '';
}

async function loadWatchTheater(epId) {
  stopWatchTheaterHeartbeat();
  theaterState.episodeId = epId;

  const loadingOverlay = document.getElementById('theaterLoadingOverlay');
  if (loadingOverlay) loadingOverlay.style.display = 'flex';

  showToast(`Loading Theater Cinema for Episode ${epId}...`, 'info');

  const res = await apiCall(`/api/stream/resolve/${epId}`);
  updateStatusConsole(res.data);

  if (loadingOverlay) loadingOverlay.style.display = 'none';

  if (!res.ok || !res.data.success || !res.data.data) {
    showToast('Failed to resolve stream for this episode', 'error');
    navigateTo('#/catalog');
    return;
  }

  const data = res.data.data;
  const ep = data.episode;
  const servers = data.servers || [];
  const anime = ep.anime || {};

  theaterState.animeId = anime.id;
  theaterState.animeTitle = anime.title;
  theaterState.currentServer = servers[0] || null;

  // Breadcrumbs & Headers
  const backLink = document.getElementById('watchBackLink');
  const animeBreadcrumb = document.getElementById('watchAnimeBreadcrumb');
  const epBreadcrumb = document.getElementById('watchEpBreadcrumb');
  const qualityBadge = document.getElementById('theaterQualityBadge');
  const epTitle = document.getElementById('theaterEpTitle');
  const animeSubtitle = document.getElementById('theaterAnimeSubtitle');

  if (backLink) backLink.href = `#/anime/${anime.id || anime.slug || ''}`;
  if (animeBreadcrumb) animeBreadcrumb.textContent = anime.title || 'Anime';
  if (epBreadcrumb) epBreadcrumb.textContent = `Ep ${ep.number}`;
  if (qualityBadge) qualityBadge.textContent = servers[0]?.quality || '1080p HD';
  if (epTitle) epTitle.textContent = `Episode ${ep.number}: ${ep.title}`;
  if (animeSubtitle) animeSubtitle.textContent = `${anime.title} • ${ep.duration || '24 min'} • ${anime.type || 'TV'}`;

  // Iframe Stream Embed
  const iframe = document.getElementById('theaterIframe');
  if (iframe && servers[0]) {
    iframe.src = servers[0].embed_url;
  }

  // Populate Server Switcher
  const serverButtons = document.getElementById('theaterServerButtons');
  if (serverButtons) {
    serverButtons.innerHTML = servers.map((s, idx) => `
      <button class="pill-btn ${idx === 0 ? 'active' : ''}" 
        onclick="switchTheaterServer('${s.id}', '${escapeHtml(s.embed_url)}', '${escapeHtml(s.quality)}', this)">
        ${escapeHtml(s.name)} (${escapeHtml(s.quality)})
      </button>
    `).join('');
  }

  // Hindi Dub button toggle
  const hindiBtn = document.getElementById('theaterHindiBtn');
  if (hindiBtn) {
    hindiBtn.style.display = anime.has_hindi_dub ? 'inline-block' : 'none';
  }

  // Auto-Resume Handling
  const resumeBanner = document.getElementById('theaterResumeBanner');
  const resumeTimeText = document.getElementById('resumeTimeText');
  const resumeAcceptBtn = document.getElementById('resumeAcceptBtn');
  const resumeDismissBtn = document.getElementById('resumeDismissBtn');

  const savedSeconds = data.user_progress?.progress_seconds || 0;
  if (savedSeconds > 60 && resumeBanner) {
    const mins = Math.floor(savedSeconds / 60);
    const secs = savedSeconds % 60;
    const timeFormatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    if (resumeTimeText) resumeTimeText.textContent = timeFormatted;
    resumeBanner.style.display = 'flex';

    if (resumeAcceptBtn) {
      resumeAcceptBtn.onclick = () => {
        theaterState.progressSeconds = savedSeconds;
        resumeBanner.style.display = 'none';
        showToast(`Resumed from ${timeFormatted}!`, 'success');
        updateTheaterProgressUI(savedSeconds, 1440);
      };
    }
    if (resumeDismissBtn) {
      resumeDismissBtn.onclick = () => {
        theaterState.progressSeconds = 0;
        resumeBanner.style.display = 'none';
      };
    }
  } else if (resumeBanner) {
    resumeBanner.style.display = 'none';
    theaterState.progressSeconds = 0;
  }

  // Start Real-Time Watch Sync Heartbeat (Async Flow)
  startWatchTheaterHeartbeat(ep.id);

  // Load Playlist Drawer
  loadTheaterPlaylist(anime.id, ep.number);

  // Load Comments
  loadTheaterComments(ep.id);

  // Setup Next/Prev Buttons
  setupTheaterNavigation(data.prev_episode, data.next_episode);
}

window.switchTheaterServer = function(serverId, embedUrl, quality, btnEl) {
  const iframe = document.getElementById('theaterIframe');
  const qualityBadge = document.getElementById('theaterQualityBadge');
  if (iframe) iframe.src = embedUrl;
  if (qualityBadge) qualityBadge.textContent = quality;

  const group = document.getElementById('theaterServerButtons');
  if (group) {
    group.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
  }
  if (btnEl) btnEl.classList.add('active');

  showToast(`Switched to ${quality} CDN stream`, 'info');
};

function startWatchTheaterHeartbeat(epId) {
  stopWatchTheaterHeartbeat();

  // Initial progress sync
  syncWatchProgress(epId, theaterState.progressSeconds);

  // Heartbeat interval every 10 seconds
  theaterState.heartbeatTimer = setInterval(() => {
    theaterState.progressSeconds += 10;
    if (theaterState.progressSeconds > theaterState.durationSeconds) {
      theaterState.progressSeconds = theaterState.durationSeconds;
    }
    syncWatchProgress(epId, theaterState.progressSeconds);
  }, 10000);
}

async function syncWatchProgress(epId, currentSeconds) {
  const duration = theaterState.durationSeconds || 1440;
  updateTheaterProgressUI(currentSeconds, duration);

  try {
    const res = await apiCall('/api/stream/sync', {
      method: 'POST',
      body: JSON.stringify({
        episode_id: epId,
        progress_seconds: currentSeconds,
        duration_seconds: duration
      })
    });
    if (res.ok && res.data.success) {
      const syncStatus = document.getElementById('theaterSyncStatus');
      if (syncStatus) {
        syncStatus.textContent = `Watch progress synced: ${res.data.data.percent_watched}% (SQLite DB)`;
      }
    }
  } catch (err) {
    console.warn('Sync heartbeat error:', err);
  }
}

function updateTheaterProgressUI(progress, duration) {
  const pct = Math.min(100, Math.round((progress / duration) * 100));
  const bar = document.getElementById('theaterProgressBar');
  const pctLabel = document.getElementById('theaterProgressPct');
  if (bar) bar.style.width = `${pct}%`;
  if (pctLabel) pctLabel.textContent = `${pct}%`;
}

async function loadTheaterPlaylist(animeId, currentEpNum) {
  const playlistEl = document.getElementById('theaterEpisodesList');
  const countEl = document.getElementById('theaterPlaylistCount');
  if (!playlistEl) return;

  const res = await apiCall(`/api/anime/${animeId}/episodes`);
  if (!res.ok || !res.data.success) {
    if (countEl) countEl.textContent = '0 Episodes available';
    if (playlistEl) playlistEl.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 20px;">Could not load episodes</div>';
    return;
  }

  // Handle all API response formats: res.data.data.episodes, res.data.data, res.data.episodes, res.data
  let episodes = [];
  if (res.data?.data?.episodes && Array.isArray(res.data.data.episodes)) {
    episodes = res.data.data.episodes;
  } else if (Array.isArray(res.data?.data)) {
    episodes = res.data.data;
  } else if (Array.isArray(res.data?.episodes)) {
    episodes = res.data.episodes;
  } else if (Array.isArray(res.data)) {
    episodes = res.data;
  }

  theaterState.allEpisodes = episodes;

  if (countEl) countEl.textContent = `${episodes.length} Episodes available`;

  renderTheaterPlaylistItems(episodes, currentEpNum);

  // Auto-scroll active episode into view
  setTimeout(() => {
    const activeItem = playlistEl.querySelector('.playlist-item.active');
    if (activeItem) {
      activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, 150);

  // Search input filter
  const searchInput = document.getElementById('theaterPlaylistSearch');
  if (searchInput) {
    searchInput.value = '';
    searchInput.oninput = (e) => {
      const q = e.target.value.toLowerCase().trim();
      const filtered = episodes.filter(ep => 
        String(ep.number).includes(q) || (ep.title && ep.title.toLowerCase().includes(q))
      );
      renderTheaterPlaylistItems(filtered, currentEpNum);
    };
  }
}

function renderTheaterPlaylistItems(episodes, currentEpNum) {
  const playlistEl = document.getElementById('theaterEpisodesList');
  if (!playlistEl) return;

  if (episodes.length === 0) {
    playlistEl.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 20px;">No episodes found</div>';
    return;
  }

  playlistEl.innerHTML = episodes.map(ep => {
    const isPlaying = ep.number === currentEpNum;
    return `
      <div class="playlist-item ${isPlaying ? 'active' : ''}" onclick="navigateTo('#/watch/${ep.id}')">
        <span class="playlist-item-num">EP ${ep.number}</span>
        <div class="playlist-item-info">
          <div class="playlist-item-title">${escapeHtml(ep.title || `Episode ${ep.number}`)}</div>
          <div class="playlist-item-duration">⏱ ${ep.duration || '24 min'}</div>
        </div>
        ${isPlaying ? `
          <div class="playing-equalizer" title="Currently Playing">
            <span class="eq-bar"></span>
            <span class="eq-bar"></span>
            <span class="eq-bar"></span>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

function setupTheaterNavigation(prevEp, nextEp) {
  const prevBtn = document.getElementById('theaterPrevBtn');
  const nextBtn = document.getElementById('theaterNextBtn');

  if (prevBtn) {
    if (prevEp) {
      prevBtn.style.display = 'inline-flex';
      prevBtn.onclick = () => navigateTo(`#/watch/${prevEp.id}`);
    } else {
      prevBtn.style.display = 'none';
    }
  }

  if (nextBtn) {
    if (nextEp) {
      nextBtn.style.display = 'inline-flex';
      nextBtn.onclick = () => navigateTo(`#/watch/${nextEp.id}`);
    } else {
      nextBtn.style.display = 'none';
    }
  }
}

async function loadTheaterComments(epId) {
  const listEl = document.getElementById('theaterCommentsList');
  const countBadge = document.getElementById('theaterCommentCount');
  if (!listEl) return;

  const res = await apiCall(`/api/stream/episode/${epId}/comments`);
  if (!res.ok || !res.data.success) {
    listEl.innerHTML = '<div class="empty-comments-state">Failed to load comments</div>';
    return;
  }

  const comments = res.data.data || [];
  if (countBadge) countBadge.textContent = `${comments.length} Comments`;

  if (comments.length === 0) {
    listEl.innerHTML = '<div class="empty-comments-state">No comments yet on this episode. Be the first to share your thoughts!</div>';
    return;
  }

  listEl.innerHTML = comments.map(c => `
    <div class="comment-item">
      <img src="${escapeHtml(c.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${c.username}`)}" 
           alt="${escapeHtml(c.username)}" class="comment-item-avatar" />
      <div class="comment-item-content">
        <div class="comment-item-header">
          <span class="comment-username">${escapeHtml(c.username || 'User')}</span>
          <span class="comment-time">${escapeHtml(c.created_at || 'Just now')}</span>
        </div>
        <p class="comment-text">${escapeHtml(c.content)}</p>
      </div>
    </div>
  `).join('');
}

// ===================================================================
// Setup Event Listeners
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
  checkAuthSession();
  loadGenresDropdown();

  window.addEventListener('hashchange', handleRouting);
  handleRouting();

  // Auth Forms
  const loginForm = document.getElementById('loginForm');
  if (loginForm) loginForm.addEventListener('submit', handleLoginSubmit);

  const signupForm = document.getElementById('signupForm');
  if (signupForm) signupForm.addEventListener('submit', handleSignupSubmit);

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

  // Day 10: CRUD Forms
  const addWlForm = document.getElementById('addWatchlistForm');
  if (addWlForm) addWlForm.addEventListener('submit', handleAddWatchlistSubmit);

  const editWlForm = document.getElementById('editWatchlistForm');
  if (editWlForm) editWlForm.addEventListener('submit', handleEditWatchlistSubmit);

  const addAnimeForm = document.getElementById('addAnimeForm');
  if (addAnimeForm) addAnimeForm.addEventListener('submit', handleAddAnimeSubmit);

  // Watchlist status tab filters
  document.querySelectorAll('[data-wl-tab]').forEach(tabBtn => {
    tabBtn.addEventListener('click', () => {
      document.querySelectorAll('[data-wl-tab]').forEach(b => b.classList.remove('active'));
      tabBtn.classList.add('active');
      const tabName = tabBtn.getAttribute('data-wl-tab');
      loadWatchlist(tabName);
    });
  });

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
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
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

  // Day 11: Heavy Feature Streaming Engine & Interactive Player
  let currentStreamingEpisode = null;

  async function resolveAndPlayEpisode(epId) {
    if (!epId) epId = 1;
    showToast(`Resolving multi-server streams for Episode ${epId}...`, 'info');
    
    const res = await apiCall(`/api/stream/resolve/${epId}`);
    updateStatusConsole(res.data);

    if (res.ok && res.data.success && res.data.data) {
      const data = res.data.data;
      currentStreamingEpisode = data;
      const ep = data.episode;
      const servers = data.servers || [];

      const titleEl = document.getElementById('streamModalTitle');
      const qualityEl = document.getElementById('streamModalQuality');
      const iframeEl = document.getElementById('streamIframe');
      const serverChipsEl = document.getElementById('streamServerChips');
      const prevBtn = document.getElementById('streamPrevEpBtn');
      const nextBtn = document.getElementById('streamNextEpBtn');
      const syncStatusEl = document.getElementById('streamSyncStatus');

      if (titleEl) {
        titleEl.textContent = `${ep.anime?.title || 'Anime'} • Ep ${ep.number}: ${ep.title}`;
      }
      if (qualityEl) {
        qualityEl.textContent = servers[0]?.quality || '1080p HD';
      }
      if (syncStatusEl) {
        syncStatusEl.textContent = 'Auto-sync ready';
      }

      // Load initial server embed
      if (iframeEl && servers[0]) {
        iframeEl.src = servers[0].embed_url;
      }

      // Populate multi-server CDN buttons
      if (serverChipsEl) {
        serverChipsEl.innerHTML = servers.map((srv, idx) => `
          <button class="btn ${idx === 0 ? 'btn-primary' : 'btn-outline'} btn-sm"
            onclick="switchStreamServer('${srv.id}', '${escapeHtml(srv.embed_url)}', '${escapeHtml(srv.quality)}', this)"
            style="font-size: 0.75rem; padding: 4px 10px;">
            ${escapeHtml(srv.name)} (${escapeHtml(srv.quality)})
          </button>
        `).join('');
      }

      // Navigation pointers (Next / Prev)
      if (prevBtn) {
        if (data.prev_episode) {
          prevBtn.style.display = 'inline-flex';
          prevBtn.textContent = `⏮ Ep ${data.prev_episode.number}`;
          prevBtn.onclick = () => resolveAndPlayEpisode(data.prev_episode.id);
        } else {
          prevBtn.style.display = 'none';
        }
      }

      if (nextBtn) {
        if (data.next_episode) {
          nextBtn.style.display = 'inline-flex';
          nextBtn.textContent = `Ep ${data.next_episode.number} ⏭`;
          nextBtn.onclick = () => resolveAndPlayEpisode(data.next_episode.id);
        } else {
          nextBtn.style.display = 'none';
        }
      }

      openModal('streamModal');
      showToast(`Stream Resolved: ${servers[0]?.name || 'HD Vault'} (${servers[0]?.quality || '1080p HD'})`, 'success');
    } else {
      showToast('Failed to resolve stream sources', 'error');
    }
  }

  window.resolveAndPlayEpisode = resolveAndPlayEpisode;

  window.switchStreamServer = function(serverId, embedUrl, quality, btnEl) {
    const iframeEl = document.getElementById('streamIframe');
    const qualityEl = document.getElementById('streamModalQuality');
    if (iframeEl) iframeEl.src = embedUrl;
    if (qualityEl) qualityEl.textContent = quality;

    const container = document.getElementById('streamServerChips');
    if (container) {
      container.querySelectorAll('button').forEach(b => {
        b.className = 'btn btn-outline btn-sm';
      });
    }
    if (btnEl) btnEl.className = 'btn btn-primary btn-sm';
    showToast(`Switched stream server: ${quality}`, 'info');
  };

  const testStreamResolverBtn = document.getElementById('testStreamResolverBtn');
  if (testStreamResolverBtn) {
    testStreamResolverBtn.addEventListener('click', () => {
      resolveAndPlayEpisode(1);
    });
  }

  const streamSyncNowBtn = document.getElementById('streamSyncNowBtn');
  if (streamSyncNowBtn) {
    streamSyncNowBtn.addEventListener('click', async () => {
      if (!currentStreamingEpisode?.episode?.id) return;
      const epId = currentStreamingEpisode.episode.id;
      showToast('Syncing watch progress to database...', 'info');
      const res = await apiCall('/api/stream/sync', {
        method: 'POST',
        body: JSON.stringify({
          episode_id: epId,
          progress_seconds: 720,
          duration_seconds: 1440
        })
      });
      updateStatusConsole(res.data);
      if (res.ok && res.data.success) {
        const pct = res.data.data.percent_watched || 50;
        showToast(`Watch progress synced! (${pct}% completed)`, 'success');
        const syncStatusEl = document.getElementById('streamSyncStatus');
        if (syncStatusEl) syncStatusEl.textContent = `Synced: ${pct}% watched`;
      } else {
        showToast('Watch sync failed', 'error');
      }
    });
  }

  const testStreamSyncBtn = document.getElementById('testStreamSyncBtn');
  if (testStreamSyncBtn) {
    testStreamSyncBtn.addEventListener('click', async () => {
      showToast('Syncing real-time watch progress (420s / 1440s)...', 'info');
      const res = await apiCall('/api/stream/sync', {
        method: 'POST',
        body: JSON.stringify({
          episode_id: 1,
          progress_seconds: 420,
          duration_seconds: 1440
        })
      });
      updateStatusConsole(res.data);
      if (res.ok) {
        showToast(`Progress synced! Watched: ${res.data.data.percent_watched}%`, 'success');
      } else {
        showToast('Failed to sync progress', 'error');
      }
    });
  }

  // Day 12: Theater Mode Listeners
  const theaterCommentForm = document.getElementById('theaterCommentForm');
  if (theaterCommentForm) {
    theaterCommentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById('theaterCommentInput');
      const content = input ? input.value.trim() : '';
      if (!content || !theaterState.episodeId) return;

      showToast('Posting comment to episode...', 'info');
      const res = await apiCall(`/api/stream/episode/${theaterState.episodeId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content })
      });

      if (res.ok && res.data.success) {
        input.value = '';
        showToast('Comment posted successfully!', 'success');
        loadTheaterComments(theaterState.episodeId);
      } else {
        showToast(res.data.error || 'Failed to post comment', 'error');
      }
    });
  }

  const theaterManualSyncBtn = document.getElementById('theaterManualSyncBtn');
  if (theaterManualSyncBtn) {
    theaterManualSyncBtn.addEventListener('click', () => {
      if (theaterState.episodeId) {
        syncWatchProgress(theaterState.episodeId, theaterState.progressSeconds);
        showToast('Watch progress saved to SQLite!', 'success');
      }
    });
  }

  document.querySelectorAll('#theaterAudioButtons .pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#theaterAudioButtons .pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const audioLang = btn.dataset.audio;
      theaterState.currentAudio = audioLang;
      showToast(`Audio set to ${audioLang}`, 'info');
    });
  });

  const theaterWatchlistBtn = document.getElementById('theaterWatchlistBtn');
  if (theaterWatchlistBtn) {
    theaterWatchlistBtn.addEventListener('click', () => {
      if (theaterState.animeId) {
        openAddWatchlistModal(theaterState.animeId, theaterState.animeTitle, 12);
      }
    });
  }

  const theaterShareBtn = document.getElementById('theaterShareBtn');
  if (theaterShareBtn) {
    theaterShareBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(window.location.href).then(() => {
        showToast('Episode link copied to clipboard!', 'success');
      }).catch(() => {
        showToast('Link: ' + window.location.href, 'info');
      });
    });
  }
});
