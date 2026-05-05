// ============================================================
// RentUp — Rooms Page Logic
// ============================================================

$(function () {
  Utils.initTheme();
  if (!Utils.requireAuth()) return;
  Utils.initSidebar('rooms');

  let propertiesList = [];

  async function loadProperties() {
    try {
      const res = await API.getProperties();
      propertiesList = res.data || [];
      const $filter = $('#filter-property');
      const $modal = $('#room-property');
      $filter.find('option:not(:first)').remove();
      $modal.find('option:not(:first)').remove();
      propertiesList.forEach(p => {
        $filter.append(`<option value="${p.id}">${p.name}</option>`);
        $modal.append(`<option value="${p.id}">${p.name}</option>`);
      });
    } catch (err) {
      Utils.showToast(err.message, 'error');
    }
  }

  async function loadRooms() {
    try {
      const propertyId = $('#filter-property').val() || undefined;
      const res = await API.getRooms(propertyId);
      const grid = $('#rooms-grid');
      grid.empty();

      if (!res.data || res.data.length === 0) {
        grid.html(`<div class="empty-state glass-static" style="grid-column:1/-1;padding:60px">
          <div class="icon">🚪</div><h3>No rooms found</h3><p>Add rooms to your properties</p>
        </div>`);
        return;
      }

      res.data.forEach(r => {
        grid.append(`
          <div class="item-card glass slide-up">
            <div class="card-header">
              <div>
                <div class="card-title">${r.name}</div>
                <div class="card-subtitle">${r.property_name}</div>
              </div>
              <div class="card-actions">
                <button class="btn btn-secondary btn-icon btn-sm" onclick="editRoom(${r.id}, ${r.property_id}, '${r.name.replace(/'/g, "\\'")}', ${r.default_rent})">✏️</button>
                <button class="btn btn-danger btn-icon btn-sm" onclick="deleteRoom(${r.id}, '${r.name.replace(/'/g, "\\'")}')">🗑️</button>
              </div>
            </div>
            <div class="card-body">
              <span style="font-size:1.1rem;font-weight:700;color:var(--accent-light)">${Utils.formatCurrency(r.default_rent)}</span>
              <span style="color:var(--text-muted);font-size:0.8rem"> / month</span>
            </div>
          </div>
        `);
      });
    } catch (err) {
      Utils.showToast(err.message, 'error');
    }
  }

  // Filter change
  $('#filter-property').on('change', loadRooms);

  // Add room
  $('#btn-add-room').on('click', function () {
    if (propertiesList.length === 0) {
      Utils.showToast('Create a property first', 'error');
      return;
    }
    $('#room-modal-title').text('Add Room');
    $('#room-id').val('');
    $('#room-property').val('').prop('disabled', false);
    $('#room-name').val('');
    $('#room-rent').val('');
    $('#room-modal').addClass('active');
  });

  // Edit room
  window.editRoom = function (id, propertyId, name, rent) {
    $('#room-modal-title').text('Edit Room');
    $('#room-id').val(id);
    $('#room-property').val(propertyId).prop('disabled', true);
    $('#room-name').val(name);
    $('#room-rent').val(rent);
    $('#room-modal').addClass('active');
  };

  // Delete room
  window.deleteRoom = async function (id, name) {
    if (!Utils.confirm('Delete room "' + name + '"? All bills for this room will be deleted.')) return;
    try {
      await API.deleteRoom(id);
      Utils.showToast('Room deleted', 'success');
      loadRooms();
    } catch (err) {
      Utils.showToast(err.message, 'error');
    }
  };

  // Form submit
  $('#room-form').on('submit', async function (e) {
    e.preventDefault();
    const id = $('#room-id').val();
    const data = {
      property_id: parseInt($('#room-property').val()),
      name: $('#room-name').val().trim(),
      default_rent: parseFloat($('#room-rent').val()) || 0,
    };

    try {
      if (id) {
        await API.updateRoom(id, data);
        Utils.showToast('Room updated', 'success');
      } else {
        await API.createRoom(data);
        Utils.showToast('Room created', 'success');
      }
      $('#room-modal').removeClass('active');
      loadRooms();
    } catch (err) {
      Utils.showToast(err.message, 'error');
    }
  });

  loadProperties().then(loadRooms);
});
