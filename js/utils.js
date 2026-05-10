// ============================================================
// RentUp — Shared Utilities
// ============================================================
const CURRENCY_SYMBOLS = { INR: '₹', PKR: '₨', USD: '$', EUR: '€', GBP: '£' };
const Utils = (() => {
  let _currency = localStorage.getItem('rentup_currency') || 'INR';
  function initTheme() { const s = localStorage.getItem('rentup_theme') || 'light'; document.documentElement.setAttribute('data-theme', s); return s; }
  function setTheme(theme) { document.documentElement.setAttribute('data-theme', theme); localStorage.setItem('rentup_theme', theme); updateTopBarIcons(); }
  function toggleTheme() { const n = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'; setTheme(n); return n; }
  function toggleLang() { const n = getLang() === 'en' ? 'hi' : 'en'; setLang(n); updateTopBarIcons(); location.reload(); }
  function initTopBar() { updateTopBarIcons(); $('#btn-toggle-theme').off('click').on('click', toggleTheme); $('#btn-toggle-lang').off('click').on('click', toggleLang); }
  function updateTopBarIcons() { const isDark = document.documentElement.getAttribute('data-theme') === 'dark'; $('#btn-toggle-theme i').attr('data-lucide', isDark ? 'sun' : 'moon'); $('#btn-toggle-lang').text(getLang() === 'en' ? 'हि' : 'EN'); if (typeof lucide !== 'undefined') lucide.createIcons(); }
  function showToast(message, type = 'info') { let c = document.querySelector('.toast-container'); if (!c) { c = document.createElement('div'); c.className = 'toast-container'; document.body.appendChild(c); } const toast = document.createElement('div'); toast.className = 'toast toast-' + type; const icons = { success: '✓', error: '✗', info: 'ℹ' }; toast.innerHTML = '<span>' + (icons[type] || '') + '</span><span>' + message + '</span>'; c.appendChild(toast); setTimeout(() => { toast.classList.add('removing'); setTimeout(() => toast.remove(), 300); }, 3500); }
  function setCurrency(c) { _currency = c; localStorage.setItem('rentup_currency', c); }
  function getCurrencySymbol() { return CURRENCY_SYMBOLS[_currency] || _currency; }
  function formatCurrency(amount) { return getCurrencySymbol() + ' ' + parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 }); }
  function formatCurrencyNum(amount) { return parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 }); }
  function getCurrentMonth() { const n = new Date(); return n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0'); }
  function formatMonth(monthStr) { if (!monthStr) return ''; const [y, m] = monthStr.split('-'); if (getLang() === 'hi') { const ms = ['जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर']; return ms[parseInt(m) - 1] + ' ' + y; } return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][parseInt(m) - 1] + ' ' + y; }
  function formatMonthFull(monthStr) { if (!monthStr) return ''; const [y, m] = monthStr.split('-'); if (getLang() === 'hi') { const ms = ['जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर']; return ms[parseInt(m) - 1] + ' ' + y; } return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][parseInt(m) - 1] + ' ' + y; }
  function formatDate(dateStr) { if (!dateStr) return ''; return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
  function getPrevMonth(monthStr) { const [y, m] = monthStr.split('-').map(Number); const d = new Date(y, m - 2, 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
  function requireAuth() { if (!API.getToken()) { window.location.href = 'index.html'; return false; } return true; }
  function initSidebar(activePage) { const user = API.getUser(); if (user) { $('.user-avatar').text((user.name || '?').charAt(0).toUpperCase()); $('.user-name').text(user.name || 'User'); $('.user-email').text(user.email || ''); } $('[data-i18n]').each(function () { $(this).text(t($(this).data('i18n'))); }); $('.nav-link[data-page="' + activePage + '"]').addClass('active'); const savedState = localStorage.getItem('rentup_sidebar_state'); if (window.innerWidth > 768 && savedState === 'collapsed') { $('.sidebar, .main-content').css('transition', 'none'); $('body').addClass('sidebar-collapsed'); $('#sidebar-toggle').addClass('active'); setTimeout(() => { $('.sidebar, .main-content').css('transition', ''); }, 50); } $('#sidebar-toggle').off('click').on('click', function () { if (window.innerWidth <= 768) { $('body').toggleClass('sidebar-open'); $(this).toggleClass('active'); } else { const isCollapsed = $('body').toggleClass('sidebar-collapsed').hasClass('sidebar-collapsed'); $(this).toggleClass('active'); localStorage.setItem('rentup_sidebar_state', isCollapsed ? 'collapsed' : 'open'); } }); $('.sidebar-overlay').off('click').on('click', function () { $('body').removeClass('sidebar-open'); $('#sidebar-toggle').removeClass('active'); }); $('.sidebar .nav-link').on('click', function () { if (window.innerWidth <= 768) { $('body').removeClass('sidebar-open'); $('#sidebar-toggle').removeClass('active'); } }); }
  function logout() { API.clearToken(); window.location.href = 'index.html'; }
  function confirm(msg) { return window.confirm(msg); }
  function cacheSet(key, data) { try { sessionStorage.setItem('rentup_' + key, JSON.stringify({ ts: Date.now(), data })); } catch { } }
  function cacheGet(key, maxAge = 60000) { try { const item = JSON.parse(sessionStorage.getItem('rentup_' + key)); if (item && (Date.now() - item.ts) < maxAge) return item.data; } catch { } return null; }
  function cacheClear(prefix) { Object.keys(sessionStorage).forEach(k => { if (k.startsWith('rentup_' + (prefix || ''))) sessionStorage.removeItem(k); }); }
  function getStatusLabel(isPaid) { return isPaid === 1 ? t('status_paid') : isPaid === 2 ? t('status_partial') : t('status_unpaid'); }
  function getStatusClass(isPaid) { return isPaid === 1 ? 'badge-success' : isPaid === 2 ? 'badge-warning' : 'badge-danger'; }

  return { initTheme, setTheme, toggleTheme, toggleLang, initTopBar, showToast, setCurrency, getCurrencySymbol, formatCurrency, formatCurrencyNum, getCurrentMonth, formatMonth, formatMonthFull, formatDate, getPrevMonth, requireAuth, initSidebar, logout, confirm, cacheSet, cacheGet, cacheClear, getStatusLabel, getStatusClass };
})();
