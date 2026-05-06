// ============================================================
// RentUp v2 — Auth Page Logic
// ============================================================

$(function () {
  Utils.initTheme();
  $('[data-i18n]').each(function () { $(this).text(t($(this).data('i18n'))); });

  if (API.getToken()) { window.location.href = 'dashboard.html'; return; }

  $('.auth-tab').on('click', function () {
    const tab = $(this).data('tab');
    $('.auth-tab').removeClass('active');
    $(this).addClass('active');
    $('.auth-form').hide();
    $('#' + tab + '-form').fadeIn(200);
  });

  $('#login-form').on('submit', async function (e) {
    e.preventDefault();
    const btn = $(this).find('button[type="submit"]');
    btn.prop('disabled', true).text(t('auth_signing_in'));
    try {
      const res = await API.login({ email: $('#login-email').val().trim(), password: $('#login-password').val() });
      API.setToken(res.token);
      API.setUser(res.user);
      Utils.showToast(t('auth_welcome_back') + ', ' + res.user.name + '!', 'success');
      setTimeout(() => window.location.href = 'dashboard.html', 400);
    } catch (err) {
      Utils.showToast(err.message, 'error');
      btn.prop('disabled', false).text(t('auth_signin'));
    }
  });

  $('#register-form').on('submit', async function (e) {
    e.preventDefault();
    if ($('#register-password').val() !== $('#register-confirm').val()) {
      Utils.showToast(t('auth_passwords_mismatch'), 'error'); return;
    }
    const btn = $(this).find('button[type="submit"]');
    btn.prop('disabled', true).text(t('auth_creating'));
    try {
      const res = await API.register({ name: $('#register-name').val().trim(), email: $('#register-email').val().trim(), password: $('#register-password').val() });
      API.setToken(res.token);
      API.setUser(res.user);
      Utils.showToast(t('auth_account_created'), 'success');
      setTimeout(() => window.location.href = 'dashboard.html', 400);
    } catch (err) {
      Utils.showToast(err.message, 'error');
      btn.prop('disabled', false).text(t('auth_create_account'));
    }
  });
});
