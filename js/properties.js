// ============================================================
// RentUp — Properties Page Logic
// ============================================================

$(function () {
  Utils.initTheme();
  if (!Utils.requireAuth()) return;
  Utils.initSidebar('properties');

  async function loadProperties() {
    try {
      const res = await API.getProperties();
      const grid = $('#properties-grid');
      grid.empty();

      if (!res.data || res.data.length === 0) {
        grid.html(`<div class="empty-state glass-static" style="grid-column:1/-1;padding:60px">
          <div class="icon">🏢</div><h3>No properties yet</h3>
          <p>Add your first property to get started</p>
        </div>`);
        return;
      }

      res.data.forEach(p => {
        grid.append(`
          <div class="item-card glass slide-up">
            <div class="card-header">
              <div>
                <div class="card-title">${p.name}</div>
                <div class="card-subtitle">${p.address || 'No address'}</div>
              </div>
              <div class="card-actions">
                <button class="btn btn-secondary btn-icon btn-sm" onclick="editProperty(${p.id}, '${p.name.replace(/'/g, "\\'")}', '${(p.address || '').replace(/'/g, "\\'")}')">✏️</button>
                <button class="btn btn-danger btn-icon btn-sm" onclick="deleteProperty(${p.id}, '${p.name.replace(/'/g, "\\'")}')">🗑️</button>
              </div>
            </div>
            <div class="card-body">
              <span class="badge badge-accent">${p.room_count || 0} rooms</span>
              <span style="color:var(--text-muted);font-size:0.8rem;margin-left:8px">Added ${Utils.formatDate(p.created_at)}</span>
            </div>
          </div>
        `);
      });
    } catch (err) {
      Utils.showToast(err.message, 'error');
    }
  }

  // Add property
  $('#btn-add-property').on('click', function () {
    $('#modal-title').text('Add Property');
    $('#property-id').val('');
    $('#property-name').val('');
    $('#property-address').val('');
    $('#property-modal').addClass('active');
  });

  // Edit property
  window.editProperty = function (id, name, address) {
    $('#modal-title').text('Edit Property');
    $('#property-id').val(id);
    $('#property-name').val(name);
    $('#property-address').val(address);
    $('#property-modal').addClass('active');
  };

  // Delete property
  window.deleteProperty = async function (id, name) {
    if (!Utils.confirm('Delete property "' + name + '"? This will also delete all rooms and bills under it.')) return;
    try {
      await API.deleteProperty(id);
      Utils.showToast('Property deleted', 'success');
      loadProperties();
    } catch (err) {
      Utils.showToast(err.message, 'error');
    }
  };

  // Form submit
  $('#property-form').on('submit', async function (e) {
    e.preventDefault();
    const id = $('#property-id').val();
    const data = { name: $('#property-name').val().trim(), address: $('#property-address').val().trim() };

    try {
      if (id) {
        await API.updateProperty(id, data);
        Utils.showToast('Property updated', 'success');
      } else {
        await API.createProperty(data);
        Utils.showToast('Property created', 'success');
      }
      $('#property-modal').removeClass('active');
      loadProperties();
    } catch (err) {
      Utils.showToast(err.message, 'error');
    }
  });

  loadProperties();
});
