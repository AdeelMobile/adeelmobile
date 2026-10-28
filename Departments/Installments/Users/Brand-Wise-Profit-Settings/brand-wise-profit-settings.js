/* Brand-Wise Profit Settings */
(function () {
  var RULE_TABLE = 'user_brand_profit';
  var PROFILE_PAGE = '../User-Profile-Details/user-profile-details.html';
  var LIST_PAGE = '../users.html';
  var userId = null;
  var user = null;
  var brands = [];
  var rules = {}; // brand_id -> percent

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function toast(text) {
    var t = document.createElement('div');
    t.className = 'bw-toast';
    t.textContent = text;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2800);
  }

  function render() {
    if (!brands.length) {
      $('bwList').innerHTML = '<div class="bw-empty">📭 No brands found</div>';
      return;
    }
    $('bwList').innerHTML = brands.map(function (b) {
      var v = rules[b.id] != null ? rules[b.id] : '';
      return '<div class="bw-row">' +
        '<span class="bw-name">🏷️ ' + esc(b.brand) + '</span>' +
        '<span class="bw-pct"><input class="bw-input" type="number" min="0" max="100" step="any" ' +
        'data-brand="' + b.id + '" value="' + esc(v) + '" placeholder="' + esc(user.percentage || 0) + '"> %</span>' +
      '</div>';
    }).join('');
  }

  async function save() {
    var inputs = document.querySelectorAll('.bw-input');
    var upserts = [];
    var removes = [];

    for (var i = 0; i < inputs.length; i++) {
      var el = inputs[i];
      var bid = Number(el.getAttribute('data-brand'));
      var raw = el.value.trim();
      if (raw === '') { removes.push(bid); continue; }
      var val = Number(raw);
      if (isNaN(val) || val < 0 || val > 100) { toast('⚠️ Percentage must be between 0 and 100'); return; }
      upserts.push({ user_id: Number(userId), brand_id: bid, percent: val });
    }

    var btn = $('saveBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Saving...';

    var err = null;
    if (upserts.length) {
      var r1 = await db.from(RULE_TABLE).upsert(upserts, { onConflict: 'user_id,brand_id' });
      if (r1.error) err = r1.error;
    }
    if (!err && removes.length) {
      var r2 = await db.from(RULE_TABLE).delete().eq('user_id', userId).in('brand_id', removes);
      if (r2.error) err = r2.error;
    }

    btn.disabled = false;
    btn.textContent = '💾 Save Brand Profit';

    if (err) { toast('⚠️ Not saved: ' + err.message); return; }

    rules = {};
    upserts.forEach(function (u) { rules[u.brand_id] = u.percent; });
    toast('✅ Saved');
  }

  async function start() {
    var session = await requireLogin();
    if (!session) return;

    userId = new URLSearchParams(window.location.search).get('id');
    if (!userId) {
      $('bwMsg').textContent = '⚠️ No user selected. Please choose a user from the list.';
      $('backLink').setAttribute('href', LIST_PAGE);
      return;
    }
    $('backLink').setAttribute('href', PROFILE_PAGE + '?id=' + encodeURIComponent(userId));

    var ru = await db.from('users').select('id,name,percentage').eq('id', userId).maybeSingle();
    if (ru.error) { $('bwMsg').textContent = '⚠️ Could not load: ' + ru.error.message; return; }
    if (!ru.data) { $('bwMsg').textContent = '🔍 User not found'; return; }
    user = ru.data;

    var rb = await db.from('brands').select('id,brand').order('brand', { ascending: true });
    if (rb.error) { $('bwMsg').textContent = '⚠️ Could not load brands: ' + rb.error.message; return; }
    brands = (rb.data || []).filter(function (b) { return b.brand; });

    var rr = await db.from(RULE_TABLE).select('brand_id,percent').eq('user_id', userId);
    if (rr.error) { $('bwMsg').textContent = '⚠️ Could not load rules: ' + rr.error.message; return; }
    (rr.data || []).forEach(function (r) { rules[r.brand_id] = r.percent; });

    $('bwUser').innerHTML = '👤 <b>' + esc(user.name) + '</b> · Default: <b>' + esc(user.percentage || 0) + '%</b>';
    $('bwMsg').hidden = true;
    $('bwBox').hidden = false;
    render();
    $('saveBtn').addEventListener('click', save);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();