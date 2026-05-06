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
    const sym = Utils.getCurrencySymbol();
    const prevML = Utils.formatMonth(Utils.getPrevMonth(bill.month));
    const curML = Utils.formatMonth(bill.month);
    
    const html = `
      <div id="pdf-export-wrap" style="font-family: sans-serif; padding: 20px; color: #333; width: 800px; background: #fff;">
        <h1 style="color: #6c5ce7; margin: 0 0 10px 0; font-size: 28px;">RentUp</h1>
        <h3 style="color: #555; margin: 0 0 20px 0; font-size: 18px;">${t('pdf_title')}</h3>
        <table style="width: 100%; margin-bottom: 25px; font-size: 14px; border-collapse: collapse;">
          <tr><td style="padding: 6px 0; width: 30%;"><strong>${t('pdf_tenant')}:</strong></td><td style="padding: 6px 0;">${bill.tenant_name || '-'}</td></tr>
          <tr><td style="padding: 6px 0;"><strong>${t('pdf_room')}:</strong></td><td style="padding: 6px 0;">${bill.room_name}</td></tr>
          <tr><td style="padding: 6px 0;"><strong>${t('pdf_property')}:</strong></td><td style="padding: 6px 0;">${bill.property_name}</td></tr>
          <tr><td style="padding: 6px 0;"><strong>${t('pdf_month')}:</strong></td><td style="padding: 6px 0;">${curML}</td></tr>
          <tr><td style="padding: 6px 0;"><strong>${t('pdf_status')}:</strong></td><td style="padding: 6px 0;">${Utils.getStatusLabel(bill.is_paid)}</td></tr>
          <tr><td style="padding: 6px 0;"><strong>${t('pdf_generated')}:</strong></td><td style="padding: 6px 0;">${new Date().toLocaleDateString()}</td></tr>
        </table>
        
        <p style="font-size: 12px; color: #666; margin: 0 0 5px 0;">${t('pdf_elec_gas_note', { prevMonth: prevML })}</p>
        <p style="font-size: 12px; color: #666; margin: 0 0 15px 0;">${t('pdf_rent_note', { currentMonth: curML })}</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background: #6c5ce7; color: #fff;">
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">${t('pdf_item')}</th>
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">${t('pdf_details')}</th>
              <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">${t('pdf_amount')}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;">${t('pdf_rent')}</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${t('pdf_rent_detail', { month: curML })}</td>
              <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${sym} ${bill.rent_amount.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;">${t('pdf_electricity')}</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${t('pdf_elec_detail', { units: bill.electricity_units, rate: bill.electricity_rate, month: prevML })}</td>
              <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${sym} ${bill.electricity_amount.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;">${t('th_gas')}</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${t('th_gas_units')}: ${bill.gas_units||0}</td>
              <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${sym} ${bill.gas_amount.toLocaleString()}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr style="background: #f0f0fa;">
              <td colspan="2" style="padding: 10px; font-weight: bold; border: 1px solid #ddd;">${t('pdf_total')}</td>
              <td style="padding: 10px; font-weight: bold; text-align: right; border: 1px solid #ddd;">${sym} ${bill.total_amount.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
        
        ${bill.notes ? `<div style="margin-top: 20px;"><strong style="color: #444;">${t('pdf_notes')}:</strong><p style="margin: 5px 0 0 0; color: #555;">${bill.notes}</p></div>` : ''}
      </div>
    `;
    
    Utils.showToast(t('loading') || 'Generating PDF...', 'info');
    await Utils.generateHTMLPDF(html, `RentUp_${bill.tenant_name || bill.room_name}_${bill.month}.pdf`);
    Utils.showToast(t('bill_pdf_downloaded'), 'success');
  };

  window.exportSingleExcel = function (id) {
    const b = currentBills.find(x => x.id === id); if (!b) return;
    const sym = Utils.getCurrencySymbol();
    const data = [{ [t('th_tenant')]: b.tenant_name || '-', [t('th_room')]: b.room_name, [t('th_property')]: b.property_name, [t('th_month')]: Utils.formatMonth(b.month), [t('th_rent')]: sym + ' ' + b.rent_amount, [t('th_elec_units')]: b.electricity_units, [t('th_elec_amount')]: sym + ' ' + b.electricity_amount, [t('th_gas_units')]: b.gas_units || 0, [t('th_gas')]: sym + ' ' + b.gas_amount, [t('th_total')]: sym + ' ' + b.total_amount, [t('th_status')]: Utils.getStatusLabel(b.is_paid), 'Generated On': new Date().toLocaleString() }];
    const ws = XLSX.utils.json_to_sheet(data); 
    ws['!cols'] = [{wch: 20}, {wch: 15}, {wch: 25}, {wch: 12}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 12}, {wch: 20}];
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, t('nav_billing'));
    XLSX.writeFile(wb, `RentUp_${b.tenant_name || b.room_name}_${b.month}.xlsx`);
  };

  // Consolidated PDF
  $('#btn-export-all-pdf').on('click', async function () {
    if (!currentBills.length) { Utils.showToast(t('bill_no_bills_export'), 'error'); return; }
    const sym = Utils.getCurrencySymbol();
    const total = currentBills.reduce((s, b) => s + b.total_amount, 0);
    
    let rows = '';
    currentBills.forEach(b => {
      rows += `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${b.tenant_name || '-'}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${b.room_name}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${b.property_name}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${sym} ${b.rent_amount.toLocaleString()}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${b.electricity_units}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${sym} ${b.electricity_amount.toLocaleString()}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${b.gas_units || 0}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${sym} ${b.gas_amount.toLocaleString()}</td>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">${sym} ${b.total_amount.toLocaleString()}</td>
        </tr>
      `;
    });

    const html = `
      <div id="pdf-export-wrap" style="font-family: sans-serif; padding: 20px; color: #333; width: 1000px; background: #fff;">
        <h1 style="color: #6c5ce7; margin: 0 0 10px 0; font-size: 24px;">RentUp</h1>
        <h3 style="color: #555; margin: 0 0 10px 0; font-size: 16px;">${t('bill_consolidated_title')}</h3>
        <p style="margin: 0 0 20px 0; font-size: 14px;"><strong>${t('th_total')}:</strong> ${sym} ${total.toLocaleString()}</p>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
          <thead>
            <tr style="background: #6c5ce7; color: #fff;">
              <th style="padding: 8px; border: 1px solid #ddd;">${t('th_tenant')}</th>
              <th style="padding: 8px; border: 1px solid #ddd;">${t('th_room')}</th>
              <th style="padding: 8px; border: 1px solid #ddd;">${t('th_property')}</th>
              <th style="padding: 8px; border: 1px solid #ddd;">${t('th_rent')}</th>
              <th style="padding: 8px; border: 1px solid #ddd;">${t('th_elec_units')}</th>
              <th style="padding: 8px; border: 1px solid #ddd;">${t('th_elec_amount')}</th>
              <th style="padding: 8px; border: 1px solid #ddd;">${t('th_gas_units')}</th>
              <th style="padding: 8px; border: 1px solid #ddd;">${t('th_gas')}</th>
              <th style="padding: 8px; border: 1px solid #ddd;">${t('th_total')}</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;

    Utils.showToast(t('loading') || 'Generating PDF...', 'info');
    await Utils.generateHTMLPDF(html, 'RentUp_All_Bills.pdf');
    Utils.showToast(t('bill_pdf_downloaded'), 'success');
  });

  // Consolidated Excel
  $('#btn-export-all-excel').on('click', function () {
    if (!currentBills.length) { Utils.showToast(t('bill_no_bills_export'), 'error'); return; }
    const sym = Utils.getCurrencySymbol();
    const data = currentBills.map(b => ({ [t('th_tenant')]: b.tenant_name || '-', [t('th_room')]: b.room_name, [t('th_property')]: b.property_name, [t('th_month')]: Utils.formatMonth(b.month), [t('th_rent')]: sym + ' ' + b.rent_amount, [t('th_elec_units')]: b.electricity_units, [t('th_elec_amount')]: sym + ' ' + b.electricity_amount, [t('th_gas_units')]: b.gas_units || 0, [t('th_gas')]: sym + ' ' + b.gas_amount, [t('th_total')]: sym + ' ' + b.total_amount, [t('th_status')]: Utils.getStatusLabel(b.is_paid) }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [{wch: 20}, {wch: 15}, {wch: 25}, {wch: 12}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 12}];
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, t('nav_billing'));
    XLSX.writeFile(wb, 'RentUp_All_Bills.xlsx'); Utils.showToast(t('bill_excel_downloaded'), 'success');
  });

  async function init() { await loadSettings(); await Promise.all([loadProperties(), loadRooms()]); loadBills(); }
  init();
});
