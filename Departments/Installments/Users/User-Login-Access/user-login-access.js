/* User Login & Access (create login, reset password, remove login) */
(function () {
  var FUNCTION_NAME = 'manage-user-login';
  var PROFILE_PAGE = '../User-Profile-Details/user-profile-details.html';
  var LIST_PAGE = '../users.html';
  var userId = null;
  var userRow = null;

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function toast(text) {
    var t = document.createElement('div');
    t.className = 'lg-toast';
    t.textContent = text;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 3000);
  }

  // "Ustad Yasir" -> "ustadyasir"
  function suggestUsername(name) {
    return String(name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  // Call the Edge Function; returns { ok, error }
  async function callFn(body) {
    body.user_id = userId;
    var res = await db.functions.invoke(FUNCTION_NAME, { body: body });
    if (res.error) {
      var msg = res.error.message || 'Request failed';
      try {
        if (res.error.context && res.error.context.json) {
          var j = await res.error.context.json();
          if (j && j.error) msg = j.error;
        }
      } catch (e) { /* keep default message */ }
      return { ok: false, error: msg };
    }
    if (res.data && res.data.error) return { ok: false, error: res.data.error };
    return { ok: true, data: res.data };
  }

  function show() {
    var has = !!userRow.auth_user_id;
    $('secCreate').hidden = has;
    $('secManage').hidden = !has;
    if (has) $('mUser').textContent = userRow.login_username || '-';
    else if (!$('cUser').value) $('cUser').value = suggestUsername(userRow.name);
  }

  async function reloadUser() {
    var res = await db.from('users').select('id,name,referral_code,auth_user_id,login_username').eq('id', userId).maybeSingle();
    if (res.error || !res.data) { toast('Could not reload user'); return; }
    userRow = res.data;
    show();
  }

  async function createLogin() {
    var username = $('cUser').value.trim().toLowerCase();
    var password = $('cPass').value;
    if (!username) { toast('Enter a username'); return; }
    if (password.length < 6) { toast('Password must be at least 6 characters'); return; }

    var btn = $('createBtn');
    btn.disabled = true;
    btn.textContent = 'Creating...';
    var r = await callFn({ action: 'create', username: username, password: password });
    btn.disabled = false;
    btn.textContent = 'Create Login';

    if (!r.ok) { toast(r.error); return; }
    $('cPass').value = '';
    toast('Login created');
    reloadUser();
  }

  async function resetPassword() {
    var password = $('rPass').value;
    if (password.length < 6) { toast('Password must be at least 6 characters'); return; }

    var btn = $('resetBtn');
    btn.disabled = true;
    btn.textContent = 'Saving...';
    var r = await callFn({ action: 'reset', password: password });
    btn.disabled = false;
    btn.textContent = 'Change Password';

    if (!r.ok) { toast(r.error); return; }
    $('rPass').value = '';
    toast('Password changed');
  }

  async function removeLogin() {
    if (!window.confirm('Remove this user\'s login?')) return;
    var btn = $('removeBtn');
    btn.disabled = true;
    var r = await callFn({ action: 'delete' });
    btn.disabled = false;

    if (!r.ok) { toast(r.error); return; }
    $('cUser').value = '';
    toast('Login removed');
    reloadUser();
  }

  async function start() {
    var session = await requireLogin();
    if (!session) return;

    userId = new URLSearchParams(window.location.search).get('id');
    if (!userId) {
      $('lgMsg').textContent = 'No user selected. Please choose a user from the list.';
      $('backLink').setAttribute('href', LIST_PAGE);
      return;
    }
    $('backLink').setAttribute('href', PROFILE_PAGE + '?id=' + encodeURIComponent(userId));

    var res = await db.from('users').select('id,name,referral_code,auth_user_id,login_username').eq('id', userId).maybeSingle();
    if (res.error) { $('lgMsg').textContent = 'Could not load: ' + res.error.message; return; }
    if (!res.data) { $('lgMsg').textContent = 'User not found'; return; }
    userRow = res.data;

    $('lgUser').innerHTML = '<b>' + esc(userRow.name) + '</b> | Code: <b>' + esc(userRow.referral_code || '-') + '</b>';
    $('lgMsg').hidden = true;
    $('lgBox').hidden = false;

    $('createBtn').addEventListener('click', createLogin);
    $('resetBtn').addEventListener('click', resetPassword);
    $('removeBtn').addEventListener('click', removeLogin);
    show();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();