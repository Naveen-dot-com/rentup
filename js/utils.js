// ============================================================
// RentUp — Shared Utilities
// ============================================================

const Utils = (() => {

  // ---- Theme Management ----
  function initTheme() {
    const saved = localStorage.getItem('rentup_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    return saved;
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('rentup_theme', theme);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    setTheme(next);
    return next;
  }

  // ---- Toast Notifications ----
  function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    const icons = { success: '✓', error: '✗', info: 'ℹ' };
    toast.innerHTML = '<span>' + (icons[type] || '') + '</span><span>' + message + '</span>';
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // ---- Currency Formatting ----
  function formatCurrency(amount) {
    const currency = localStorage.getItem('rentup_currency') || 'PKR';
    return currency + ' ' + parseFloat(amount || 0).toLocaleString('en-US', {
      minimumFractionDigits: 0, maximumFractionDigits: 2
    });
  }

  // ---- Date/Month Helpers ----
  function getCurrentMonth() {
    const now = new Date();
    return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  }

  function formatMonth(monthStr) {
    if (!monthStr) return '';
    const [y, m] = monthStr.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[parseInt(m) - 1] + ' ' + y;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  // ---- Auth Guard ----
  function requireAuth() {
    if (!API.getToken()) {
      window.location.href = 'index.html';
      return false;
    }
    return true;
  }

  // ---- Sidebar Init ----
  function initSidebar(activePage) {
    const user = API.getUser();
    if (user) {
      const initials = (user.name || user.email || '?').charAt(0).toUpperCase();
      $('.user-avatar').text(initials);
      $('.user-name').text(user.name || 'User');
      $('.user-email').text(user.email || '');
    }
    $('.nav-link[data-page="' + activePage + '"]').addClass('active');

    // Mobile toggle
    $('.sidebar-toggle').on('click', function () {
      $('.sidebar').toggleClass('open');
      $('.sidebar-overlay').toggleClass('active');
    });
    $('.sidebar-overlay').on('click', function () {
      $('.sidebar').removeClass('open');
      $(this).removeClass('active');
    });
  }

  // ---- Logout ----
  function logout() {
    API.clearToken();
    window.location.href = 'index.html';
  }

  // ---- Confirm Dialog ----
  function confirm(message) {
    return window.confirm(message);
  }

  // ---- Debounce ----
  function debounce(fn, delay = 300) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  return {
    initTheme, setTheme, toggleTheme,
    showToast, formatCurrency, getCurrentMonth,
    formatMonth, formatDate, requireAuth,
    initSidebar, logout, confirm, debounce,
  };
})();
