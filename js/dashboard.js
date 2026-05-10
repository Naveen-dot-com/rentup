// ============================================================
// RentUp — Dashboard (programmatic jsPDF — no html2canvas)
// ============================================================
$(function () {
  if (!Utils.requireAuth()) return;
  Utils.initTheme(); Utils.initSidebar('dashboard'); Utils.initTopBar(); lucide.createIcons();
  $('[data-i18n]').each(function () { $(this).text(t($(this).data('i18n'))); });

  let dashData = null, allBills = [];
  let charts = {};

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
      const res = await API.getBills();
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

    if (charts.revenue) charts.revenue.destroy();
    charts.revenue = new Chart(document.getElementById('chart-revenue'), {
      type: 'bar', data: { labels, datasets: [
        { label: t('chart_rent'), data: data.map(d => d.rent), backgroundColor: '#6c5ce7', borderRadius: 4 },
        { label: t('chart_electricity'), data: data.map(d => d.electricity), backgroundColor: '#00cec9', borderRadius: 4 },
        { label: t('chart_gas'), data: data.map(d => d.gas), backgroundColor: '#fdcb6e', borderRadius: 4 },
      ] }, options: { ...commonOpts, plugins: { ...commonOpts.plugins, tooltip: { mode: 'index', intersect: false } }, scales: { ...commonOpts.scales, x: { ...commonOpts.scales.x, stacked: true }, y: { ...commonOpts.scales.y, stacked: true } } }
    });

    if (charts.rent) charts.rent.destroy();
    const ctxRent = document.getElementById('chart-rent').getContext('2d');
    const gradRent = ctxRent.createLinearGradient(0, 0, 0, 400);
    gradRent.addColorStop(0, 'rgba(108,92,231,0.5)'); gradRent.addColorStop(1, 'rgba(108,92,231,0.0)');
    charts.rent = new Chart(document.getElementById('chart-rent'), {
      type: 'line', data: { labels, datasets: [{ label: t('chart_rent'), data: data.map(d => d.rent), borderColor: '#6c5ce7', backgroundColor: gradRent, borderWidth: 3, tension: 0.4, fill: true, pointRadius: 4, pointBackgroundColor: '#fff', pointBorderColor: '#6c5ce7', pointBorderWidth: 2 }] }, options: commonOpts
    });

    if (charts.elec) charts.elec.destroy();
    charts.elec = new Chart(document.getElementById('chart-elec'), {
      type: 'bar', data: { labels, datasets: [{ label: 'Units', data: data.map(d => d.elec_units), backgroundColor: '#00cec9', borderRadius: 4, barPercentage: 0.6 }] }, options: commonOpts
    });

    if (charts.gas) charts.gas.destroy();
    charts.gas = new Chart(document.getElementById('chart-gas'), {
      type: 'bar', data: { labels, datasets: [{ label: t('chart_gas'), data: data.map(d => d.gas), backgroundColor: '#fdcb6e', borderRadius: 4, barPercentage: 0.6 }] }, options: commonOpts
    });
  }

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
      $('#search-recent').trigger('input');
    }
  });

  $('#search-recent').on('input', function() {
    const q = $(this).val().toLowerCase();
    $('#recent-body tr').each(function() {
      $(this).toggle($(this).text().toLowerCase().includes(q));
    });
  });

  // ── Dashboard PDF — pure jsPDF programmatic (no html2canvas, no font rendering) ──
  $('#btn-dash-pdf').on('click', async function () {
    if (!dashData) return;
    Utils.showToast(t('loading') || 'Generating PDF...', 'info');
    try {
      const { jsPDF } = window.jspdf;
      const sym = Utils.pdfSym();
      const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const W = doc.internal.pageSize.getWidth();   // 595.28 pt
      const margin = 36;
      let y = margin;

      // ── Header ──
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(26);
      doc.setTextColor(108, 92, 231);
      doc.text('RentUp', margin, y);
      y += 20;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(80, 80, 80);
      doc.text(t('dash_title') + ' \u2014 ' + Utils.formatMonthFull(dashData.current_month), margin, y);
      y += 18;

      // ── Divider ──
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, y, W - margin, y);
      y += 14;

      // ── Stats rows ──
      const stats = [
        [t('dash_properties'), String(dashData.total_properties)],
        [t('dash_rooms'), String(dashData.total_rooms)],
        [t('dash_monthly_revenue'), sym + ' ' + Utils.pdfNum(dashData.monthly_revenue)],
        [t('dash_unpaid_bills'), String(dashData.unpaid_count)],
      ];
      stats.forEach(([label, val]) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(50, 50, 50);
        doc.text(label + ':', margin, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text(val, margin + 160, y);
        y += 16;
        doc.setDrawColor(238, 238, 238);
        doc.line(margin, y - 4, W - margin, y - 4);
      });
      y += 10;

      // ── Chart images (captured from live canvas elements) ──
      const chartIds = ['chart-revenue', 'chart-rent', 'chart-elec', 'chart-gas'];
      const chartW = (W - margin * 2 - 10) / 2;  // two per row
      const chartH = chartW * 0.55;
      let cx = margin;
      for (let i = 0; i < chartIds.length; i++) {
        const canvas = document.getElementById(chartIds[i]);
        if (canvas) {
          if (y + chartH > doc.internal.pageSize.getHeight() - margin) { doc.addPage(); y = margin; }
          const imgData = canvas.toDataURL('image/png');
          doc.addImage(imgData, 'PNG', cx, y, chartW, chartH);
          if (i % 2 === 0) { cx = margin + chartW + 10; }
          else { cx = margin; y += chartH + 10; }
        }
      }
      if (cx !== margin) y += chartH + 10; // flush last row if odd count
      y += 8;

      // ── Recent Bills table ──
      if (dashData.recent_bills && dashData.recent_bills.length) {
        if (y + 40 > doc.internal.pageSize.getHeight() - margin) { doc.addPage(); y = margin; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(50, 50, 50);
        doc.text(t('dash_recent_bills'), margin, y);
        y += 10;

        doc.autoTable({
          startY: y,
          margin: { left: margin, right: margin },
          head: [[t('th_tenant'), t('th_room'), t('th_property'), t('th_month'), t('th_total'), t('th_status')]],
          body: (dashData.recent_bills || []).map(b => [
            b.tenant_name || '-',
            b.room_name,
            b.property_name,
            Utils.formatMonth(b.month),
            sym + ' ' + Utils.pdfNum(b.total_amount),
            Utils.getStatusLabel(b.is_paid),
          ]),
          headStyles: { fillColor: [108, 92, 231], textColor: 255, fontStyle: 'bold', fontSize: 9 },
          bodyStyles: { fontSize: 9, textColor: [50, 50, 50] },
          alternateRowStyles: { fillColor: [248, 247, 255] },
          styles: { cellPadding: 5, font: 'helvetica', overflow: 'linebreak' },
        });
      }

      doc.save('RentUp_Dashboard_' + (dashData.current_month || 'report') + '.pdf');
      Utils.showToast(t('bill_pdf_downloaded') || 'PDF downloaded!', 'success');
    } catch (e) {
      console.error('PDF error:', e);
      Utils.showToast('PDF failed: ' + e.message, 'error');
    }
  });

  async function init() { await loadSettings(); await loadFilters(); await Promise.all([loadDashboard(), loadAllBills()]); }
  init();
});
