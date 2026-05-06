// ============================================================
// RentUp v4 — Billing Page Logic
// Sorting, Filters, Hindi+₹ PDF, Individual+Consolidated
// ============================================================
$(function () {
  if (!Utils.requireAuth()) return;
  Utils.initTheme(); Utils.initSidebar('billing'); Utils.initTopBar(); lucide.createIcons();
  $('[data-i18n]').each(function () { $(this).text(t($(this).data('i18n'))); });
  let allProperties = [], allRooms = [], currentBills = [], sortCol = 'month', sortDir = -1;

  // Populate year filter
  const curYear = new Date().getFullYear();
  for (let y = curYear; y >= curYear - 5; y--) $('#filter-year').append(`<option value="${y}">${y}</option>`);
  $('#filter-year').prepend('<option value="">All Years</option>');
  // Month filter
  const monthNames = getLang() === 'hi' ? ['जनवरी','फरवरी','मार्च','अप्रैल','मई','जून','जुलाई','अगस्त','सितंबर','अक्टूबर','नवंबर','दिसंबर'] : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  monthNames.forEach((m, i) => $('#filter-month-num').append(`<option value="${String(i+1).padStart(2,'0')}">${m}</option>`));

  async function loadSettings() { try { const r = await API.getSettings(); Utils.setCurrency(r.data.currency || 'INR'); } catch {} }
  async function loadProperties() {
    try { const r = await API.getProperties(); allProperties = r.data; const f = $('#filter-property'), m = $('#bill-property'); f.find('option:not(:first)').remove(); m.find('option:not(:first)').remove(); r.data.forEach(p => { f.append(`<option value="${p.id}">${p.name}</option>`); m.append(`<option value="${p.id}">${p.name}</option>`); }); } catch {}
  }
  async function loadRooms() { try { const r = await API.getRooms(); allRooms = r.data; } catch {} }

  async function loadBills() {
    // Build month param from year + month filters
    const year = $('#filter-year').val();
    const monthNum = $('#filter-month-num').val();
    let month = '';
    if (year && monthNum) month = year + '-' + monthNum;
    else if (year) month = ''; // will filter client-side
    const propId = $('#filter-property').val();
    try {
      const r = await API.getBills(month, propId);
      let bills = r.data;
      // Client-side year filter when no specific month
      if (year && !monthNum) bills = bills.filter(b => b.month.startsWith(year));
      currentBills = bills;
      sortAndRender();
    } catch (e) { Utils.showToast(e.message, 'error'); }
  }

  function sortAndRender() {
    const sorted = [...currentBills].sort((a, b) => {
      let va = a[sortCol], vb = b[sortCol];
      if (typeof va === 'string') { va = va.toLowerCase(); vb = (vb || '').toLowerCase(); }
      if (va < vb) return -1 * sortDir;
      if (va > vb) return 1 * sortDir;
      return 0;
    });
    renderBills(sorted);
  }

  function renderBills(bills) {
    const body = $('#bills-body');
    if (!bills.length) { body.html('<tr><td colspan="11" class="empty-state" style="padding:36px"><div class="e-icon"><i data-lucide="receipt"></i></div><p>'+t('dash_no_bills')+'</p></td></tr>'); lucide.createIcons(); return; }
    body.html(bills.map(b => `<tr>
      <td data-label="${t('th_tenant')}" style="font-weight:600">${b.tenant_name || '-'}</td>
      <td data-label="${t('th_room')}">${b.room_name}</td>
      <td data-label="${t('th_property')}">${b.property_name}</td>
      <td data-label="${t('th_month')}">${Utils.formatMonth(b.month)}</td>
      <td data-label="${t('th_rent')}" class="amt-cell">${Utils.formatCurrency(b.rent_amount)}</td>
      <td data-label="${t('th_elec_units')}">${b.electricity_units}</td>
      <td data-label="${t('th_elec_amount')}" class="amt-cell">${Utils.formatCurrency(b.electricity_amount)}</td>
      <td data-label="${t('th_gas_units')}">${b.gas_units || 0}</td>
      <td data-label="${t('th_gas')}" class="amt-cell">${Utils.formatCurrency(b.gas_amount)}</td>
      <td data-label="${t('th_total')}" class="amt-cell total-value">${Utils.formatCurrency(b.total_amount)}</td>
      <td data-label="${t('th_status')}"><button class="badge ${Utils.getStatusClass(b.is_paid)} status-toggle" onclick="cycleStatus(${b.id})">${Utils.getStatusLabel(b.is_paid)}</button></td>
      <td data-label="${t('th_actions')}" style="white-space:nowrap;justify-content:flex-end;gap:4px">
        <button class="btn btn-icon btn-secondary btn-sm" onclick="editBill(${b.id})" title="${t('edit')}"><i data-lucide="pencil"></i></button>
        <button class="btn btn-icon btn-danger btn-sm" onclick="deleteBill(${b.id})" title="${t('delete')}"><i data-lucide="trash-2"></i></button>
        <button class="btn btn-icon btn-secondary btn-sm" onclick="exportSinglePDF(${b.id})" title="PDF"><i data-lucide="file-text"></i></button>
        <button class="btn btn-icon btn-secondary btn-sm" onclick="exportSingleExcel(${b.id})" title="Excel"><i data-lucide="file-spreadsheet"></i></button>
      </td>
    </tr>`).join(''));
    lucide.createIcons();
  }

  // Column sorting
  $('#bills-table thead th[data-sort]').on('click', function () {
    const col = $(this).data('sort');
    if (sortCol === col) sortDir *= -1; else { sortCol = col; sortDir = -1; }
    sortAndRender();
  });

  $('#search-billing').on('input', function() {
    const q = $(this).val().toLowerCase();
    $('#bills-body tr').each(function() {
      if ($(this).find('td').length > 1) { // Skip empty state row
        $(this).toggle($(this).text().toLowerCase().includes(q));
      }
    });
  });

  $('#bill-property').on('change', function () { const pid = $(this).val(); const rs = $('#bill-room'); rs.find('option:not(:first)').remove(); if (!pid) return; allRooms.filter(r => String(r.property_id) === String(pid)).forEach(r => rs.append(`<option value="${r.id}">${r.name}${r.tenant_name ? ' (' + r.tenant_name + ')' : ''}</option>`)); });
  $('#filter-year, #filter-month-num, #filter-property').on('change', loadBills);
  $('#btn-add-bill').on('click', function () { $('#bill-id').val(''); $('#bill-modal-title').text(t('bill_new_title')); $('#bill-form')[0].reset(); $('#bill-month').val(Utils.getCurrentMonth()); $('#bill-room').find('option:not(:first)').remove(); $('#bill-modal').addClass('active'); });

  window.editBill = function (id) {
    const b = currentBills.find(x => x.id === id); if (!b) return;
    $('#bill-id').val(b.id); $('#bill-modal-title').text(t('bill_edit_title'));
    const room = allRooms.find(r => r.id === b.room_id);
    $('#bill-property').val(room ? room.property_id : '').trigger('change');
    setTimeout(() => $('#bill-room').val(b.room_id), 50);
    $('#bill-month').val(b.month); $('#bill-rent').val(b.rent_amount); $('#bill-elec-units').val(b.electricity_units);
    $('#bill-gas-units').val(b.gas_units); $('#bill-gas-amount').val(b.gas_amount); $('#bill-notes').val(b.notes || '');
    $('#bill-modal').addClass('active');
  };

  $('#bill-form').on('submit', async function (e) {
    e.preventDefault(); const roomId = $('#bill-room').val();
    if (!roomId) { Utils.showToast(t('bill_select_room'), 'error'); return; }
    const data = { room_id: parseInt(roomId), month: $('#bill-month').val(), rent_amount: parseFloat($('#bill-rent').val()) || undefined, electricity_units: parseFloat($('#bill-elec-units').val()) || 0, gas_units: parseFloat($('#bill-gas-units').val()) || 0, gas_amount: parseFloat($('#bill-gas-amount').val()) || 0, notes: $('#bill-notes').val() };
    const id = $('#bill-id').val();
    try { if (id) { await API.updateBill(id, data); Utils.showToast(t('bill_updated'), 'success'); } else { await API.createBill(data); Utils.showToast(t('bill_created'), 'success'); } $('#bill-modal').removeClass('active'); loadBills(); } catch (err) { Utils.showToast(err.message, 'error'); }
  });

  window.deleteBill = async function (id) {
    if (!Utils.confirm(t('delete') + '?')) return;
    try { await API.deleteBill(id); Utils.showToast(t('bill_status_updated'), 'success'); loadBills(); } catch (err) { Utils.showToast(err.message, 'error'); }
  };

  window.cycleStatus = async function (id) { try { await API.togglePaid(id); Utils.showToast(t('bill_status_updated'), 'success'); loadBills(); } catch (e) { Utils.showToast(e.message, 'error'); } };

  // Single Bill PDF — uses embedded Noto font (Hindi + ₹)
  window.exportSinglePDF = async function (id) {
    const bill = currentBills.find(b => b.id === id); if (!bill) return;
    const doc = await Utils.preparePDF();
    const sym = Utils.getCurrencySymbol();
    const prevML = Utils.formatMonth(Utils.getPrevMonth(bill.month));
    const curML = Utils.formatMonth(bill.month);
    doc.setFontSize(18); doc.setTextColor(108, 92, 231); doc.text('RentUp', 14, 20);
    doc.setFontSize(11); doc.setTextColor(100); doc.text(t('pdf_title'), 14, 28);
    doc.setFontSize(10); doc.setTextColor(60);
    const info = [[t('pdf_tenant'), bill.tenant_name || '-'], [t('pdf_room'), bill.room_name], [t('pdf_property'), bill.property_name], [t('pdf_month'), curML], [t('pdf_status'), Utils.getStatusLabel(bill.is_paid)], [t('pdf_generated'), new Date().toLocaleDateString()]];
    let y = 38;
    info.forEach(([l, v]) => { Utils.pdfBold(doc); doc.text(l + ':', 14, y); Utils.pdfNormal(doc); doc.text(String(v), 65, y); y += 7; });
    y += 4; doc.setFontSize(9); doc.setTextColor(130);
    doc.text(t('pdf_elec_gas_note', { prevMonth: prevML }), 14, y); y += 5;
    doc.text(t('pdf_rent_note', { currentMonth: curML }), 14, y); y += 8;
    doc.autoTable({ startY: y,
      head: [[t('pdf_item'), t('pdf_details'), t('pdf_amount')]],
      body: [[t('pdf_rent'), t('pdf_rent_detail', { month: curML }), sym + ' ' + bill.rent_amount.toLocaleString()], [t('pdf_electricity'), t('pdf_elec_detail', { units: bill.electricity_units, rate: bill.electricity_rate, month: prevML }), sym + ' ' + bill.electricity_amount.toLocaleString()], [t('th_gas'), t('th_gas_units') + ': ' + (bill.gas_units||0), sym + ' ' + bill.gas_amount.toLocaleString()]],
      foot: [[t('pdf_total'), '', sym + ' ' + bill.total_amount.toLocaleString()]],
      theme: 'grid', headStyles: { fillColor: [108, 92, 231], textColor: 255, fontStyle: 'bold', fontSize: 10 }, footStyles: { fillColor: [240, 240, 250], textColor: [30, 30, 60], fontStyle: 'bold', fontSize: 11 }, styles: { fontSize: 9.5, cellPadding: 6, font: 'NotoSans' },
    });
    if (bill.notes) { const fy = doc.lastAutoTable.finalY + 10; doc.setFontSize(10); doc.setTextColor(80); Utils.pdfBold(doc); doc.text(t('pdf_notes') + ':', 14, fy); Utils.pdfNormal(doc); doc.text(bill.notes, 14, fy + 7); }
    doc.save(`RentUp_${bill.tenant_name || bill.room_name}_${bill.month}.pdf`);
    Utils.showToast(t('bill_pdf_downloaded'), 'success');
  };

  window.exportSingleExcel = function (id) {
    const b = currentBills.find(x => x.id === id); if (!b) return;
    const sym = Utils.getCurrencySymbol();
    const data = [{ [t('th_tenant')]: b.tenant_name || '-', [t('th_room')]: b.room_name, [t('th_property')]: b.property_name, [t('th_month')]: Utils.formatMonth(b.month), [t('th_rent')]: sym + ' ' + b.rent_amount, [t('th_elec_units')]: b.electricity_units, [t('th_elec_amount')]: sym + ' ' + b.electricity_amount, [t('th_gas_units')]: b.gas_units || 0, [t('th_gas')]: sym + ' ' + b.gas_amount, [t('th_total')]: sym + ' ' + b.total_amount, [t('th_status')]: Utils.getStatusLabel(b.is_paid), 'Generated On': new Date().toLocaleString() }];
    const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, t('nav_billing'));
    XLSX.writeFile(wb, `RentUp_${b.tenant_name || b.room_name}_${b.month}.xlsx`);
  };

  // Consolidated PDF
  $('#btn-export-all-pdf').on('click', async function () {
    if (!currentBills.length) { Utils.showToast(t('bill_no_bills_export'), 'error'); return; }
    const doc = await Utils.preparePDF();
    const sym = Utils.getCurrencySymbol();
    doc.setFontSize(18); doc.setTextColor(108, 92, 231); doc.text('RentUp', 14, 20);
    doc.setFontSize(12); doc.setTextColor(60); doc.text(t('bill_consolidated_title'), 14, 30);
    const total = currentBills.reduce((s, b) => s + b.total_amount, 0);
    doc.setFontSize(10); doc.text(t('th_total') + ': ' + sym + ' ' + total.toLocaleString(), 14, 38);
    doc.autoTable({ startY: 44,
      head: [[t('th_tenant'), t('th_room'), t('th_property'), t('th_rent'), t('th_elec_units'), t('th_elec_amount'), t('th_gas_units'), t('th_gas'), t('th_total')]],
      body: currentBills.map(b => [b.tenant_name || '-', b.room_name, b.property_name, sym+' '+b.rent_amount.toLocaleString(), b.electricity_units, sym+' '+b.electricity_amount.toLocaleString(), b.gas_units||0, sym+' '+b.gas_amount.toLocaleString(), sym+' '+b.total_amount.toLocaleString()]),
      theme: 'grid', headStyles: { fillColor: [108, 92, 231], textColor: 255, fontSize: 8 }, styles: { fontSize: 8, cellPadding: 4, font: 'NotoSans' },
    });
    doc.save('RentUp_All_Bills.pdf'); Utils.showToast(t('bill_pdf_downloaded'), 'success');
  });

  // Consolidated Excel
  $('#btn-export-all-excel').on('click', function () {
    if (!currentBills.length) { Utils.showToast(t('bill_no_bills_export'), 'error'); return; }
    const sym = Utils.getCurrencySymbol();
    const data = currentBills.map(b => ({ [t('th_tenant')]: b.tenant_name || '-', [t('th_room')]: b.room_name, [t('th_property')]: b.property_name, [t('th_month')]: Utils.formatMonth(b.month), [t('th_rent')]: sym+' '+b.rent_amount, [t('th_elec_units')]: b.electricity_units, [t('th_elec_amount')]: sym+' '+b.electricity_amount, [t('th_gas_units')]: b.gas_units||0, [t('th_gas')]: sym+' '+b.gas_amount, [t('th_total')]: sym+' '+b.total_amount, [t('th_status')]: Utils.getStatusLabel(b.is_paid), 'Generated On': new Date().toLocaleString() }));
    const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, t('nav_billing'));
    XLSX.writeFile(wb, 'RentUp_All_Bills.xlsx'); Utils.showToast(t('bill_excel_downloaded'), 'success');
  });

  async function init() { await loadSettings(); await Promise.all([loadProperties(), loadRooms()]); loadBills(); }
  init();
});
