// ============================================================
// RentUp v7 P — Shared Utilities
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

  // ============================================================
  // generateHTMLPDF — v7 FINAL (Parent-window only, no iframe)
  //
  // ROOT CAUSE of all previous failures:
  //   html2pdf.js / jsPDF triggered inside an <iframe> cannot initiate
  //   a file download on GitHub Pages (HTTPS). Browsers block blob-URL
  //   navigation from sandboxed/cross-origin iframe contexts.
  //   The toast appeared because html2pdf().save() resolved its Promise
  //   successfully — but the actual download was silently blocked.
  //
  // THIS APPROACH (no iframe, no html2pdf):
  //   1. Inject the HTML into a hidden <div> directly in the PARENT document.
  //   2. Force that div to exactly A4 pixel width with position:fixed offscreen.
  //   3. Capture it with html2canvas (runs in parent window — no sandbox issues).
  //   4. Slice the tall canvas into A4-height pages manually.
  //   5. Build the PDF with jsPDF directly in the parent window.
  //   6. Call jsPDF.save() — download fires immediately, 100% of the time.
  //
  // WHY THIS WORKS ON ALL SCREEN SIZES:
  //   The hidden div is position:fixed with an explicit width (794px or 1123px).
  //   The parent page's viewport width doesn't matter — the div is always A4 wide.
  //   html2canvas receives windowWidth:pxWidth so it reflows to A4 width too.
  // ============================================================
  async function generateHTMLPDF(htmlStr, filename, isLandscape = false) {
    // A4 at 96dpi: portrait = 794×1123px, landscape = 1123×794px
    const pxWidth  = isLandscape ? 1123 : 794;
    const pxHeight = isLandscape ? 794  : 1123;

    // ── 1. Build a hidden render container in the PARENT document ────
    const wrapper = document.createElement('div');
    wrapper.id = '__pdf_render_wrap__';
    wrapper.style.cssText = [
      'position:fixed',
      'top:0',
      'left:-' + (pxWidth + 40) + 'px',  // offscreen left — always rendered, never visible
      'width:' + pxWidth + 'px',
      'min-height:' + pxHeight + 'px',
      'background:#ffffff',
      'color:#333333',
      'font-family:Arial,Helvetica,sans-serif',
      'font-size:14px',
      'line-height:1.5',
      'overflow:visible',
      'z-index:99999',
      'box-sizing:border-box',
    ].join(';');

    // Inject reset styles + content
    wrapper.innerHTML = `
      <style>
        #__pdf_render_wrap__ *, #__pdf_render_wrap__ *::before, #__pdf_render_wrap__ *::after {
          box-sizing: border-box !important;
        }
        #__pdf_render_wrap__ table {
          display: table !important;
          width: 100% !important;
          border-collapse: collapse !important;
          table-layout: fixed !important;
        }
        #__pdf_render_wrap__ thead  { display: table-header-group !important; }
        #__pdf_render_wrap__ tbody  { display: table-row-group !important; }
        #__pdf_render_wrap__ tfoot  { display: table-footer-group !important; }
        #__pdf_render_wrap__ tr     { display: table-row !important; }
        #__pdf_render_wrap__ td,
        #__pdf_render_wrap__ th     { display: table-cell !important; }
        #__pdf_render_wrap__ td::before,
        #__pdf_render_wrap__ th::before { display: none !important; content: none !important; }
        #__pdf_render_wrap__ img    { max-width: 100% !important; height: auto !important; }
      </style>
      ${htmlStr}
    `;

    document.body.appendChild(wrapper);

    // ── 2. Let the browser fully paint the injected DOM ──────────────
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    await new Promise(r => setTimeout(r, 150));

    // ── 3. Capture with html2canvas in parent window context ─────────
    let canvas;
    try {
      canvas = await html2canvas(wrapper, {
        scale: 2,                       // 2× for crisp text
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: pxWidth,
        windowWidth: pxWidth,           // forces A4-width reflow
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
        logging: false,
      });
    } finally {
      // Always remove the render div whether capture succeeds or fails
      document.body.removeChild(wrapper);
    }

    // ── 4. Slice canvas into A4 pages & build PDF with jsPDF ─────────
    // A4 in mm: 210×297 portrait, 297×210 landscape
    const mmWidth  = isLandscape ? 297 : 210;
    const mmHeight = isLandscape ? 210 : 297;

    // How many canvas pixels equal one A4 page height?
    // canvas.width = pxWidth * scale(2), so scale factor = canvas.width / pxWidth
    const scaleFactor   = canvas.width / pxWidth;
    const pageHeightPx  = pxHeight * scaleFactor;   // canvas pixels per A4 page
    const totalHeight   = canvas.height;
    const totalPages    = Math.ceil(totalHeight / pageHeightPx);

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) pdf.addPage();

      // Slice: one A4 page worth of canvas pixels
      const srcY      = page * pageHeightPx;
      const srcH      = Math.min(pageHeightPx, totalHeight - srcY);

      const pageCanvas    = document.createElement('canvas');
      pageCanvas.width    = canvas.width;
      pageCanvas.height   = srcH;
      const ctx = pageCanvas.getContext('2d');
      ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);

      const imgData = pageCanvas.toDataURL('image/jpeg', 0.97);

      // Scale image to fill A4 width; height proportional
      const imgHeightMm = (srcH / scaleFactor / pxWidth) * mmWidth;
      pdf.addImage(imgData, 'JPEG', 0, 0, mmWidth, imgHeightMm);
    }

    // ── 5. Save — runs in parent window, always triggers download ─────
    pdf.save(filename);
  }

  return { initTheme, setTheme, toggleTheme, toggleLang, initTopBar, showToast, setCurrency, getCurrencySymbol, formatCurrency, formatCurrencyNum, getCurrentMonth, formatMonth, formatMonthFull, formatDate, getPrevMonth, requireAuth, initSidebar, logout, confirm, cacheSet, cacheGet, cacheClear, getStatusLabel, getStatusClass, generateHTMLPDF };
})();
