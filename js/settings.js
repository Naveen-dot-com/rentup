// ============================================================
// RentUp — Settings Page Logic
// ============================================================

$(function () {
  Utils.initTheme();
  if (!Utils.requireAuth()) return;
  Utils.initSidebar('settings');

  // Load settings
  async function loadSettings() {
    try {
      const res = await API.getSettings();
      const s = res.data;
      $('#electricity-rate').val(s.electricity_rate);
      $('#currency').val(s.currency);

      const isDark = (s.theme || 'dark') === 'dark';
      $('#theme-toggle').prop('checked', isDark);
      Utils.setTheme(isDark ? 'dark' : 'light');
      localStorage.setItem('rentup_currency', s.currency);
    } catch (err) {
      Utils.showToast(err.message, 'error');
    }
  }

  // Theme toggle live preview
  $('#theme-toggle').on('change', function () {
    const theme = $(this).is(':checked') ? 'dark' : 'light';
    Utils.setTheme(theme);
  });

  // Save settings
  $('#btn-save-settings').on('click', async function () {
    const data = {
      electricity_rate: parseFloat($('#electricity-rate').val()) || 35,
      currency: $('#currency').val(),
      theme: $('#theme-toggle').is(':checked') ? 'dark' : 'light',
    };
    try {
      await API.updateSettings(data);
      localStorage.setItem('rentup_currency', data.currency);
      Utils.showToast('Settings saved', 'success');
    } catch (err) {
      Utils.showToast(err.message, 'error');
    }
  });

  // Export backup
  $('#btn-export-backup').on('click', async function () {
    try {
      const res = await API.exportAll();
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'RentUp_Backup_' + new Date().toISOString().slice(0, 10) + '.json';
      a.click();
      URL.revokeObjectURL(url);
      Utils.showToast('Backup downloaded', 'success');
    } catch (err) {
      Utils.showToast(err.message, 'error');
    }
  });

  loadSettings();
});
