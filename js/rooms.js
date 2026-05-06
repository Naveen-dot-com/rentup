// ============================================================
// RentUp v2 — Rooms Logic
// ============================================================

$(function () {
  if (!Utils.requireAuth()) return;
  Utils.initTheme();
  Utils.initSidebar('rooms');
  Utils.initTopBar();
  lucide.createIcons();
  $('[data-i18n]').each(function () { $(this).text(t($(this).data('i18n'))); });
  $('#room-name').attr('placeholder', t('room_name_ph'));
  $('#room-tenant').attr('placeholder', t('room_tenant_ph'));
  $('#room-rent').attr('placeholder', t('room_rent_ph'));

  // Load settings for currency
  (async () => {
    try {
      const res = await API.getSettings();
      Utils.setCurrency(res.data.currency || 'INR');
    } catch {}
  })();

  let allProperties = [];

  async function loadProperties() {
    const cached = Utils.cacheGet('properties');
    if (cached) populatePropertyFilters(cached);
    try {
      const res = await API.getProperties();
      allProperties = res.data;
      populatePropertyFilters(res.data);
      Utils.cacheSet('properties', res.data);
    } catch {}
  }

  function populatePropertyFilters(props) {
    allProperties = props;
    const filter = $('#filter-property');
    const modal = $('#room-property');
    filter.find('option:not(:first)').remove();
    modal.find('option:not(:first)').remove();
    props.forEach(p => {
      filter.append(`<option value="${p.id}">${p.name}</option>`);
      modal.append(`<option value="${p.id}">${p.name}</option>`);
    });
  }

  async function loadRooms() {
    const propId = $('#filter-property').val();
    const cacheKey = 'rooms_' + propId;
    const cached = Utils.cacheGet(cacheKey);
    if (cached) render(cached);
    try {
      const res = await API.getRooms(propId);
      render(res.data);
      Utils.cacheSet(cacheKey, res.data);
    } catch (e) {
      if (!cached) Utils.showToast(e.message, 'error');
    }
  }

  function render(rooms) {
    const grid = $('#rooms-grid');
    if (!rooms.length) {
      grid.html(`<div class="empty-state"><div class="e-icon"><i data-lucide="door-open"></i></div><h3>${t('room_no_rooms')}</h3><p>${t('room_no_rooms_desc')}</p></div>`);
      lucide.createIcons();
      return;
    }
    grid.html(rooms.map(r => `
      <div class="item-card glass slide-up">
        <div class="card-header">
          <div>
            <div class="card-title">${r.name}</div>
            <div class="card-subtitle">${r.property_name}</div>
          </div>
          <div class="card-actions">
            <button class="btn btn-icon btn-secondary btn-sm" onclick="editRoom(${JSON.stringify(r).replace(/"/g, '&quot;')})" title="${t('edit')}"><i data-lucide="pencil"></i></button>
            <button class="btn btn-icon btn-danger btn-sm" onclick="deleteRoom(${r.id}, '${r.name.replace(/'/g, "\\'")}')" title="${t('delete')}"><i data-lucide="trash-2"></i></button>
          </div>
        </div>
        <div class="card-body">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;padding:8px 10px;border-radius:8px;background:${r.tenant_name ? 'var(--success-bg)' : 'var(--warning-bg)'}">
            <i data-lucide="user" style="width:16px;height:16px;color:${r.tenant_name ? 'var(--success)' : 'var(--warning)'}"></i>
            <span style="font-weight:600;font-size:0.9rem;color:${r.tenant_name ? 'var(--success)' : 'var(--warning)'}">${r.tenant_name || t('room_no_tenant')}</span>
          </div>
          <div class="card-meta">
            <span class="badge badge-accent">${Utils.formatCurrency(r.default_rent)} ${t('room_per_month')}</span>
          </div>
        </div>
      </div>
    `).join(''));
    lucide.createIcons();
  }

  $('#filter-property').on('change', loadRooms);

  $('#btn-add-room').on('click', function () {
    if (!allProperties.length) { Utils.showToast(t('room_create_property_first'), 'error'); return; }
    $('#room-id').val('');
    $('#room-modal-title').text(t('room_add_title'));
    $('#room-form')[0].reset();
    $('#room-modal').addClass('active');
  });

  window.editRoom = function (r) {
    $('#room-id').val(r.id);
    $('#room-modal-title').text(t('room_edit'));
    $('#room-name').val(r.name);
    $('#room-tenant').val(r.tenant_name || '');
    $('#room-rent').val(r.default_rent);
    $('#room-property').val(r.property_id);
    $('#room-modal').addClass('active');
  };

  window.deleteRoom = async function (id, name) {
    if (!Utils.confirm(t('room_delete_confirm', { name }))) return;
    try {
      await API.deleteRoom(id);
      Utils.showToast(t('room_deleted'), 'success');
      Utils.cacheClear('rooms');
      loadRooms();
    } catch (e) { Utils.showToast(e.message, 'error'); }
  };

  $('#room-form').on('submit', async function (e) {
    e.preventDefault();
    const data = {
      property_id: parseInt($('#room-property').val()),
      name: $('#room-name').val().trim(),
      tenant_name: $('#room-tenant').val().trim(),
      default_rent: parseFloat($('#room-rent').val()) || 0,
    };
    const id = $('#room-id').val();
    try {
      if (id) {
        await API.updateRoom(id, data);
        Utils.showToast(t('room_updated'), 'success');
      } else {
        await API.createRoom(data);
        Utils.showToast(t('room_created'), 'success');
      }
      $('#room-modal').removeClass('active');
      Utils.cacheClear('rooms');
      loadRooms();
    } catch (e) { Utils.showToast(e.message, 'error'); }
  });

  loadProperties().then(loadRooms);
});
