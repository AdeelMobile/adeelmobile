/* User Applications */
(function () {
  var TABLE = 'verifications';
  var PROFILE_PAGE = '../User-Profile-Details/user-profile-details.html';
  var LIST_PAGE = '../users.html';
  var apps = [];
  var filter = 'all';

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function fmtDate(s) {
    if (!s) return '-';
    var d = new Date(s);
    if (isNaN(d)) return '-';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function st(a) { return String(a.status || 'pending').toLowerCase(); }

  function render() {
    var c = { pending: 0, approved: 0, rejected: 0 };
    apps.forEach(function (a) { if (c[st(a)] != null) c[st(a)]++; });
    $('sumAll').textContent = apps.length;
    $('sumPending').textContent = c.pending;
    $('sumApproved').textContent = c.approved;
    $('sumRejected').textContent = c.rejected;

    var rows = apps.filter(function (a) { return filter === 'all' || st(a) === filter; });

    if (!rows.length) {
      $('apList').innerHTML = '<div class="ap-empty">' + (apps.length ? '🔍 No applications in this filter' : '📭 No applications yet') + '</div>';
      return;
    }

    $('apList').innerHTML = rows.map(function (a) {
      var s = st(a);
      var label = s.charAt(0).toUpperCase() + s.slice(1);
      var product = [a.product, a.variant].filter(Boolean).join(' · ');
      var plan = a.plan ? a.plan : '';
      if (a.months) plan += (plan ? ' · ' : '') + a.months + ' months';
      return '<div class="ap-card">' +
        '<div class="ap-row"><div class="ap-name">👤 ' + esc(a.name || '-') + '</div>' +
          '<span class="ap-badge ' + esc(s) + '">' + esc(label) + '</span></div>' +
        (a.contact ? '<div class="ap-line">📞 ' + esc(a.contact) + '</div>' : '') +
        (product ? '<div class="ap-line">📱 ' + esc(product) + '</div>' : '') +
        (plan ? '<div class="ap-line">📐 ' + esc(plan) + '</div>' : '') +
        '<div class="ap-line">📅 ' + fmtDate(a.created_at) + '</div>' +
        (s === 'rejected' && a.rejection_reason ? '<div class="ap-reason">Reason: ' + esc(a.rejection_reason) + '</div>' : '') +
      '</div>';
    }).join('');
  }

  async function start() {
    var session = await requireLogin();
    if (!session) return;

    var userId = new URLSearchParams(window.location.search).get('id');
    if (!userId) {
      $('apMsg').textContent = '⚠️ No user selected. Please choose a user from the list.';
      $('backLink').setAttribute('href', LIST_PAGE);
      return;
    }
    $('backLink').setAttribute('href', PROFILE_PAGE + '?id=' + encodeURIComponent(userId));

    var ru = await db.from('users').select('id,name').eq('id', userId).maybeSingle();
    if (ru.error) { $('apMsg').textContent = '⚠️ Could not load: ' + ru.error.message; return; }
    if (!ru.data) { $('apMsg').textContent = '🔍 User not found'; return; }

    var res = await db.from(TABLE).select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (res.error) { $('apMsg').textContent = '⚠️ Could not load applications: ' + res.error.message; return; }
    apps = res.data || [];

    $('apUser').innerHTML = '👤 <b>' + esc(ru.data.name) + '</b>';
    $('apMsg').hidden = true;
    $('apBox').hidden = false;

    document.querySelectorAll('.ap-fbtn').forEach(function (b) {
      b.addEventListener('click', function () {
        filter = b.getAttribute('data-f');
        document.querySelectorAll('.ap-fbtn').forEach(function (x) {
          x.classList.toggle('active', x === b);
        });
        render();
      });
    });
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();