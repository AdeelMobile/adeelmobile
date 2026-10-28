/* User Performance Reports */
(function () {
  var PROFILE_PAGE = '../User-Profile-Details/user-profile-details.html';
  var LIST_PAGE = '../users.html';
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
                'August', 'September', 'October', 'November', 'December'];
  var target = 0;
  var sales = [];
  var apps = [];

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function money(n) { return 'Rs ' + Number(n || 0).toLocaleString('en-US'); }

  // yyyy-mm (local time)
  function monthKey(s) {
    var d = new Date(s);
    if (isNaN(d)) return '';
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  function monthLabel(key) {
    var p = key.split('-');
    return MONTHS[Number(p[1]) - 1] + ' ' + p[0];
  }

  function status(r) { return String(r.status || '').toLowerCase(); }

  function render() {
    var key = $('fMonth').value;

    // Sales vs target (selected month)
    var total = 0;
    sales.forEach(function (r) {
      if (!key || monthKey(r.created_at) === key) total += Number(r.sale_amount || 0);
    });
    var pct = target > 0 ? Math.round((total / target) * 100) : 0;
    var remain = Math.max(0, target - total);

    $('sSales').textContent = money(total);
    $('sTarget').textContent = money(target);
    $('sPct').textContent = target > 0 ? pct + '%' : '-';
    $('sRemain').textContent = money(remain);
    $('prFill').style.width = Math.min(100, pct) + '%';
    $('prNote').textContent = target > 0
      ? (total >= target ? 'Target achieved' : 'Target not reached yet')
      : 'No target set for this user';

    // Applications (selected month)
    var a = { total: 0, pending: 0, approved: 0, rejected: 0 };
    apps.forEach(function (r) {
      if (key && monthKey(r.created_at) !== key) return;
      a.total++;
      var s = status(r);
      if (s === 'pending') a.pending++;
      else if (s === 'approved') a.approved++;
      else if (s === 'rejected') a.rejected++;
    });
    $('aTotal').textContent = a.total;
    $('aPending').textContent = a.pending;
    $('aApproved').textContent = a.approved;
    $('aRejected').textContent = a.rejected;

    renderHistory();
  }

  function renderHistory() {
    var map = {};
    sales.forEach(function (r) {
      var k = monthKey(r.created_at);
      if (!k) return;
      if (!map[k]) map[k] = { sales: 0, inc: 0, count: 0 };
      map[k].sales += Number(r.sale_amount || 0);
      map[k].inc += Number(r.incentive_amount || 0);
      map[k].count++;
    });
    var keys = Object.keys(map).sort().reverse();

    if (!keys.length) {
      $('prList').innerHTML = '<div class="pr-empty">No sales yet</div>';
      return;
    }

    $('prList').innerHTML = keys.map(function (k) {
      var m = map[k];
      var hit = target > 0 && m.sales >= target;
      var pct = target > 0 ? Math.round((m.sales / target) * 100) + '%' : '-';
      return '<div class="pr-card">' +
        '<div class="pr-row"><div class="pr-month">' + monthLabel(k) + '</div>' +
          '<span class="pr-pill ' + (hit ? 'hit' : '') + '">' + pct + '</span></div>' +
        '<div class="pr-line">Sales: <b>' + money(m.sales) + '</b></div>' +
        '<div class="pr-line">Incentive: <b>' + money(m.inc) + '</b></div>' +
        '<div class="pr-line">Orders: ' + m.count + '</div>' +
      '</div>';
    }).join('');
  }

  async function start() {
    var session = await requireLogin();
    if (!session) return;

    var userId = new URLSearchParams(window.location.search).get('id');
    if (!userId) {
      $('prMsg').textContent = 'No user selected. Please choose a user from the list.';
      $('backLink').setAttribute('href', LIST_PAGE);
      return;
    }
    $('backLink').setAttribute('href', PROFILE_PAGE + '?id=' + encodeURIComponent(userId));

    var ru = await db.from('users').select('id,name,referral_code,sale_target').eq('id', userId).maybeSingle();
    if (ru.error) { $('prMsg').textContent = 'Could not load: ' + ru.error.message; return; }
    if (!ru.data) { $('prMsg').textContent = 'User not found'; return; }
    var u = ru.data;
    target = Number(u.sale_target || 0);

    if (u.referral_code) {
      var rs = await db.from('sales_incentives').select('sale_amount,incentive_amount,created_at').eq('referral_user', u.referral_code);
      if (rs.error) { $('prMsg').textContent = 'Could not load sales: ' + rs.error.message; return; }
      sales = rs.data || [];
    }

    var ra = await db.from('verifications').select('status,created_at').eq('user_id', userId);
    if (ra.error) { $('prMsg').textContent = 'Could not load applications: ' + ra.error.message; return; }
    apps = ra.data || [];

    $('prUser').innerHTML = '<b>' + esc(u.name) + '</b> | Code: <b>' + esc(u.referral_code || '-') + '</b>';
    $('prMsg').hidden = true;
    $('prBox').hidden = false;

    $('fMonth').value = monthKey(new Date().toISOString());
    $('fMonth').addEventListener('change', render);
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();