// ============================================================
// RentUp — Auth Page Logic (index.html)
// ============================================================

$(function () {
  Utils.initTheme();

  // If already logged in, redirect to dashboard
  if (API.getToken()) {
    window.location.href = 'dashboard.html';
    return;
  }

  // Tab switching
  $('.auth-tab').on('click', function () {
    const tab = $(this).data('tab');
    $('.auth-tab').removeClass('active');
    $(this).addClass('active');
    $('.auth-form').hide();
    $('#' + tab + '-form').fadeIn(200);
  });

  // Login
  $('#login-form').on('submit', async function (e) {
    e.preventDefault();
    const btn = $(this).find('button[type="submit"]');
    btn.prop('disabled', true).text('Signing in...');
    try {
      const res = await API.login({
        email: $('#login-email').val().trim(),
        password: $('#login-password').val(),
      });
      API.setToken(res.token);
      API.setUser(res.user);
      Utils.showToast('Welcome back, ' + res.user.name + '!', 'success');
      setTimeout(() => window.location.href = 'dashboard.html', 500);
    } catch (err) {
      Utils.showToast(err.message, 'error');
      btn.prop('disabled', false).text('Sign In');
    }
  });

  // Register
  $('#register-form').on('submit', async function (e) {
    e.preventDefault();
    const pass = $('#register-password').val();
    const confirm = $('#register-confirm').val();
    if (pass !== confirm) {
      Utils.showToast('Passwords do not match', 'error');
      return;
    }
    const btn = $(this).find('button[type="submit"]');
    btn.prop('disabled', true).text('Creating account...');
    try {
      const res = await API.register({
        name: $('#register-name').val().trim(),
        email: $('#register-email').val().trim(),
        password: pass,
      });
      API.setToken(res.token);
      API.setUser(res.user);
      Utils.showToast('Account created! Welcome!', 'success');
      setTimeout(() => window.location.href = 'dashboard.html', 500);
    } catch (err) {
      Utils.showToast(err.message, 'error');
      btn.prop('disabled', false).text('Create Account');
    }
  });
});
