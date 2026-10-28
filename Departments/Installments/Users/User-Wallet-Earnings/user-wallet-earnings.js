/* User Wallet & Earnings */
(function () {
  var PROFILE_PAGE = '../User-Profile-Details/user-profile-details.html';
  var LIST_PAGE = '../users.html';
  var userId = null;
  var earned = 0;
  var payouts = [];

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function toast(text) {
    var t = document.createElement('div');
    t.className = 'uw-toast';
    t.textContent = text;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2800);
  }

  function money(n) { return 'Rs ' + Number(n || 0).toLocaleString('en-US'); }

  function fmtDate(s) {
    if (!s) return '-';
    var d = new Date(s);
    if (isNaN(d)) return '-';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function paidTotal() {
    var t = 0;
    payouts.forEach(function (p) { t += Number(p.amount || 0); });
    return t;
  }

  function render() {
    var paid = paidTotal();
    $('sumEarned').textContent = money(earned);
    $('sumPaid').textContent = money(paid);
    $('sumBalance').textContent = money(earned - paid);

    if (!payouts.length) {
      $('uwList').innerHTML = '<div class="uw-empty">No payouts yet</div>';
      return;
    }
    $('uwList').innerHTML = payouts.map(function (p) {
      return '<div class="uw-card">' +
        '<div class="uw-row"><div class="uw-amt">' + money(p.amount) + '</div>' +
          '<button class="uw-del" data-id="' + esc(p.id) + '" type="button">🗑️ Delete</button></div>' +
        '<div class="uw-line">📅 ' + fmtDate(p.payout_date) + '</div>' +
        '<div class="uw-line">Method: ' + esc(p.method || '-') + '</div>' +
        (p.note ? '<div class="uw-line">Note: ' + esc(p.note) + '</div>' : '') +
      '</div>';
    }).join('');
  }

  async function loadPayouts() {
    var res = await db.from('user_payouts').select('*').eq('user_id', userId)
      .order('payout_date', { ascending: false }).order('id', { ascending: false });
    if (res.error) { toast('Could not load payouts: ' + res.error.message); return; }
    payouts = res.data || [];
    render();
  }

  function openForm(show) {
    $('uwForm').hidden = !show;
    $('addBtn').hidden = show;
    if (show) {
      $('fAmount').value = '';
      $('fDate').value = today();
      $('fMethod').value = 'Cash';
      $('fNote').value = '';
    }
  }

  async function savePayout() {
    var amount = Number($('fAmount').value);
    var date = $('fDate').value;
    if (!amount || amount <= 0) { toast('Enter a valid amount'); return; }
    if (!date) { toast('Choose a date'); return; }
    var balance = earned - paidTotal();
    if (amount > balance) { toast('Amount is more than balance (' + money(balance) + ')'); return; }

    var btn = $('saveBtn');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    var res = await db.from('user_payouts').insert({
      user_id: userId,
      amount: amount,
      payout_date: date,
      method: $('fMethod').value,
      note: $('fNote').value.trim()
    });

    btn.disabled = false;
    btn.textContent = '💾 Save';

    if (res.error) { toast('Could not save: ' + res.error.message); return; }
    toast('Payout saved');
    openForm(false);
    loadPayouts();
  }

  async function deletePayout(id) {
    if (!window.confirm('Delete this payout?')) return;
    var res = await db.from('user_payouts').delete().eq('id', id);
    if (res.error) { toast('Could not delete: ' + res.error.message); return; }
    toast('Payout deleted');
    loadPayouts();
  }

  async function start() {
    var session = await requireLogin();
    if (!session) return;

    userId = new URLSearchParams(window.location.search).get('id');
    if (!userId) {
      $('uwMsg').textContent = 'No user selected. Please choose a user from the list.';
      $('backLink').setAttribute('href', LIST_PAGE);
      return;
    }
    $('backLink').setAttribute('href', PROFILE_PAGE + '?id=' + encodeURIComponent(userId));

    var ru = await db.from('users').select('id,name,referral_code').eq('id', userId).maybeSingle();
    if (ru.error) { $('uwMsg').textContent = 'Could not load: ' + ru.error.message; return; }
    if (!ru.data) { $('uwMsg').textContent = 'User not found'; return; }
    var u = ru.data;

    if (u.referral_code) {
      var rs = await db.from('sales_incentives').select('incentive_amount').eq('referral_user', u.referral_code);
      if (rs.error) { $('uwMsg').textContent = 'Could not load sales: ' + rs.error.message; return; }
      (rs.data || []).forEach(function (r) { earned += Number(r.incentive_amount || 0); });
    }

    $('uwUser').innerHTML = '👤 <b>' + esc(u.name) + '</b> · Code: <b>' + esc(u.referral_code || '-') + '</b>';
    $('uwMsg').hidden = true;
    $('uwBox').hidden = false;

    $('addBtn').addEventListener('click', function () { openForm(true); });
    $('cancelBtn').addEventListener('click', function () { openForm(false); });
    $('saveBtn').addEventListener('click', savePayout);
    $('uwList').addEventListener('click', function (e) {
      var b = e.target.closest('.uw-del');
      if (b) deletePayout(b.getAttribute('data-id'));
    });

    render();
    loadPayouts();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();