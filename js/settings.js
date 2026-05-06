// ============================================================
// RentUp v2 — Settings Logic
// ============================================================

$(function () {
  if (!Utils.requireAuth()) return;
  Utils.initTheme();
  Utils.initSidebar('settings');
  Utils.initTopBar();
  lucide.createIcons();
  $('[data-i18n]').each(function () { $(this).text(t($(this).data('i18n'))); });

  async function loadSettings() {
    try {
      const res = await API.getSettings();
      const s = res.data;
      $('#setting-currency').val(s.currency || 'INR');
      Utils.setCurrency(s.currency || 'INR');
    } catch (e) { Utils.showToast(e.message, 'error'); }
  }

  $('#btn-save-settings').on('click', async function () {
    const currency = $('#setting-currency').val();
    const theme = localStorage.getItem('rentup_theme') || 'light';
    const language = getLang();
    try {
      await API.updateSettings({ currency, theme, language });
      Utils.setCurrency(currency);
      Utils.cacheClear('settings');
      Utils.showToast(t('settings_saved'), 'success');
    } catch (e) { Utils.showToast(e.message, 'error'); }
  });

  $('#btn-export').on('click', async function () {
    try {
      const res = await API.exportData();
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'RentUp_Backup_' + new Date().toISOString().split('T')[0] + '.json';
      a.click();
      URL.revokeObjectURL(url);
      Utils.showToast(t('settings_backup_downloaded'), 'success');
    } catch (e) { Utils.showToast(e.message, 'error'); }
  });

  loadSettings();
});
