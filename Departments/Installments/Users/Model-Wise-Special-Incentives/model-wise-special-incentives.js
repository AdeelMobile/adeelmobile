/* Model-Wise Special Incentives */
(function () {
  var RULE_TABLE = 'user_model_incentive';
  var PROFILE_PAGE = '../User-Profile-Details/user-profile-details.html';
  var LIST_PAGE = '../users.html';
  var userId = null;
  var user = null;
  var rules = {};   // model_id -> { type, value }
  var models = [];  // models of the selected brand

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function toast(text) {
    var t = document.createElement('div');
    t.className = 'mw-toast';
    t.textContent = text;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2800);
  }

  function updateCount() {
    var n = Object.keys(rules).length;
    $('mwCount').textContent = '📌 Total special rules for this user: ' + n;
  }

  function render() {
    if (!models.length) {
      $('mwList').innerHTML = '<div class="mw-empty">📭 No models found for this brand</div>';
      return;
    }
    $('mwList').innerHTML = models.map(function (m) {
      var r = rules[m.id];
      var type = r ? r.type : 'percent';
      var val = r ? r.value : '';
      return '<div class="mw-row">' +
        '<div class="mw-name">📱 ' + esc(m.model) + '</div>' +
        '<div class="mw-inputs">' +
          '<select class="mw-select" data-type="' + m.id + '">' +
            '<option value="percent"' + (type === 'percent' ? ' selected' : '') + '>%</option>' +
            '<option value="fixed"' + (type === 'fixed' ? ' selected' : '') + '>Rs</option>' +
          '</select>' +
          '<input class="mw-input" type="number" min="0" step="any" data-model="' + m.id + '" ' +
          'value="' + esc(val) + '" placeholder="No special rule">' +
        '</div>' +
      '</div>';
    }).join('');
  }

  async function loadModels() {
    var bid = $('brandSelect').value;
    $('mwList').innerHTML = '<div class="mw-empty">⏳ Loading...</div>';
    var res = await db.from('models').select('id,model').eq('brand_id', bid).order('model', { ascending: true });
    if (res.error) {
      $('mwList').innerHTML = '<div class="mw-empty">⚠️ Could not load: ' + esc(res.error.message) + '</div>';
      return;
    }
    models = res.data || [];
    render();
  }

  async function save() {
    var inputs = document.querySelectorAll('.mw-input');
    var upserts = [];
    var removes = [];

    for (var i = 0; i < inputs.length; i++) {
      var el = inputs[i];
      var mid = Number(el.getAttribute('data-model'));
      var raw = el.value.trim();
      if (raw === '') { removes.push(mid); continue; }
      var val = Number(raw);
      var type = document.querySelector('.mw-select[data-type="' + mid + '"]').value;
      if (isNaN(val) || val < 0) { toast('⚠️ Enter a valid value'); return; }
      if (type === 'percent' && val > 100) { toast('⚠️ Percentage cannot be more than 100'); return; }
      upserts.push({ user_id: Number(userId), model_id: mid, type: type, value: val });
    }

    var btn = $('saveBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Saving...';

    var err = null;
    if (upserts.length) {
      var r1 = await db.from(RULE_TABLE).upsert(upserts, { onConflict: 'user_id,model_id' });
      if (r1.error) err = r1.error;
    }
    if (!err && removes.length) {
      var r2 = await db.from(RULE_TABLE).delete().eq('user_id', userId).in('model_id', removes);
      if (r2.error) err = r2.error;
    }

    btn.disabled = false;
    btn.textContent = '💾 Save Model Incentives';

    if (err) { toast('⚠️ Not saved: ' + err.message); return; }

    removes.forEach(function (id) { delete rules[id]; });
    upserts.forEach(function (u) { rules[u.model_id] = { type: u.type, value: u.value }; });
    updateCount();
    toast('✅ Saved');
  }

  async function start() {
    var session = await requireLogin();
    if (!session) return;

    userId = new URLSearchParams(window.location.search).get('id');
    if (!userId) {
      $('mwMsg').textContent = '⚠️ No user selected. Please choose a user from the list.';
      $('backLink').setAttribute('href', LIST_PAGE);
      return;
    }
    $('backLink').setAttribute('href', PROFILE_PAGE + '?id=' + encodeURIComponent(userId));

    var ru = await db.from('users').select('id,name').eq('id', userId).maybeSingle();
    if (ru.error) { $('mwMsg').textContent = '⚠️ Could not load: ' + ru.error.message; return; }
    if (!ru.data) { $('mwMsg').textContent = '🔍 User not found'; return; }
    user = ru.data;

    var rb = await db.from('brands').select('id,brand').order('brand', { ascending: true });
    if (rb.error) { $('mwMsg').textContent = '⚠️ Could not load brands: ' + rb.error.message; return; }
    var brands = (rb.data || []).filter(function (b) { return b.brand; });
    if (!brands.length) { $('mwMsg').textContent = '📭 No brands found'; return; }

    var rr = await db.from(RULE_TABLE).select('model_id,type,value').eq('user_id', userId);
    if (rr.error) { $('mwMsg').textContent = '⚠️ Could not load rules: ' + rr.error.message; return; }
    (rr.data || []).forEach(function (r) { rules[r.model_id] = { type: r.type, value: r.value }; });

    $('mwUser').innerHTML = '👤 <b>' + esc(user.name) + '</b>';
    $('brandSelect').innerHTML = brands.map(function (b) {
      return '<option value="' + b.id + '">' + esc(b.brand) + '</option>';
    }).join('');

    $('mwMsg').hidden = true;
    $('mwBox').hidden = false;
    updateCount();
    $('brandSelect').addEventListener('change', loadModels);
    $('saveBtn').addEventListener('click', save);
    loadModels();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();