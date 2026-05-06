// ============================================================
// RentUp v3 — Shared Utilities
// ============================================================

const CURRENCY_SYMBOLS = { INR: '₹', PKR: '₨', USD: '$', EUR: '€', GBP: '£' };
const Utils = (() => {
  let _currency = localStorage.getItem('rentup_currency') || 'INR';

  function initTheme() { const s = localStorage.getItem('rentup_theme') || 'light'; document.documentElement.setAttribute('data-theme', s); return s; }
  function setTheme(theme) { document.documentElement.setAttribute('data-theme', theme); localStorage.setItem('rentup_theme', theme); updateTopBarIcons(); }
  function toggleTheme() { const n = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'; setTheme(n); return n; }
  function toggleLang() { const n = getLang() === 'en' ? 'hi' : 'en'; setLang(n); updateTopBarIcons(); location.reload(); }

  function initTopBar() { updateTopBarIcons(); $('#btn-toggle-theme').off('click').on('click', toggleTheme); $('#btn-toggle-lang').off('click').on('click', toggleLang); }
  function updateTopBarIcons() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const themeIcon = isDark ? 'sun' : 'moon';
    $('#btn-toggle-theme i').attr('data-lucide', themeIcon);
    $('#btn-toggle-lang').text(getLang() === 'en' ? 'हि' : 'EN');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  function showToast(message, type = 'info') {
    let c = document.querySelector('.toast-container');
    if (!c) { c = document.createElement('div'); c.className = 'toast-container'; document.body.appendChild(c); }
    const toast = document.createElement('div'); toast.className = 'toast toast-' + type;
    const icons = { success: '✓', error: '✗', info: 'ℹ' };
    toast.innerHTML = '<span>' + (icons[type] || '') + '</span><span>' + message + '</span>';
    c.appendChild(toast);
    setTimeout(() => { toast.classList.add('removing'); setTimeout(() => toast.remove(), 300); }, 3500);
  }

  function setCurrency(c) { _currency = c; localStorage.setItem('rentup_currency', c); }
  function getCurrencySymbol() { return CURRENCY_SYMBOLS[_currency] || _currency; }
  function formatCurrency(amount) { return getCurrencySymbol() + ' ' + parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 }); }
  function formatCurrencyNum(amount) { return parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 }); }

  function getCurrentMonth() { const n = new Date(); return n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0'); }
  function formatMonth(monthStr) {
    if (!monthStr) return '';
    const [y, m] = monthStr.split('-');
    if (getLang() === 'hi') { const months = ['जनवरी','फरवरी','मार्च','अप्रैल','मई','जून','जुलाई','अगस्त','सितंबर','अक्टूबर','नवंबर','दिसंबर']; return months[parseInt(m)-1]+' '+y; }
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months[parseInt(m)-1]+' '+y;
  }
  function formatMonthFull(monthStr) {
    if (!monthStr) return '';
    const [y, m] = monthStr.split('-');
    if (getLang() === 'hi') { const months = ['जनवरी','फरवरी','मार्च','अप्रैल','मई','जून','जुलाई','अगस्त','सितंबर','अक्टूबर','नवंबर','दिसंबर']; return months[parseInt(m)-1]+' '+y; }
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return months[parseInt(m)-1]+' '+y;
  }
  function formatDate(dateStr) { if (!dateStr) return ''; return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
  function getPrevMonth(monthStr) { const [y, m] = monthStr.split('-').map(Number); const d = new Date(y, m - 2, 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }

  function requireAuth() { if (!API.getToken()) { window.location.href = 'index.html'; return false; } return true; }
  function initSidebar(activePage) {
    const user = API.getUser();
    if (user) { const i = (user.name || user.email || '?').charAt(0).toUpperCase(); $('.user-avatar').text(i); $('.user-name').text(user.name || 'User'); $('.user-email').text(user.email || ''); }
    $('[data-i18n]').each(function () { $(this).text(t($(this).data('i18n'))); });
    $('[data-i18n-ph]').each(function () { $(this).attr('placeholder', t($(this).data('i18n-ph'))); });
    $('.nav-link[data-page="' + activePage + '"]').addClass('active');
    $('.sidebar-toggle').off('click').on('click', function () { $('.sidebar').toggleClass('open'); $('.sidebar-overlay').toggleClass('active'); });
    $('.sidebar-overlay').off('click').on('click', function () { $('.sidebar').removeClass('open'); $(this).removeClass('active'); });
    $('.sidebar .nav-link').on('click', function () { if (window.innerWidth <= 768) { $('.sidebar').removeClass('open'); $('.sidebar-overlay').removeClass('active'); } });
  }
  function logout() { API.clearToken(); window.location.href = 'index.html'; }
  function confirm(message) { return window.confirm(message); }

  function cacheSet(key, data) { try { sessionStorage.setItem('rentup_' + key, JSON.stringify({ ts: Date.now(), data })); } catch {} }
  function cacheGet(key, maxAge = 60000) { try { const item = JSON.parse(sessionStorage.getItem('rentup_' + key)); if (item && (Date.now() - item.ts) < maxAge) return item.data; } catch {} return null; }
  function cacheClear(prefix) { Object.keys(sessionStorage).forEach(k => { if (k.startsWith('rentup_' + (prefix || ''))) sessionStorage.removeItem(k); }); }

  // Status helpers
  function getStatusLabel(isPaid) { return isPaid === 1 ? t('status_paid') : isPaid === 2 ? t('status_partial') : t('status_unpaid'); }
  function getStatusClass(isPaid) { return isPaid === 1 ? 'badge-success' : isPaid === 2 ? 'badge-warning' : 'badge-danger'; }

  // Hindi font for PDF
  let _fontCache = null;
  async function loadHindiFont() {
    if (_fontCache) return _fontCache;
    const cached = localStorage.getItem('rentup_hindi_font');
    if (cached) { _fontCache = cached; return cached; }
    try {
      const res = await fetch('https://cdn.jsdelivr.net/gh/nicholasgasior/gfonts@master/fonts/noto_sans_devanagari/NotoSansDevanagari-Regular.ttf');
      if (!res.ok) throw new Error('Font fetch failed');
      const buf = await res.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      const b64 = btoa(binary);
      try { localStorage.setItem('rentup_hindi_font', b64); } catch {}
      _fontCache = b64;
      return b64;
    } catch (e) { console.warn('Hindi font load failed:', e); return null; }
  }

  async function preparePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    if (getLang() === 'hi') {
      const fontData = await loadHindiFont();
      if (fontData) {
        doc.addFileToVFS('NotoSansDevanagari.ttf', fontData);
        doc.addFont('NotoSansDevanagari.ttf', 'NotoSansDevanagari', 'normal');
        doc.setFont('NotoSansDevanagari');
      }
    }
    return doc;
  }

  return {
    initTheme, setTheme, toggleTheme, toggleLang, initTopBar,
    showToast, setCurrency, getCurrencySymbol, formatCurrency, formatCurrencyNum,
    getCurrentMonth, formatMonth, formatMonthFull, formatDate, getPrevMonth,
    requireAuth, initSidebar, logout, confirm,
    cacheSet, cacheGet, cacheClear,
    getStatusLabel, getStatusClass,
    loadHindiFont, preparePDF,
  };
})();
