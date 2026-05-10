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
  // generateHTMLPDF — Fixed v5 (cross-screen)
  //
  // ROOT CAUSE (confirmed from PDF comparison):
  //   The laptop export shows only the RIGHT half of a 2-column chart
  //   grid and only the last 2 columns of the table — classic sign that
  //   html2canvas is using the PARENT page's viewport width (e.g. 1440px)
  //   to lay out content, then capturing only the first 794px of that
  //   wide layout. The left portion of each row falls inside those first
  //   794px but the header/title area is cropped at the top because the
  //   parent page is scrolled down.
  //
  //   html2canvas reads window.innerWidth and document.documentElement
  //   from the PARENT window, not from the iframe — so windowWidth: pxWidth
  //   alone is insufficient. It only sets the canvas clip width, not the
  //   reflow width.
  //
  // FIX: Inject html2canvas + html2pdf scripts INTO the iframe itself,
  //   then run the capture entirely inside the iframe's own window context.
  //   Inside the iframe, window.innerWidth IS pxWidth, so layout,
  //   capture, and clipping are all consistent and screen-independent.
  //
  // Changes from v4:
  //   1. Load html2canvas script tag inside the iframe (same CDN src).
  //   2. Load jsPDF + html2pdf scripts inside the iframe.
  //   3. Run html2pdf().set(opt).from(target).save() inside iWindow,
  //      not in the parent window.
  //   4. iframe height set to body.scrollHeight BEFORE capture (from v4).
  //   5. Iframe positioned offscreen LEFT so capture always works.
  // ============================================================
  async function generateHTMLPDF(htmlStr, filename, isLandscape = false) {
    const pxWidth  = isLandscape ? 1123 : 794;
    const pxHeight = isLandscape ? 794  : 1123;

    // ── 1. Resolve CDN URLs for html2canvas + html2pdf from parent page ──
    // We reuse the same scripts already loaded on the parent page so
    // there's no version mismatch.
    function getScriptSrc(keyword) {
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      const match = scripts.find(s => s.src && s.src.toLowerCase().includes(keyword));
      return match ? match.src : null;
    }
    const html2canvasSrc = getScriptSrc('html2canvas') || 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    const jspdfSrc       = getScriptSrc('jspdf')       || 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    const html2pdfSrc    = getScriptSrc('html2pdf')    || 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';

    // ── 2. Create iframe: offscreen LEFT, will grow to content height ──
    const iframe = document.createElement('iframe');
    iframe.style.cssText =
      'position:fixed;top:0;left:-' + (pxWidth + 20) + 'px;' +
      'width:' + pxWidth + 'px;height:' + pxHeight + 'px;' +
      'border:none;z-index:-9999;';
    document.body.appendChild(iframe);

    const iDoc    = iframe.contentDocument || iframe.contentWindow.document;
    const iWindow = iframe.contentWindow;

    // ── 3. Write isolated page WITH the pdf scripts injected inside ──
    iDoc.open();
    iDoc.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=${pxWidth}">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    width: ${pxWidth}px;
    min-height: 100%;
    font-family: Arial, Helvetica, sans-serif;
    background: #fff;
    color: #333;
  }
  table { display: table !important; width: 100% !important; border-collapse: collapse !important; }
  thead { display: table-header-group !important; }
  tbody { display: table-row-group !important; }
  tfoot { display: table-footer-group !important; }
  tr    { display: table-row !important; }
  td, th { display: table-cell !important; }
  td::before { display: none !important; }
</style>
</head>
<body>${htmlStr}</body>
</html>`);
    iDoc.close();

    // ── 4. Wait for iframe document to fully load ────────────────────
    await new Promise(r => {
      if (iDoc.readyState === 'complete') setTimeout(r, 150);
      else iframe.onload = () => setTimeout(r, 150);
    });
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

    // ── 5. Resize iframe to actual content height (no clipping) ──────
    const contentHeight = iDoc.body.scrollHeight;
    iframe.style.height = contentHeight + 'px';
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

    // ── 6. Inject html2canvas + html2pdf INTO the iframe ─────────────
    //   This is the key fix: all rendering happens inside the iframe's
    //   own window where window.innerWidth === pxWidth.
    await new Promise((resolve, reject) => {
      // html2pdf bundle already includes html2canvas + jsPDF in one file.
      // Try to load the bundle first; fall back to separate scripts.
      const tryBundle = () => new Promise((res, rej) => {
        const s = iDoc.createElement('script');
        s.src = html2pdfSrc;
        s.onload = res;
        s.onerror = rej;
        iDoc.head.appendChild(s);
      });

      const tryIndividual = async () => {
        for (const src of [html2canvasSrc, jspdfSrc]) {
          await new Promise((res, rej) => {
            const s = iDoc.createElement('script');
            s.src = src;
            s.onload = res;
            s.onerror = rej;
            iDoc.head.appendChild(s);
          });
        }
      };

      tryBundle()
        .then(() => {
          // If html2pdf bundle loaded, html2canvas and jsPDF are included
          if (typeof iWindow.html2pdf === 'function') { resolve(); return; }
          // Bundle loaded but html2pdf not exposed — try individual
          return tryIndividual().then(resolve).catch(reject);
        })
        .catch(() => tryIndividual().then(resolve).catch(reject));
    });

    // ── 7. Build the pdf options and run INSIDE the iframe window ────
    const target = iDoc.getElementById('pdf-export-wrap') || iDoc.body;

    const opt = {
      margin: [8, 8, 8, 8],
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        width: pxWidth,
        windowWidth: pxWidth,
        windowHeight: contentHeight,
        scrollX: 0,
        scrollY: 0,
        backgroundColor: '#ffffff',
        logging: false,
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: isLandscape ? 'landscape' : 'portrait',
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    };

    try {
      // Run html2pdf inside the iframe's window context
      const pdf = iWindow.html2pdf || window.html2pdf;
      await pdf().set(opt).from(target).save();
    } finally {
      document.body.removeChild(iframe);
    }
  }


  return { initTheme, setTheme, toggleTheme, toggleLang, initTopBar, showToast, setCurrency, getCurrencySymbol, formatCurrency, formatCurrencyNum, getCurrentMonth, formatMonth, formatMonthFull, formatDate, getPrevMonth, requireAuth, initSidebar, logout, confirm, cacheSet, cacheGet, cacheClear, getStatusLabel, getStatusClass, generateHTMLPDF };
})();
