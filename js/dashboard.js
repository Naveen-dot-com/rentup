// ============================================================
// RentUp v2 — Dashboard + Billing Logic
// ============================================================

$(function () {
  if (!Utils.requireAuth()) return;
  Utils.initTheme();
  Utils.initSidebar('dashboard');
  Utils.initTopBar();
  lucide.createIcons();

  const currentMonth = Utils.getCurrentMonth();
  $('#filter-month').val(currentMonth);

  // Translate UI
  $('[data-i18n]').each(function () { $(this).text(t($(this).data('i18n'))); });
  // Placeholder translations
  $('#bill-notes').attr('placeholder', t('bill_notes_ph'));
  $('#bill-rent').attr('placeholder', t('bill_rent_override_ph'));

  let allProperties = [];
  let allRooms = [];
  let currentBills = [];

  // ---- Load Settings (for currency) ----
  async function loadSettings() {
    const cached = Utils.cacheGet('settings');
    if (cached) {
      Utils.setCurrency(cached.currency || 'INR');
    }
    try {
      const res = await API.getSettings();
      Utils.setCurrency(res.data.currency || 'INR');
      Utils.cacheSet('settings', res.data);
    } catch {}
  }

  // ---- Load Dashboard Stats ----
  async function loadDashboard() {
    const month = $('#filter-month').val() || currentMonth;
    const cached = Utils.cacheGet('dashboard_' + month);
    if (cached) renderStats(cached);
    try {
      const res = await API.getDashboard(month);
      renderStats(res.data);
      Utils.cacheSet('dashboard_' + month, res.data);
    } catch (e) {
      if (!cached) Utils.showToast(e.message, 'error');
    }
  }

  function renderStats(d) {
    $('#stat-properties').text(d.total_properties);
    $('#stat-rooms').text(d.total_rooms);
    $('#stat-revenue').text(Utils.formatCurrency(d.monthly_revenue));
    $('#stat-unpaid').text(d.unpaid_count);
  }

  // ---- Load Properties for filter/modal ----
  async function loadProperties() {
    const cached = Utils.cacheGet('properties');
    if (cached) populateProperties(cached);
    try {
      const res = await API.getProperties();
      allProperties = res.data;
      populateProperties(res.data);
      Utils.cacheSet('properties', res.data);
    } catch {}
  }

  function populateProperties(props) {
    allProperties = props;
    const filter = $('#filter-property');
    const modal = $('#bill-property');
    filter.find('option:not(:first)').remove();
    modal.find('option:not(:first)').remove();
    props.forEach(p => {
      filter.append(`<option value="${p.id}">${p.name}</option>`);
      modal.append(`<option value="${p.id}">${p.name}</option>`);
    });
  }

  // ---- Load Rooms ----
  async function loadRooms() {
    const cached = Utils.cacheGet('rooms');
    if (cached) allRooms = cached;
    try {
      const res = await API.getRooms();
      allRooms = res.data;
      Utils.cacheSet('rooms', res.data);
    } catch {}
  }

  // ---- Load Bills ----
  async function loadBills() {
    const month = $('#filter-month').val();
    const propId = $('#filter-property').val();
    const cacheKey = 'bills_' + month + '_' + propId;
    const cached = Utils.cacheGet(cacheKey);
    if (cached) renderBills(cached);
    try {
      const res = await API.getBills(month, propId);
      currentBills = res.data;
      renderBills(res.data);
      Utils.cacheSet(cacheKey, res.data);
    } catch (e) {
      if (!cached) Utils.showToast(e.message, 'error');
    }
  }

  function renderBills(bills) {
    currentBills = bills;
    const body = $('#bills-body');
    if (!bills.length) {
      body.html(`<tr><td colspan="11" class="empty-state" style="padding:36px"><div class="e-icon"><i data-lucide="receipt"></i></div><p>${t('dash_no_bills')}</p></td></tr>`);
      lucide.createIcons();
      return;
    }
    body.html(bills.map(b => `
      <tr>
        <td>${b.property_name}</td>
        <td>${b.room_name}</td>
        <td>${b.tenant_name || '-'}</td>
        <td>${Utils.formatMonth(b.month)}</td>
        <td>${Utils.formatCurrency(b.rent_amount)}</td>
        <td>${b.electricity_units}</td>
        <td class="calc-value">${Utils.formatCurrency(b.electricity_amount)}</td>
        <td>${Utils.formatCurrency(b.gas_amount)}</td>
        <td class="total-value">${Utils.formatCurrency(b.total_amount)}</td>
        <td><span class="badge ${b.is_paid ? 'badge-success' : 'badge-danger'}">${b.is_paid ? t('status_paid') : t('status_unpaid')}</span></td>
        <td style="white-space:nowrap">
          <button class="btn btn-icon btn-secondary btn-sm" onclick="togglePaid(${b.id})" title="${b.is_paid ? t('status_unpaid') : t('status_paid')}"><i data-lucide="${b.is_paid ? 'x-circle' : 'check-circle'}"></i></button>
          <button class="btn btn-icon btn-secondary btn-sm" onclick="exportPDF(${b.id})" title="PDF"><i data-lucide="file-text"></i></button>
        </td>
      </tr>
    `).join(''));
    lucide.createIcons();
  }

  // ---- Property change → load rooms for modal ----
  $('#bill-property').on('change', function () {
    const propId = $(this).val();
    const roomSelect = $('#bill-room');
    roomSelect.find('option:not(:first)').remove();
    if (!propId) return;
    const filtered = allRooms.filter(r => String(r.property_id) === String(propId));
    filtered.forEach(r => roomSelect.append(`<option value="${r.id}">${r.name}${r.tenant_name ? ' (' + r.tenant_name + ')' : ''}</option>`));
  });

  // ---- Filter change ----
  $('#filter-month, #filter-property').on('change', function () {
    loadBills();
    if ($(this).attr('id') === 'filter-month') loadDashboard();
  });

  // ---- New Bill ----
  $('#btn-add-bill').on('click', function () {
    $('#bill-id').val('');
    $('#bill-modal-title').text(t('bill_new_title'));
    $('#bill-form')[0].reset();
    $('#bill-month').val(currentMonth);
    $('#bill-room').find('option:not(:first)').remove();
    $('#bill-modal').addClass('active');
  });

  // ---- Save Bill ----
  $('#bill-form').on('submit', async function (e) {
    e.preventDefault();
    const roomId = $('#bill-room').val();
    if (!roomId) { Utils.showToast(t('bill_select_room'), 'error'); return; }
    const data = {
      room_id: parseInt(roomId),
      month: $('#bill-month').val(),
      rent_amount: parseFloat($('#bill-rent').val()) || undefined,
      electricity_units: parseFloat($('#bill-elec-units').val()) || 0,
      gas_units: parseFloat($('#bill-gas-units').val()) || 0,
      gas_amount: parseFloat($('#bill-gas-amount').val()) || 0,
      notes: $('#bill-notes').val()
    };
    const id = $('#bill-id').val();
    try {
      if (id) {
        await API.updateBill(id, data);
        Utils.showToast(t('bill_updated'), 'success');
      } else {
        await API.createBill(data);
        Utils.showToast(t('bill_created'), 'success');
      }
      $('#bill-modal').removeClass('active');
      Utils.cacheClear('bills');
      Utils.cacheClear('dashboard');
      loadBills();
      loadDashboard();
    } catch (err) {
      Utils.showToast(err.message, 'error');
    }
  });

  // ---- Toggle Paid ----
  window.togglePaid = async function (id) {
    try {
      await API.togglePaid(id);
      Utils.showToast(t('bill_status_updated'), 'success');
      Utils.cacheClear('bills');
      Utils.cacheClear('dashboard');
      loadBills();
      loadDashboard();
    } catch (err) { Utils.showToast(err.message, 'error'); }
  };

  // ---- PDF Export ----
  window.exportPDF = function (id) {
    const bill = currentBills.find(b => b.id === id);
    if (!bill) return;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const lang = getLang();
    const prevMonth = Utils.getPrevMonth(bill.month);
    const prevMonthLabel = Utils.formatMonth(prevMonth);
    const curMonthLabel = Utils.formatMonth(bill.month);

    // Header
    doc.setFontSize(18);
    doc.setTextColor(108, 92, 231);
    doc.text('RentUp', 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(t('pdf_title'), 14, 28);

    // Info block
    doc.setFontSize(10);
    doc.setTextColor(60);
    const info = [
      [t('pdf_property'), bill.property_name],
      [t('pdf_room'), bill.room_name],
      [t('pdf_tenant'), bill.tenant_name || '-'],
      [t('pdf_month'), curMonthLabel],
      [t('pdf_status'), bill.is_paid ? t('status_paid') : t('status_unpaid')],
      [t('pdf_generated'), new Date().toLocaleDateString()],
    ];
    let y = 38;
    info.forEach(([label, val]) => {
      doc.setFont(undefined, 'bold');
      doc.text(label + ':', 14, y);
      doc.setFont(undefined, 'normal');
      doc.text(String(val), 65, y);
      y += 7;
    });

    // Billing period note
    y += 4;
    doc.setFontSize(9);
    doc.setTextColor(130);
    doc.text(t('pdf_elec_gas_note', { prevMonth: prevMonthLabel }), 14, y);
    y += 5;
    doc.text(t('pdf_rent_note', { currentMonth: curMonthLabel }), 14, y);
    y += 8;

    // Table
    const currency = localStorage.getItem('rentup_currency') || 'INR';
    doc.autoTable({
      startY: y,
      head: [[t('pdf_item'), t('pdf_details'), t('pdf_amount')]],
      body: [
        [t('pdf_rent'), t('pdf_rent_detail', { month: curMonthLabel }), currency + ' ' + bill.rent_amount.toLocaleString()],
        [t('pdf_electricity'), t('pdf_elec_detail', { units: bill.electricity_units, rate: bill.electricity_rate, month: prevMonthLabel }), currency + ' ' + bill.electricity_amount.toLocaleString()],
        [t('pdf_gas'), t('pdf_gas_detail', { units: bill.gas_units, month: prevMonthLabel }), currency + ' ' + bill.gas_amount.toLocaleString()],
      ],
      foot: [[t('pdf_total'), '', currency + ' ' + bill.total_amount.toLocaleString()]],
      theme: 'grid',
      headStyles: { fillColor: [108, 92, 231], textColor: 255, fontStyle: 'bold', fontSize: 10 },
      footStyles: { fillColor: [240, 240, 250], textColor: [30, 30, 60], fontStyle: 'bold', fontSize: 11 },
      styles: { fontSize: 9.5, cellPadding: 6 },
    });

    // Notes
    if (bill.notes) {
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(10);
      doc.setTextColor(80);
      doc.setFont(undefined, 'bold');
      doc.text(t('pdf_notes') + ':', 14, finalY);
      doc.setFont(undefined, 'normal');
      doc.text(bill.notes, 14, finalY + 7);
    }

    doc.save(`RentUp_${bill.property_name}_${bill.room_name}_${bill.month}.pdf`);
    Utils.showToast(t('bill_pdf_downloaded'), 'success');
  };

  // ---- Excel Export ----
  $('#btn-export-excel').on('click', function () {
    if (!currentBills.length) { Utils.showToast(t('bill_no_bills_export'), 'error'); return; }
    const data = currentBills.map(b => ({
      [t('th_property')]: b.property_name,
      [t('th_room')]: b.room_name,
      [t('th_tenant')]: b.tenant_name || '-',
      [t('th_month')]: Utils.formatMonth(b.month),
      [t('th_rent')]: b.rent_amount,
      [t('th_elec_units')]: b.electricity_units,
      [t('th_elec_amount')]: b.electricity_amount,
      [t('th_gas')]: b.gas_amount,
      [t('th_total')]: b.total_amount,
      [t('th_status')]: b.is_paid ? t('status_paid') : t('status_unpaid'),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t('dash_billing'));
    XLSX.writeFile(wb, `RentUp_Bills_${$('#filter-month').val()}.xlsx`);
    Utils.showToast(t('bill_excel_downloaded'), 'success');
  });

  // ---- Init ----
  async function init() {
    await loadSettings();
    await Promise.all([loadProperties(), loadRooms()]);
    loadDashboard();
    loadBills();
  }
  init();
});
