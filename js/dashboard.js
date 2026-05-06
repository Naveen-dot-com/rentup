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
        { label: t('chart_rent'), data: data.map(d => d.rent), backgroundColor: 'rgba(108,92,231,0.75)', borderRadius: 5 },
        { label: t('chart_electricity'), data: data.map(d => d.electricity), backgroundColor: 'rgba(253,203,110,0.75)', borderRadius: 5 },
        { label: t('chart_gas'), data: data.map(d => d.gas), backgroundColor: 'rgba(0,184,148,0.75)', borderRadius: 5 },
      ] }, options: { ...commonOpts, scales: { ...commonOpts.scales, x: { ...commonOpts.scales.x, stacked: true }, y: { ...commonOpts.scales.y, stacked: true } } }
    });

    // 2. Rent Collection Line
    if (charts.rent) charts.rent.destroy();
    charts.rent = new Chart(document.getElementById('chart-rent'), {
      type: 'line', data: { labels, datasets: [{ label: t('chart_rent'), data: data.map(d => d.rent), borderColor: '#6c5ce7', backgroundColor: 'rgba(108,92,231,0.12)', tension: 0.4, fill: true, pointRadius: 5, pointBackgroundColor: '#6c5ce7' }] }, options: commonOpts
    });

    // 3. Electricity Consumption
    if (charts.elec) charts.elec.destroy();
    charts.elec = new Chart(document.getElementById('chart-elec'), {
      type: 'bar', data: { labels, datasets: [{ label: 'Units', data: data.map(d => d.elec_units), backgroundColor: 'rgba(253,203,110,0.8)', borderRadius: 5 }] }, options: commonOpts
    });

    // 4. Gas Consumption
    if (charts.gas) charts.gas.destroy();
    charts.gas = new Chart(document.getElementById('chart-gas'), {
      type: 'bar', data: { labels, datasets: [{ label: 'Units', data: data.map(d => d.gas_units), backgroundColor: 'rgba(0,184,148,0.8)', borderRadius: 5 }] }, options: commonOpts
    });
  }

  // Chart filter changes
  $('#chart-year, #chart-property, #chart-room').on('change', renderCharts);

  function renderRecentBills(bills) {
    const body = $('#recent-body');
    if (!bills.length) { body.html('<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted)">' + t('dash_no_bills') + '</td></tr>'); return; }
    body.html(bills.map(b => `<tr>
      <td style="font-weight:600">${b.tenant_name || '-'}</td><td>${b.room_name}</td><td>${b.property_name}</td>
      <td>${Utils.formatMonth(b.month)}</td><td class="amt-cell">${Utils.formatCurrency(b.total_amount)}</td>
      <td><span class="badge ${Utils.getStatusClass(b.is_paid)}">${Utils.getStatusLabel(b.is_paid)}</span></td>
    </tr>`).join(''));
  }

  // Recent table sorting
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
    }
  });

  // Dashboard PDF
  $('#btn-dash-pdf').on('click', async function () {
    if (!dashData) return;
    const doc = await Utils.preparePDF();
    const sym = Utils.getCurrencySymbol();
    doc.setFontSize(20); doc.setTextColor(108, 92, 231); doc.text('RentUp', 14, 20);
    doc.setFontSize(11); doc.setTextColor(100); doc.text(t('dash_title') + ' — ' + Utils.formatMonthFull(dashData.current_month), 14, 28);
    doc.setFontSize(10); doc.setTextColor(60); let y = 40;
    [[t('dash_properties'), String(dashData.total_properties)], [t('dash_rooms'), String(dashData.total_rooms)], [t('dash_monthly_revenue'), sym + ' ' + Utils.formatCurrencyNum(dashData.monthly_revenue)], [t('dash_unpaid_bills'), String(dashData.unpaid_count)]].forEach(([l, v]) => {
      Utils.pdfBold(doc); doc.text(l + ':', 14, y); Utils.pdfNormal(doc); doc.text(v, 80, y); y += 8;
    });
    y += 4;
    try {
      ['chart-revenue', 'chart-rent', 'chart-elec', 'chart-gas'].forEach((id, i) => {
        const c = document.getElementById(id);
        if (c) { const img = c.toDataURL('image/png'); const x = (i % 2) * 100 + 5; const cy = y + Math.floor(i / 2) * 58; doc.addImage(img, 'PNG', x, cy, 95, 52); }
      });
    } catch {}
    y += 120;
    if (dashData.recent_bills && dashData.recent_bills.length) {
      doc.autoTable({ startY: y, head: [[t('th_tenant'), t('th_room'), t('th_property'), t('th_month'), t('th_total'), t('th_status')]], body: dashData.recent_bills.map(b => [b.tenant_name || '-', b.room_name, b.property_name, Utils.formatMonth(b.month), sym + ' ' + Utils.formatCurrencyNum(b.total_amount), Utils.getStatusLabel(b.is_paid)]), theme: 'grid', headStyles: { fillColor: [108, 92, 231], textColor: 255, fontSize: 8 }, styles: { fontSize: 8, cellPadding: 4, font: 'NotoSans' } });
    }
    doc.save('RentUp_Dashboard_' + dashData.current_month + '.pdf');
    Utils.showToast(t('bill_pdf_downloaded'), 'success');
  });

  async function init() { await loadSettings(); await loadFilters(); await Promise.all([loadDashboard(), loadAllBills()]); }
  init();
});
