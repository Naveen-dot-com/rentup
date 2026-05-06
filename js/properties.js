// ============================================================
// RentUp v2 — Properties Logic
// ============================================================

$(function () {
  if (!Utils.requireAuth()) return;
  Utils.initTheme();
  Utils.initSidebar('properties');
  Utils.initTopBar();
  lucide.createIcons();
  $('[data-i18n]').each(function () { $(this).text(t($(this).data('i18n'))); });
  $('#property-name').attr('placeholder', t('prop_name_ph'));
  $('#property-address').attr('placeholder', t('prop_address_ph'));
  $('#property-elec-rate').attr('placeholder', t('prop_elec_rate_ph'));

  async function loadProperties() {
    const cached = Utils.cacheGet('properties');
    if (cached) render(cached);
    try {
      const res = await API.getProperties();
      render(res.data);
      Utils.cacheSet('properties', res.data);
    } catch (e) {
      if (!cached) Utils.showToast(e.message, 'error');
    }
  }

  // Search properties
  $('#search-properties').on('input', function() {
    const q = $(this).val().toLowerCase();
    $('#properties-grid .item-card').each(function() {
      $(this).toggle($(this).text().toLowerCase().includes(q));
    });
  });

  function render(properties) {
    const grid = $('#properties-grid');
    if (!properties.length) {
      grid.html(`<div class="empty-state"><div class="e-icon"><i data-lucide="building-2"></i></div><h3>${t('prop_no_properties')}</h3><p>${t('prop_no_properties_desc')}</p></div>`);
      lucide.createIcons();
      return;
    }
    grid.html(properties.map(p => `
      <div class="item-card glass slide-up">
        <div class="card-header">
          <div>
            <div class="card-title">${p.name}</div>
            <div class="card-subtitle">${p.address || ''}</div>
          </div>
          <div class="card-actions">
            <button class="btn btn-icon btn-secondary btn-sm" onclick="editProperty(${p.id}, '${p.name.replace(/'/g, "\\'")}', '${(p.address || '').replace(/'/g, "\\'")}', ${p.electricity_rate || 35})" title="${t('edit')}"><i data-lucide="pencil"></i></button>
            <button class="btn btn-icon btn-danger btn-sm" onclick="deleteProperty(${p.id}, '${p.name.replace(/'/g, "\\'")}')" title="${t('delete')}"><i data-lucide="trash-2"></i></button>
          </div>
        </div>
        <div class="card-body">
          <div class="card-meta">
            <span class="badge badge-accent"><i data-lucide="door-open" style="width:12px;height:12px;margin-right:4px"></i> ${p.room_count || 0} ${t('prop_rooms_count')}</span>
            <span class="badge badge-warning"><i data-lucide="zap" style="width:12px;height:12px;margin-right:4px"></i> ${p.electricity_rate || 35} ${t('per_unit')}</span>
          </div>
        </div>
      </div>
    `).join(''));
    lucide.createIcons();
  }

  $('#btn-add-property').on('click', function () {
    $('#property-id').val('');
    $('#property-modal-title').text(t('prop_add_title'));
    $('#property-form')[0].reset();
    $('#property-elec-rate').val(35);
    $('#property-modal').addClass('active');
  });

  window.editProperty = function (id, name, address, rate) {
    $('#property-id').val(id);
    $('#property-modal-title').text(t('prop_edit'));
    $('#property-name').val(name);
    $('#property-address').val(address);
    $('#property-elec-rate').val(rate);
    $('#property-modal').addClass('active');
  };

  window.deleteProperty = async function (id, name) {
    if (!Utils.confirm(t('prop_delete_confirm', { name }))) return;
    try {
      await API.deleteProperty(id);
      Utils.showToast(t('prop_deleted'), 'success');
      Utils.cacheClear('properties');
      loadProperties();
    } catch (e) { Utils.showToast(e.message, 'error'); }
  };

  $('#property-form').on('submit', async function (e) {
    e.preventDefault();
    const data = {
      name: $('#property-name').val().trim(),
      address: $('#property-address').val().trim(),
      electricity_rate: parseFloat($('#property-elec-rate').val()) || 35,
    };
    const id = $('#property-id').val();
    try {
      if (id) {
        await API.updateProperty(id, data);
        Utils.showToast(t('prop_updated'), 'success');
      } else {
        await API.createProperty(data);
        Utils.showToast(t('prop_created'), 'success');
      }
      $('#property-modal').removeClass('active');
      Utils.cacheClear('properties');
      loadProperties();
    } catch (e) { Utils.showToast(e.message, 'error'); }
  });

  loadProperties();
});
