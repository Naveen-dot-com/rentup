// ============================================================
// RentUp — Billing Page Logic (with PDF & Excel export)
// ============================================================

$(function () {
  Utils.initTheme();
  if (!Utils.requireAuth()) return;
  Utils.initSidebar('billing');

  let allBills = [];
  let roomsCache = {};

  const $month = $('#filter-month');
  const $property = $('#filter-property');
  $month.val(Utils.getCurrentMonth());

  // Load properties for filters and modal
  async function loadProperties() {
    try {
      const res = await API.getProperties();
      const list = res.data || [];
      $property.find('option:not(:first)').remove();
      $('#bill-property').find('option:not(:first)').remove();
      list.forEach(p => {
        $property.append(`<option value="${p.id}">${p.name}</option>`);
        $('#bill-property').append(`<option value="${p.id}">${p.name}</option>`);
      });
    } catch (err) { Utils.showToast(err.message, 'error'); }
  }

  // Load rooms for selected property in modal
  $('#bill-property').on('change', async function () {
    const pid = $(this).val();
    const $room = $('#bill-room');
    $room.find('option:not(:first)').remove();
    if (!pid) return;
    try {
      const res = await API.getRooms(pid);
      (res.data || []).forEach(r => {
        roomsCache[r.id] = r;
        $room.append(`<option value="${r.id}" data-rent="${r.default_rent}">${r.name} (${Utils.formatCurrency(r.default_rent)})</option>`);
      });
    } catch (err) { Utils.showToast(err.message, 'error'); }
  });

  // Auto-fill rent when room selected
  $('#bill-room').on('change', function () {
    const roomId = $(this).val();
    if (roomId && roomsCache[roomId]) {
      $('#bill-rent').attr('placeholder', roomsCache[roomId].default_rent);
    }
  });

  // Load bills
  async function loadBills() {
    try {
      const params = { month: $month.val() || undefined, property_id: $property.val() || undefined };
      const res = await API.getBills(params);
      allBills = res.data || [];
      renderBills();
    } catch (err) { Utils.showToast(err.message, 'error'); }
  }

  function renderBills() {
    const $tbody = $('#bills-body');
    $tbody.empty();

    if (allBills.length === 0) {
      $tbody.html('<tr><td colspan="10" class="empty-state" style="padding:40px"><div class="icon">💰</div><p>No bills found for this period</p></td></tr>');
      return;
    }

    allBills.forEach(b => {
      const statusClass = b.is_paid ? 'badge-success' : 'badge-danger';
      const statusText = b.is_paid ? 'Paid' : 'Unpaid';
      $tbody.append(`
        <tr class="fade-in">
          <td>${b.property_name}</td>
          <td>${b.room_name}</td>
          <td>${Utils.formatMonth(b.month)}</td>
          <td>${Utils.formatCurrency(b.rent_amount)}</td>
          <td>${b.electricity_units}</td>
          <td class="calc-value">${Utils.formatCurrency(b.electricity_amount)}</td>
          <td>${Utils.formatCurrency(b.gas_amount)}</td>
          <td class="total-value">${Utils.formatCurrency(b.total_amount)}</td>
          <td><span class="badge ${statusClass}" style="cursor:pointer" onclick="togglePaid(${b.id})">${statusText}</span></td>
          <td>
            <div style="display:flex;gap:4px">
              <button class="btn btn-secondary btn-icon btn-sm" title="Edit" onclick='editBill(${JSON.stringify(b).replace(/'/g,"&#39;")})'>✏️</button>
              <button class="btn btn-secondary btn-icon btn-sm" title="PDF" onclick='exportPDF(${JSON.stringify(b).replace(/'/g,"&#39;")})'>📄</button>
            </div>
          </td>
        </tr>
      `);
    });
  }

  // Filters
  $month.on('change', loadBills);
  $property.on('change', loadBills);

  // Toggle paid
  window.togglePaid = async function (id) {
    try {
      await API.togglePaid(id);
      Utils.showToast('Status updated', 'success');
      loadBills();
    } catch (err) { Utils.showToast(err.message, 'error'); }
  };

  // Add bill
  $('#btn-add-bill').on('click', function () {
    $('#bill-modal-title').text('New Bill');
    $('#bill-id').val('');
    $('#bill-property').val('').prop('disabled', false);
    $('#bill-room').find('option:not(:first)').remove();
    $('#bill-month').val(Utils.getCurrentMonth());
    $('#bill-rent').val('');
    $('#bill-elec-units').val('');
    $('#bill-gas-units').val('');
    $('#bill-gas-amount').val('');
    $('#bill-notes').val('');
    $('#bill-modal').addClass('active');
  });

  // Edit bill
  window.editBill = function (bill) {
    $('#bill-modal-title').text('Edit Bill');
    $('#bill-id').val(bill.id);
    $('#bill-property').val('').prop('disabled', true);
    $('#bill-month').val(bill.month);
    $('#bill-rent').val(bill.rent_amount);
    $('#bill-elec-units').val(bill.electricity_units);
    $('#bill-gas-units').val(bill.gas_units);
    $('#bill-gas-amount').val(bill.gas_amount);
    $('#bill-notes').val(bill.notes || '');
    $('#bill-modal').addClass('active');
  };

  // Form submit
  $('#bill-form').on('submit', async function (e) {
    e.preventDefault();
    const id = $('#bill-id').val();
    const data = {
      room_id: parseInt($('#bill-room').val()),
      month: $('#bill-month').val(),
      electricity_units: parseFloat($('#bill-elec-units').val()) || 0,
      gas_units: parseFloat($('#bill-gas-units').val()) || 0,
      gas_amount: parseFloat($('#bill-gas-amount').val()) || 0,
      notes: $('#bill-notes').val().trim(),
    };
    const rentVal = $('#bill-rent').val();
    if (rentVal !== '') data.rent_amount = parseFloat(rentVal);

    try {
      if (id) {
        await API.updateBill(id, data);
        Utils.showToast('Bill updated', 'success');
      } else {
        if (!data.room_id) { Utils.showToast('Please select a room', 'error'); return; }
        await API.createBill(data);
        Utils.showToast('Bill created', 'success');
      }
      $('#bill-modal').removeClass('active');
      loadBills();
    } catch (err) { Utils.showToast(err.message, 'error'); }
  });

  // ---- PDF Export (per bill) ----
  window.exportPDF = function (bill) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const user = API.getUser();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(108, 92, 231);
    doc.text('RentUp', 20, 25);
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 140);
    doc.text('Monthly Bill Invoice', 20, 33);

    // Divider
    doc.setDrawColor(200, 200, 220);
    doc.line(20, 38, 190, 38);

    // Bill info
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 60);
    doc.text('Property:', 20, 50);
    doc.text(bill.property_name || '', 70, 50);
    doc.text('Room:', 20, 58);
    doc.text(bill.room_name || '', 70, 58);
    doc.text('Month:', 20, 66);
    doc.text(Utils.formatMonth(bill.month), 70, 66);
    doc.text('Status:', 20, 74);
    doc.text(bill.is_paid ? 'PAID' : 'UNPAID', 70, 74);
    doc.text('Generated:', 130, 50);
    doc.text(new Date().toLocaleDateString(), 165, 50);

    // Table
    doc.autoTable({
      startY: 85,
      head: [['Item', 'Details', 'Amount']],
      body: [
        ['Rent', 'Monthly rent', bill.rent_amount.toLocaleString()],
        ['Electricity', bill.electricity_units + ' units × ' + bill.electricity_rate + '/unit', bill.electricity_amount.toLocaleString()],
        ['Gas', bill.gas_units + ' units', bill.gas_amount.toLocaleString()],
      ],
      foot: [['', 'TOTAL', bill.total_amount.toLocaleString()]],
      styles: { fontSize: 10, cellPadding: 6 },
      headStyles: { fillColor: [108, 92, 231], textColor: 255 },
      footStyles: { fillColor: [240, 240, 245], textColor: [40, 40, 60], fontStyle: 'bold' },
      theme: 'grid',
    });

    // Notes
    if (bill.notes) {
      const y = doc.lastAutoTable.finalY + 15;
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 120);
      doc.text('Notes: ' + bill.notes, 20, y);
    }

    doc.save('RentUp_Bill_' + bill.room_name + '_' + bill.month + '.pdf');
    Utils.showToast('PDF downloaded', 'success');
  };

  // ---- Excel Export (monthly) ----
  $('#btn-export-excel').on('click', function () {
    if (allBills.length === 0) {
      Utils.showToast('No bills to export', 'error');
      return;
    }
    const data = allBills.map(b => ({
      Property: b.property_name,
      Room: b.room_name,
      Month: b.month,
      'Rent': b.rent_amount,
      'Elec Units': b.electricity_units,
      'Elec Rate': b.electricity_rate,
      'Elec Amount': b.electricity_amount,
      'Gas Units': b.gas_units,
      'Gas Amount': b.gas_amount,
      'Total': b.total_amount,
      Status: b.is_paid ? 'Paid' : 'Unpaid',
      Notes: b.notes || '',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bills');

    // Column widths
    ws['!cols'] = [
      { wch: 20 }, { wch: 15 }, { wch: 10 }, { wch: 12 },
      { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 10 },
      { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 20 },
    ];

    const month = $month.val() || 'all';
    XLSX.writeFile(wb, 'RentUp_Bills_' + month + '.xlsx');
    Utils.showToast('Excel downloaded', 'success');
  });

  loadProperties().then(loadBills);
});
