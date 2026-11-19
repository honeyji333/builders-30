/**
 * AnimeVault • Client Application (Day 8: Frontend Setup, Routing & Auth)
 * #ALTABuilder30 • Full-Stack Anime Streaming Platform
 */

// Application State
const state = {
  user: null,
  token: localStorage.getItem('animevault_token') || null,
  currentRoute: window.location.hash || '#/'
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
    credentials: 'include' // include cookies
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

  // Trigger enter animation
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ===================================================================
// Authentication Controller
// ===================================================================

/**
 * Check existing session using token or HTTP cookie
 */
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

/**
 * Handle Login Form Submit
 */
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
    // Save JWT token
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

/**
 * Handle Signup Form Submit
 */
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

  // Client-side validations matching Day 4 & Day 5 specs
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

/**
 * Handle Logout
 */
async function handleLogout() {
  const res = await apiCall('/api/auth/logout', { method: 'POST' });

  // Clear client session
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

// ===================================================================
// UI State & Render Helpers
// ===================================================================

function renderAuthState(isAuthenticated) {
  const guestGroup = document.getElementById('authGuestGroup');
  const userGroup = document.getElementById('authUserGroup');
  const usernameSpan = document.getElementById('navUsername');
  const userAvatarSpan = document.getElementById('navAvatar');

  // Milestone Tester Card elements
  const statusPill = document.getElementById('testerStatusPill');
  const testerUsername = document.getElementById('testerUsername');
  const testerEmail = document.getElementById('testerEmail');
  const testerTokenStatus = document.getElementById('testerTokenStatus');

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
    if (testerTokenStatus) testerTokenStatus.textContent = state.token ? `${state.token.slice(0, 16)}...` : 'HTTP-Only Cookie';
  } else {
    if (guestGroup) guestGroup.style.display = 'flex';
    if (userGroup) userGroup.style.display = 'none';

    if (statusPill) {
      statusPill.className = 'status-pill guest';
      statusPill.textContent = '⚪ Guest Mode';
    }
    if (testerUsername) testerUsername.textContent = 'Not Logged In';
    if (testerEmail) testerEmail.textContent = 'None';
    if (testerTokenStatus) testerTokenStatus.textContent = 'None';
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
// Client-Side Routing
// ===================================================================
function navigateTo(hash) {
  if (window.location.hash !== hash) {
    window.location.hash = hash;
  } else {
    handleRouting();
  }
}

function handleRouting() {
  const hash = window.location.hash || '#/';
  state.currentRoute = hash;

  // Update active nav links
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('href') === hash) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Handle route destinations
  if (hash === '#/login') {
    openModal('loginModal');
  } else if (hash === '#/signup') {
    openModal('signupModal');
  } else if (hash === '#/watchlist') {
    if (!state.user) {
      showToast('Please sign in to view your Watchlist', 'info');
      openModal('loginModal');
    } else {
      showToast('Watchlist screen opens in Day 9!', 'info');
    }
  } else if (hash === '#/catalog') {
    const catalogEl = document.getElementById('catalogSection');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth' });
    }
  }
}

// ===================================================================
// Modal Management & Keyboard Accessibility
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
// Catalog Preview Fetcher (Day 8 Sneak Peek)
// ===================================================================
async function fetchFeaturedAnime() {
  const grid = document.getElementById('animeGrid');
  if (!grid) return;

  grid.innerHTML = '<div style=\"grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 40px;\">Loading featured anime catalogue...</div>';

  const res = await apiCall('/api/anime?limit=6');

  if (res.ok && res.data.success && res.data.data && res.data.data.length > 0) {
    grid.innerHTML = res.data.data.map(anime => `
      <div class="anime-card" onclick="showToast('Detail page opens in Day 9: ${escapeHtml(anime.title)}', 'info')">
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
  } else {
    grid.innerHTML = '<div style=\"grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 40px;\">Connect database seed to view full catalog.</div>';
  }
}

// ===================================================================
// Setup Event Listeners
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Check session on load
  checkAuthSession();

  // Load preview anime
  fetchFeaturedAnime();

  // Client routing listeners
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

  // Close modal when clicking outside backdrop
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal(backdrop.id);
    });
  });

  // ESC key to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllModals();
  });

  // Password visibility toggles
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

  // Test Console Buttons
  const testMeBtn = document.getElementById('testMeBtn');
  if (testMeBtn) {
    testMeBtn.addEventListener('click', async () => {
      const res = await apiCall('/api/auth/me');
      updateStatusConsole(res.data);
      if (res.ok) showToast('Session valid: Verified with /api/auth/me', 'success');
      else showToast('401 Unauthorized: No active session', 'error');
    });
  }

  const testHealthBtn = document.getElementById('testHealthBtn');
  if (testHealthBtn) {
    testHealthBtn.addEventListener('click', async () => {
      const res = await apiCall('/health');
      updateStatusConsole(res.data);
      showToast('Health check: Status OK', 'success');
    });
  }
});
