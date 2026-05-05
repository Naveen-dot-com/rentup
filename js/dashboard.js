// ============================================================
// RentUp — Dashboard Logic
// ============================================================

$(function () {
  Utils.initTheme();
  if (!Utils.requireAuth()) return;
  Utils.initSidebar('dashboard');

  const $month = $('#dashboard-month');
  $month.val(Utils.getCurrentMonth());

  async function loadDashboard() {
    try {
      const res = await API.getDashboard($month.val());
      const d = res.data;

      $('#stat-properties').text(d.total_properties);
      $('#stat-rooms').text(d.total_rooms);
      $('#stat-revenue').text(Utils.formatCurrency(d.monthly_revenue));
      $('#stat-unpaid').text(d.unpaid_count);

      const $tbody = $('#recent-bills-body');
      if (!d.recent_bills || d.recent_bills.length === 0) {
        $tbody.html('<tr><td colspan="5" class="empty-state" style="padding:40px"><div class="icon">📋</div><p>No bills yet. Create your first bill!</p></td></tr>');
        return;
      }

      $tbody.empty();
      d.recent_bills.forEach(bill => {
        const statusClass = bill.is_paid ? 'badge-success' : 'badge-danger';
        const statusText = bill.is_paid ? 'Paid' : 'Unpaid';
        $tbody.append(`
          <tr class="fade-in">
            <td>${bill.property_name}</td>
            <td>${bill.room_name}</td>
            <td>${Utils.formatMonth(bill.month)}</td>
            <td style="font-weight:600">${Utils.formatCurrency(bill.total_amount)}</td>
            <td><span class="badge ${statusClass}">${statusText}</span></td>
          </tr>
        `);
      });
    } catch (err) {
      Utils.showToast(err.message, 'error');
    }
  }

  $month.on('change', loadDashboard);
  loadDashboard();
});
