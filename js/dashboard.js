// ============================================================
// RentUp v4 — Dashboard with 4 Charts, Filters, PDF Report
// ============================================================
$(function () {
  if (!Utils.requireAuth()) return;
  Utils.initTheme(); Utils.initSidebar('dashboard'); Utils.initTopBar(); lucide.createIcons();
  $('[data-i18n]').each(function () { $(this).text(t($(this).data('i18n'))); });

  let dashData = null, allBills = [];
  let charts = {};

  // Populate filter dropdowns
  const curYear = new Date().getFullYear();
  for (let y = curYear; y >= curYear - 5; y--) $('#chart-year').append(`<option value="${y}">${y}</option>`);
  $('#chart-year').prepend('<option value="">All Years</option>');

  async function loadSettings() { try { const r = await API.getSettings(); Utils.setCurrency(r.data.currency || 'INR'); } catch {} }

  async function loadDashboard() {
    const month = Utils.getCurrentMonth();
    try {
      const res = await API.getDashboard(month);
      dashData = res.data;
      $('#stat-properties').text(res.data.total_properties);
      $('#stat-rooms').text(res.data.total_rooms);
      $('#stat-revenue').text(Utils.formatCurrency(res.data.monthly_revenue));
      $('#stat-unpaid').text(res.data.unpaid_count);
      renderRecentBills(res.data.recent_bills || []);
    } catch (e) { Utils.showToast(e.message, 'error'); }
  }

  async function loadFilters() {
    try {
      const [pRes, rRes] = await Promise.all([API.getProperties(), API.getRooms()]);
      pRes.data.forEach(p => $('#chart-property').append(`<option value="${p.id}">${p.name}</option>`));
      rRes.data.forEach(r => $('#chart-room').append(`<option value="${r.id}">${r.name} (${r.property_name})</option>`));
    } catch {}
  }

  async function loadAllBills() {
    try {
      const res = await API.getBills(); // all bills, no filter
      allBills = res.data;
      renderCharts();
    } catch {}
  }

  function getFilteredBills() {
    let bills = [...allBills];
    const year = $('#chart-year').val();
    const propId = $('#chart-property').val();
    const roomId = $('#chart-room').val();
    if (year) bills = bills.filter(b => b.month.startsWith(year));
    if (propId) bills = bills.filter(b => {
      const room = allBills.find(x => x.id === b.id);
      return String(b.property_name) === String($('#chart-property option:selected').text());
    });
    if (propId) bills = bills.filter(b => b.property_name === $('#chart-property option:selected').text());
    if (roomId) bills = bills.filter(b => String(b.room_id) === String(roomId));
    return bills;
  }

  function aggregateByMonth(bills) {
    const map = {};
    bills.forEach(b => {
      if (!map[b.month]) map[b.month] = { rent: 0, electricity: 0, elec_units: 0, gas: 0, gas_units: 0, total: 0 };
      map[b.month].rent += b.rent_amount;
      map[b.month].electricity += b.electricity_amount;
      map[b.month].elec_units += b.electricity_units;
      map[b.month].gas += b.gas_amount;
      map[b.month].gas_units += b.gas_units || 0;
      map[b.month].total += b.total_amount;
    });
    return Object.keys(map).sort().map(m => ({ month: m, ...map[m] }));
  }

  function renderCharts() {
    const bills = getFilteredBills();
    const data = aggregateByMonth(bills);
    const labels = data.map(d => Utils.formatMonth(d.month));
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const textColor = isDark ? '#9c9cb5' : '#555577';
    const commonOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: textColor, font: { family: 'Inter', size: 11 } } } }, scales: { x: { grid: { display: false }, ticks: { color: textColor, font: { size: 10 } } }, y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 10 } } } } };

    // 1. Revenue Stacked Bar
    if (charts.revenue) charts.revenue.destroy();
    charts.revenue = new Chart(document.getElementById('chart-revenue'), {
      type: 'bar', data: { labels, datasets: [
        { label: t('chart_rent'), data: data.map(d => d.rent), backgroundColor: '#6c5ce7', borderRadius: 4 },
        { label: t('chart_electricity'), data: data.map(d => d.electricity), backgroundColor: '#00cec9', borderRadius: 4 },
        { label: t('chart_gas'), data: data.map(d => d.gas), backgroundColor: '#fdcb6e', borderRadius: 4 },
      ] }, options: { ...commonOpts, plugins: { ...commonOpts.plugins, tooltip: { mode: 'index', intersect: false } }, scales: { ...commonOpts.scales, x: { ...commonOpts.scales.x, stacked: true }, y: { ...commonOpts.scales.y, stacked: true } } }
    });

    // 2. Rent Collection Line (Curved + Fill)
    if (charts.rent) charts.rent.destroy();
    const ctxRent = document.getElementById('chart-rent').getContext('2d');
    const gradRent = ctxRent.createLinearGradient(0, 0, 0, 400);
    gradRent.addColorStop(0, 'rgba(108,92,231,0.5)'); gradRent.addColorStop(1, 'rgba(108,92,231,0.0)');
    charts.rent = new Chart(document.getElementById('chart-rent'), {
      type: 'line', data: { labels, datasets: [{ label: t('chart_rent'), data: data.map(d => d.rent), borderColor: '#6c5ce7', backgroundColor: gradRent, borderWidth: 3, tension: 0.4, fill: true, pointRadius: 4, pointBackgroundColor: '#fff', pointBorderColor: '#6c5ce7', pointBorderWidth: 2 }] }, options: commonOpts
    });

    // 3. Electricity Consumption (Units)
    if (charts.elec) charts.elec.destroy();
    charts.elec = new Chart(document.getElementById('chart-elec'), {
      type: 'bar', data: { labels, datasets: [{ label: 'Units', data: data.map(d => d.elec_units), backgroundColor: '#00cec9', borderRadius: 4, barPercentage: 0.6 }] }, options: commonOpts
    });

    // 4. Gas Collection (Amount)
    if (charts.gas) charts.gas.destroy();
    charts.gas = new Chart(document.getElementById('chart-gas'), {
      type: 'bar', data: { labels, datasets: [{ label: t('chart_gas'), data: data.map(d => d.gas), backgroundColor: '#fdcb6e', borderRadius: 4, barPercentage: 0.6 }] }, options: commonOpts
    });
  }

  // Chart filter changes & Reset
  $('#chart-year, #chart-property, #chart-room').on('change', renderCharts);
  $('#btn-reset-charts').on('click', function() {
    $('#chart-year').val(''); $('#chart-property').val(''); $('#chart-room').val('');
    renderCharts();
  });

  function renderRecentBills(bills) {
    const body = $('#recent-body');
    if (!bills.length) { body.html('<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted)">' + t('dash_no_bills') + '</td></tr>'); return; }
    body.html(bills.map(b => `<tr>
      <td data-label="${t('th_tenant')}" style="font-weight:600">${b.tenant_name || '-'}</td>
      <td data-label="${t('th_room')}">${b.room_name}</td>
      <td data-label="${t('th_property')}">${b.property_name}</td>
      <td data-label="${t('th_month')}">${Utils.formatMonth(b.month)}</td>
      <td data-label="${t('th_total')}" class="amt-cell">${Utils.formatCurrency(b.total_amount)}</td>
      <td data-label="${t('th_status')}"><span class="badge ${Utils.getStatusClass(b.is_paid)}">${Utils.getStatusLabel(b.is_paid)}</span></td>
    </tr>`).join(''));
  }

  // Recent table sorting & search
  let rSortCol = 'month', rSortDir = -1;
  $('#recent-table thead th[data-sort]').on('click', function () {
    const col = $(this).data('sort');
    if (rSortCol === col) rSortDir *= -1; else { rSortCol = col; rSortDir = -1; }
    if (dashData && dashData.recent_bills) {
      const sorted = [...dashData.recent_bills].sort((a, b) => {
        let va = a[rSortCol], vb = b[rSortCol];
        if (typeof va === 'string') { va = va.toLowerCase(); vb = (vb || '').toLowerCase(); }
        return va < vb ? -1 * rSortDir : va > vb ? 1 * rSortDir : 0;
      });
      renderRecentBills(sorted);
      $('#search-recent').trigger('input'); // re-apply search
    }
  });

  $('#search-recent').on('input', function() {
    const q = $(this).val().toLowerCase();
    $('#recent-body tr').each(function() {
      $(this).toggle($(this).text().toLowerCase().includes(q));
    });
  });

  // Dashboard PDF
  $('#btn-dash-pdf').on('click', async function () {
    if (!dashData) return;
    const sym = Utils.getCurrencySymbol();
    
    let imagesHtml = '';
    try {
      ['chart-revenue', 'chart-rent', 'chart-elec', 'chart-gas'].forEach((id) => {
        const c = document.getElementById(id);
        if (c) {
          imagesHtml += `<img src="${c.toDataURL('image/png')}" style="width: 48%; display: inline-block; margin: 1%; border-radius: 8px; border: 1px solid #eee;">`;
        }
      });
    } catch {}

    let rowsHtml = '';
    if (dashData.recent_bills && dashData.recent_bills.length) {
      dashData.recent_bills.forEach(b => {
        rowsHtml += `
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">${b.tenant_name || '-'}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${b.room_name}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${b.property_name}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${Utils.formatMonth(b.month)}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${sym} ${Utils.formatCurrencyNum(b.total_amount)}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${Utils.getStatusLabel(b.is_paid)}</td>
          </tr>
        `;
      });
    }

    const html = `
      <div style="font-family: sans-serif; padding: 20px; color: #333; width: 800px; max-width: 100%;">
        <h1 style="color: #6c5ce7; margin: 0 0 5px 0; font-size: 28px;">RentUp</h1>
        <h3 style="color: #555; margin: 0 0 20px 0; font-size: 16px;">${t('dash_title')} — ${Utils.formatMonthFull(dashData.current_month)}</h3>
        
        <table style="width: 100%; margin-bottom: 25px; font-size: 14px; border-collapse: collapse;">
          <tr><td style="padding: 6px 0; width: 40%;"><strong>${t('dash_properties')}:</strong></td><td style="padding: 6px 0;">${dashData.total_properties}</td></tr>
          <tr><td style="padding: 6px 0;"><strong>${t('dash_rooms')}:</strong></td><td style="padding: 6px 0;">${dashData.total_rooms}</td></tr>
          <tr><td style="padding: 6px 0;"><strong>${t('dash_monthly_revenue')}:</strong></td><td style="padding: 6px 0;">${sym} ${Utils.formatCurrencyNum(dashData.monthly_revenue)}</td></tr>
          <tr><td style="padding: 6px 0;"><strong>${t('dash_unpaid_bills')}:</strong></td><td style="padding: 6px 0;">${dashData.unpaid_count}</td></tr>
        </table>
        
        <div style="margin-bottom: 20px;">
          ${imagesHtml}
        </div>
        
        ${rowsHtml ? `
        <h4 style="color: #444; margin-bottom: 10px;">${t('dash_recent_bills')}</h4>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
          <thead>
            <tr style="background: #6c5ce7; color: #fff;">
              <th style="padding: 8px; border: 1px solid #ddd;">${t('th_tenant')}</th>
              <th style="padding: 8px; border: 1px solid #ddd;">${t('th_room')}</th>
              <th style="padding: 8px; border: 1px solid #ddd;">${t('th_property')}</th>
              <th style="padding: 8px; border: 1px solid #ddd;">${t('th_month')}</th>
              <th style="padding: 8px; border: 1px solid #ddd;">${t('th_total')}</th>
              <th style="padding: 8px; border: 1px solid #ddd;">${t('th_status')}</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        ` : ''}
      </div>
    `;

    Utils.showToast(t('loading') || 'Generating PDF...', 'info');
    await Utils.generateHTMLPDF(html, 'RentUp_Dashboard_' + dashData.current_month + '.pdf');
    Utils.showToast(t('bill_pdf_downloaded'), 'success');
  });

  async function init() { await loadSettings(); await loadFilters(); await Promise.all([loadDashboard(), loadAllBills()]); }
  init();
});
