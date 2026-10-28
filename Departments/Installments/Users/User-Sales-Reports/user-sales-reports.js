/* User Sales Reports */
(function () {
  var TABLE = 'sales_incentives';
  var PROFILE_PAGE = '../User-Profile-Details/user-profile-details.html';
  var LIST_PAGE = '../users.html';
  var sales = [];

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function money(n) { return 'Rs ' + Number(n || 0).toLocaleString('en-US'); }

  function fmtDate(s) {
    if (!s) return '-';
    var d = new Date(s);
    if (isNaN(d)) return '-';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  // yyyy-mm-dd (local) for date filter
  function dayKey(s) {
    var d = new Date(s);
    if (isNaN(d)) return '';
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }

  function isPaid(r) {
    return String(r.incentive_status || '').toLowerCase() === 'paid';
  }

  function render() {
    var from = $('dFrom').value;
    var to = $('dTo').value;

    var rows = sales.filter(function (r) {
      var k = dayKey(r.created_at);
      if (from && k < from) return false;
      if (to && k > to) return false;
      return true;
    });

    var total = 0, inc = 0, paid = 0;
    rows.forEach(function (r) {
      total += Number(r.sale_amount || 0);
      inc += Number(r.incentive_amount || 0);
      if (isPaid(r)) paid += Number(r.incentive_amount || 0);
    });
    $('sumSales').textContent = money(total);
    $('sumInc').textContent = money(inc);
    $('sumPaid').textContent = money(paid);
    $('sumUnpaid').textContent = money(inc - paid);

    if (!rows.length) {
      $('srList').innerHTML = '<div class="sr-empty">' + (sales.length ? '🔍 No sales in these dates' : '📭 No sales yet') + '</div>';
      return;
    }

    $('srList').innerHTML = rows.map(function (r) {
      var p = isPaid(r);
      return '<div class="sr-card">' +
        '<div class="sr-row"><div class="sr-name">👤 ' + esc(r.customer_name || '-') + '</div>' +
          '<span class="sr-badge ' + (p ? 'paid' : 'unpaid') + '">' + (p ? 'Paid' : 'Unpaid') + '</span></div>' +
        (r.order_id ? '<div class="sr-line">🧾 Order: ' + esc(r.order_id) + '</div>' : '') +
        '<div class="sr-line">🛒 Sale: <b>' + money(r.sale_amount) + '</b></div>' +
        '<div class="sr-line">📊 Rate: ' + esc(r.commission_rate || 0) + '%</div>' +
        '<div class="sr-line">💰 Incentive: <b>' + money(r.incentive_amount) + '</b></div>' +
        '<div class="sr-line">📅 ' + fmtDate(r.created_at) + '</div>' +
      '</div>';
    }).join('');
  }

  async function start() {
    var session = await requireLogin();
    if (!session) return;

    var userId = new URLSearchParams(window.location.search).get('id');
    if (!userId) {
      $('srMsg').textContent = '⚠️ No user selected. Please choose a user from the list.';
      $('backLink').setAttribute('href', LIST_PAGE);
      return;
    }
    $('backLink').setAttribute('href', PROFILE_PAGE + '?id=' + encodeURIComponent(userId));

    var ru = await db.from('users').select('id,name,referral_code').eq('id', userId).maybeSingle();
    if (ru.error) { $('srMsg').textContent = '⚠️ Could not load: ' + ru.error.message; return; }
    if (!ru.data) { $('srMsg').textContent = '🔍 User not found'; return; }
    var u = ru.data;

    if (!u.referral_code) {
      $('srMsg').textContent = '⚠️ This user has no referral code, so sales cannot be matched.';
      return;
    }

    var res = await db.from(TABLE).select('*').eq('referral_user', u.referral_code).order('created_at', { ascending: false });
    if (res.error) { $('srMsg').textContent = '⚠️ Could not load sales: ' + res.error.message; return; }
    sales = res.data || [];

    $('srUser').innerHTML = '👤 <b>' + esc(u.name) + '</b> · Code: <b>' + esc(u.referral_code) + '</b>';
    $('srMsg').hidden = true;
    $('srBox').hidden = false;

    $('dFrom').addEventListener('change', render);
    $('dTo').addEventListener('change', render);
    $('clearBtn').addEventListener('click', function () {
      $('dFrom').value = '';
      $('dTo').value = '';
      render();
    });
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();