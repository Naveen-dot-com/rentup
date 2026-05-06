// ============================================================
// RentUp v3 — Dashboard with Charts + PDF Report
// ============================================================
$(function () {
  if (!Utils.requireAuth()) return;
  Utils.initTheme(); Utils.initSidebar('dashboard'); Utils.initTopBar(); lucide.createIcons();
  $('[data-i18n]').each(function () { $(this).text(t($(this).data('i18n'))); });

  let dashData = null;
  let revenueChart = null, breakdownChart = null;

  async function loadSettings() {
    try { const res = await API.getSettings(); Utils.setCurrency(res.data.currency || 'INR'); Utils.cacheSet('settings', res.data); } catch {}
  }

  async function loadDashboard() {
    const month = Utils.getCurrentMonth();
    try {
      const res = await API.getDashboard(month);
      dashData = res.data;
      renderStats(res.data);
      renderRecentBills(res.data.recent_bills || []);
      renderCharts(res.data.chart_data || []);
    } catch (e) { Utils.showToast(e.message, 'error'); }
  }

  function renderStats(d) {
    $('#stat-properties').text(d.total_properties);
    $('#stat-rooms').text(d.total_rooms);
    $('#stat-revenue').text(Utils.formatCurrency(d.monthly_revenue));
    $('#stat-unpaid').text(d.unpaid_count);
  }

  function renderRecentBills(bills) {
    const body = $('#recent-body');
    if (!bills.length) { body.html('<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted)">' + t('dash_no_bills') + '</td></tr>'); return; }
    body.html(bills.map(b => `<tr>
      <td style="font-weight:600">${b.tenant_name || '-'}</td><td>${b.room_name}</td><td>${b.property_name}</td>
      <td>${Utils.formatMonth(b.month)}</td><td class="total-value">${Utils.formatCurrency(b.total_amount)}</td>
      <td><span class="badge ${Utils.getStatusClass(b.is_paid)}">${Utils.getStatusLabel(b.is_paid)}</span></td>
    </tr>`).join(''));
  }

  function renderCharts(chartData) {
    if (!chartData.length) return;
    const labels = chartData.map(d => Utils.formatMonth(d.month));
    const rentData = chartData.map(d => d.rent);
    const elecData = chartData.map(d => d.electricity);
    const gasData = chartData.map(d => d.gas);
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const textColor = isDark ? '#9c9cb5' : '#555577';

    // Revenue Bar Chart
    if (revenueChart) revenueChart.destroy();
    revenueChart = new Chart(document.getElementById('chart-revenue'), {
      type: 'bar', data: {
        labels, datasets: [
          { label: t('chart_rent'), data: rentData, backgroundColor: 'rgba(108,92,231,0.7)', borderRadius: 6 },
          { label: t('chart_electricity'), data: elecData, backgroundColor: 'rgba(253,203,110,0.7)', borderRadius: 6 },
          { label: t('chart_gas'), data: gasData, backgroundColor: 'rgba(0,184,148,0.7)', borderRadius: 6 },
        ]
      }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: textColor, font: { family: 'Inter' } } } }, scales: { x: { stacked: true, grid: { display: false }, ticks: { color: textColor } }, y: { stacked: true, grid: { color: gridColor }, ticks: { color: textColor } } } }
    });

    // Breakdown Line Chart
    if (breakdownChart) breakdownChart.destroy();
    breakdownChart = new Chart(document.getElementById('chart-breakdown'), {
      type: 'line', data: {
        labels, datasets: [
          { label: t('chart_rent'), data: rentData, borderColor: '#6c5ce7', backgroundColor: 'rgba(108,92,231,0.1)', tension: 0.4, fill: true, pointRadius: 4 },
          { label: t('chart_electricity'), data: elecData, borderColor: '#fdcb6e', backgroundColor: 'rgba(253,203,110,0.1)', tension: 0.4, fill: true, pointRadius: 4 },
          { label: t('chart_gas'), data: gasData, borderColor: '#00b894', backgroundColor: 'rgba(0,184,148,0.1)', tension: 0.4, fill: true, pointRadius: 4 },
        ]
      }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: textColor, font: { family: 'Inter' } } } }, scales: { x: { grid: { display: false }, ticks: { color: textColor } }, y: { grid: { color: gridColor }, ticks: { color: textColor } } } }
    });
  }

  // Dashboard PDF Report
  $('#btn-dash-pdf').on('click', async function () {
    if (!dashData) { Utils.showToast(t('loading'), 'info'); return; }
    const doc = await Utils.preparePDF();
    const sym = Utils.getCurrencySymbol();
    const isHindi = getLang() === 'hi';
    if (isHindi) doc.setFont('NotoSansDevanagari');

    doc.setFontSize(20); doc.setTextColor(108, 92, 231);
    doc.text('RentUp', 14, 20);
    doc.setFontSize(11); doc.setTextColor(100);
    doc.text(t('dash_title') + ' — ' + Utils.formatMonthFull(dashData.current_month), 14, 28);
    doc.setFontSize(10); doc.setTextColor(60); let y = 40;
    const stats = [
      [t('dash_properties'), String(dashData.total_properties)],
      [t('dash_rooms'), String(dashData.total_rooms)],
      [t('dash_monthly_revenue'), sym + ' ' + Utils.formatCurrencyNum(dashData.monthly_revenue)],
      [t('dash_unpaid_bills'), String(dashData.unpaid_count)],
    ];
    stats.forEach(([l, v]) => {
      if (isHindi) doc.setFont('NotoSansDevanagari');
      doc.setFont(undefined, 'bold'); doc.text(l + ':', 14, y);
      doc.setFont(undefined, 'normal'); doc.text(v, 80, y); y += 8;
    });

    // Charts as images
    y += 4;
    try {
      const c1 = document.getElementById('chart-revenue');
      const c2 = document.getElementById('chart-breakdown');
      if (c1) { const img1 = c1.toDataURL('image/png'); doc.addImage(img1, 'PNG', 10, y, 90, 55); }
      if (c2) { const img2 = c2.toDataURL('image/png'); doc.addImage(img2, 'PNG', 105, y, 90, 55); }
    } catch {}

    // Recent bills table
    y += 62;
    if (dashData.recent_bills && dashData.recent_bills.length) {
      const tableData = dashData.recent_bills.map(b => [
        b.tenant_name || '-', b.room_name, b.property_name,
        Utils.formatMonth(b.month), sym + ' ' + Utils.formatCurrencyNum(b.total_amount),
        Utils.getStatusLabel(b.is_paid)
      ]);
      doc.autoTable({
        startY: y,
        head: [[t('th_tenant'), t('th_room'), t('th_property'), t('th_month'), t('th_total'), t('th_status')]],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [108, 92, 231], textColor: 255, fontSize: 8 },
        styles: { fontSize: 8, cellPadding: 4, font: isHindi ? 'NotoSansDevanagari' : undefined },
      });
    }
    doc.save('RentUp_Dashboard_' + dashData.current_month + '.pdf');
    Utils.showToast(t('bill_pdf_downloaded'), 'success');
  });

  loadSettings().then(loadDashboard);
});
