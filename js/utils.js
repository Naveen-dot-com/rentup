// ============================================================
// RentUp v2 — Shared Utilities
// ============================================================

const Utils = (() => {
  let _currency = localStorage.getItem('rentup_currency') || 'INR';

  // ---- Theme ----
  function initTheme() {
    const saved = localStorage.getItem('rentup_theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    return saved;
  }
  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('rentup_theme', theme);
    updateTopBarIcons();
  }
  function toggleTheme() {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    setTheme(next);
    return next;
  }

  // ---- Language ----
  function toggleLang() {
    const next = getLang() === 'en' ? 'hi' : 'en';
    setLang(next);
    updateTopBarIcons();
    location.reload();
  }

  // ---- TopBar (theme + language toggle) ----
  function initTopBar() {
    updateTopBarIcons();
    $('#btn-toggle-theme').off('click').on('click', toggleTheme);
    $('#btn-toggle-lang').off('click').on('click', toggleLang);
  }
  function updateTopBarIcons() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    $('#btn-toggle-theme').attr('title', isDark ? 'Light Mode' : 'Dark Mode');
    const themeIcon = isDark ? 'sun' : 'moon';
    $('#btn-toggle-theme i').attr('data-lucide', themeIcon);
    const lang = getLang();
    $('#btn-toggle-lang').text(lang === 'en' ? 'हि' : 'EN');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  // ---- Toast ----
  function showToast(message, type = 'info') {
    let c = document.querySelector('.toast-container');
    if (!c) { c = document.createElement('div'); c.className = 'toast-container'; document.body.appendChild(c); }
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    const icons = { success: '✓', error: '✗', info: 'ℹ' };
    toast.innerHTML = '<span>' + (icons[type] || '') + '</span><span>' + message + '</span>';
    c.appendChild(toast);
    setTimeout(() => { toast.classList.add('removing'); setTimeout(() => toast.remove(), 300); }, 3500);
  }

  // ---- Currency ----
  function setCurrency(c) { _currency = c; localStorage.setItem('rentup_currency', c); }
  function formatCurrency(amount) {
    return _currency + ' ' + parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  // ---- Date Helpers ----
  function getCurrentMonth() {
    const n = new Date();
    return n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0');
  }
  function formatMonth(monthStr) {
    if (!monthStr) return '';
    const [y, m] = monthStr.split('-');
    const lang = getLang();
    if (lang === 'hi') {
      const months = ['जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];
      return months[parseInt(m) - 1] + ' ' + y;
    }
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[parseInt(m) - 1] + ' ' + y;
  }
  function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  function getPrevMonth(monthStr) {
    const [y, m] = monthStr.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  // ---- Auth Guard ----
  function requireAuth() {
    if (!API.getToken()) { window.location.href = 'index.html'; return false; }
    return true;
  }

  // ---- Sidebar ----
  function initSidebar(activePage) {
    const user = API.getUser();
    if (user) {
      const initials = (user.name || user.email || '?').charAt(0).toUpperCase();
      $('.user-avatar').text(initials);
      $('.user-name').text(user.name || 'User');
      $('.user-email').text(user.email || '');
    }
    // Translate nav labels
    $('[data-i18n]').each(function () {
      const key = $(this).data('i18n');
      $(this).text(t(key));
    });
    $('.nav-link[data-page="' + activePage + '"]').addClass('active');

    // Mobile toggle
    $('.sidebar-toggle').off('click').on('click', function () {
      $('.sidebar').toggleClass('open');
      $('.sidebar-overlay').toggleClass('active');
    });
    $('.sidebar-overlay').off('click').on('click', function () {
      $('.sidebar').removeClass('open');
      $(this).removeClass('active');
    });

    // Close sidebar on nav click (mobile)
    $('.sidebar .nav-link').on('click', function () {
      if (window.innerWidth <= 768) {
        $('.sidebar').removeClass('open');
        $('.sidebar-overlay').removeClass('active');
      }
    });
  }

  function logout() { API.clearToken(); window.location.href = 'index.html'; }
  function confirm(message) { return window.confirm(message); }
  function debounce(fn, delay = 300) {
    let timer;
    return function (...args) { clearTimeout(timer); timer = setTimeout(() => fn.apply(this, args), delay); };
  }

  // ---- Session Cache ----
  function cacheSet(key, data) {
    try { sessionStorage.setItem('rentup_' + key, JSON.stringify({ ts: Date.now(), data })); } catch {}
  }
  function cacheGet(key, maxAge = 60000) {
    try {
      const item = JSON.parse(sessionStorage.getItem('rentup_' + key));
      if (item && (Date.now() - item.ts) < maxAge) return item.data;
    } catch {}
    return null;
  }
  function cacheClear(prefix) {
    Object.keys(sessionStorage).forEach(k => {
      if (k.startsWith('rentup_' + (prefix || ''))) sessionStorage.removeItem(k);
    });
  }

  return {
    initTheme, setTheme, toggleTheme, toggleLang,
    initTopBar, showToast, setCurrency, formatCurrency,
    getCurrentMonth, formatMonth, formatDate, getPrevMonth,
    requireAuth, initSidebar, logout, confirm, debounce,
    cacheSet, cacheGet, cacheClear,
  };
})();
