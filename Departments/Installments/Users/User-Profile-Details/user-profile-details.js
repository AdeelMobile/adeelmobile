/* User Profile & Details */
(function () {
  var TABLE = 'users';
  var LIST_PAGE = '../users.html';
  var EDIT_PAGE = '../Edit-User/edit-user.html';
  var BRAND_PAGE = '../Brand-Wise-Profit-Settings/brand-wise-profit-settings.html';
  var MODEL_PAGE = '../Model-Wise-Special-Incentives/model-wise-special-incentives.html';
  var APPS_PAGE = '../User-Applications/user-applications.html';
  var SALES_PAGE = '../User-Sales-Reports/user-sales-reports.html';
  var WALLET_PAGE = '../User-Wallet-Earnings/user-wallet-earnings.html';
  var PERF_PAGE = '../User-Performance-Reports/user-performance-reports.html';
  var LOGIN_PAGE = '../User-Login-Access/user-login-access.html';

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function toast(text) {
    var t = document.createElement('div');
    t.className = 'pf-toast';
    t.textContent = text;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2500);
  }

  function money(n) { return 'Rs ' + Number(n || 0).toLocaleString('en-US'); }

  // 03xx... ko 923xx... banata hai (WhatsApp link ke liye)
  function waNumber(n) {
    var d = String(n || '').replace(/\D/g, '');
    if (d.indexOf('0') === 0) d = '92' + d.slice(1);
    return d;
  }

  function fmtDate(s) {
    if (!s) return '-';
    var d = new Date(s);
    if (isNaN(d)) return '-';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function item(label, value, extra) {
    return '<div class="pf-item"><span class="pf-lbl">' + label + '</span>' +
      '<span class="pf-val">' + value + (extra || '') + '</span></div>';
  }

  function render(u) {
    var on = (u.status || 'active').toLowerCase() === 'active';
    var wa = waNumber(u.whatsapp || u.contact);
    var code = u.referral_code || '';
    var id = encodeURIComponent(u.id);

    $('pfBody').innerHTML =
      '<div class="pf-head">' +
        '<div class="pf-row"><div class="pf-name">👤 ' + esc(u.name) + '</div>' +
          '<span class="pf-badge ' + (on ? 'on' : 'off') + '">' + (on ? 'Active' : 'Inactive') + '</span></div>' +
        '<div class="pf-btns">' +
          '<a class="pf-btn" href="tel:' + esc(u.contact) + '">📞 Call</a>' +
          '<a class="pf-btn wa" href="https://wa.me/' + wa + '" target="_blank" rel="noopener">💬 WhatsApp</a>' +
          '<a class="pf-btn" href="' + EDIT_PAGE + '?id=' + id + '">✏️ Edit</a>' +
        '</div>' +
        '<div class="pf-btns" style="margin-top:8px">' +
          '<a class="pf-btn" href="' + BRAND_PAGE + '?id=' + id + '">💹 Brand Profit</a>' +
          '<a class="pf-btn" href="' + MODEL_PAGE + '?id=' + id + '">🎯 Model Incentives</a>' +
        '</div>' +
        '<div class="pf-btns" style="margin-top:8px">' +
          '<a class="pf-btn" href="' + APPS_PAGE + '?id=' + id + '">📝 Applications</a>' +
          '<a class="pf-btn" href="' + SALES_PAGE + '?id=' + id + '">📊 Sales</a>' +
        '</div>' +
        '<div class="pf-btns" style="margin-top:8px">' +
          '<a class="pf-btn" href="' + WALLET_PAGE + '?id=' + id + '">💰 Wallet</a>' +
          '<a class="pf-btn" href="' + PERF_PAGE + '?id=' + id + '">Performance</a>' +
        '</div>' +
        '<div class="pf-btns" style="margin-top:8px">' +
          '<a class="pf-btn" href="' + LOGIN_PAGE + '?id=' + id + '">Login</a>' +
        '</div>' +
      '</div>' +
      '<div class="pf-stats">' +
        '<div class="pf-stat"><span>📊 Percentage</span><b>' + esc(u.percentage || 0) + '%</b></div>' +
        '<div class="pf-stat"><span>🎯 Target</span><b>' + money(u.sale_target) + '</b></div>' +
        '<div class="pf-stat"><span>💰 Incentive</span><b>' + money(u.incentive) + '</b></div>' +
      '</div>' +
      '<div class="pf-card">' +
        item('📞 Contact', esc(u.contact || '-')) +
        item('💬 WhatsApp', esc(u.whatsapp || u.contact || '-')) +
        item('📍 Address', esc(u.address || '-')) +
        item('🔗 Referral Code', '<b>' + esc(code || '-') + '</b>',
          code ? '<button class="pf-copy" id="copyBtn">📋 Copy</button>' : '') +
        item('📅 Join hone ki tareekh', fmtDate(u.created_at)) +
      '</div>';

    var cb = $('copyBtn');
    if (cb) cb.addEventListener('click', function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(
          function () { toast('✅ Code copy ho gaya'); },
          function () { toast('⚠️ Copy nahi hua'); }
        );
      } else {
        toast('⚠️ Copy nahi hua');
      }
    });
  }

  async function start() {
    var session = await requireLogin();
    if (!session) return;

    $('backLink').setAttribute('href', LIST_PAGE);

    var id = new URLSearchParams(window.location.search).get('id');
    if (!id) {
      $('pfBody').innerHTML = '<div class="pf-empty">⚠️ User chuna nahi gaya. All Users List se user chunen.</div>';
      return;
    }

    var res = await db.from(TABLE).select('*').eq('id', id).maybeSingle();
    if (res.error) {
      $('pfBody').innerHTML = '<div class="pf-empty">⚠️ Load nahi hua: ' + esc(res.error.message) + '</div>';
      return;
    }
    if (!res.data) {
      $('pfBody').innerHTML = '<div class="pf-empty">🔍 Ye user nahi mila</div>';
      return;
    }
    render(res.data);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();