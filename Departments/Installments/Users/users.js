
/* Adeel Mobile — Users Module (Updated) */
(function () {
  'use strict';

  var TABLE = 'users';
  var PROFILE_PAGE = 'User-Profile-Details/user-profile-details.html';
  var EDIT_PAGE = 'Edit-User/edit-user.html';
  var BRAND_PAGE = 'Brand-Wise-Profit-Settings/brand-wise-profit-settings.html';
  var MODEL_PAGE = 'Model-Wise-Special-Incentives/model-wise-special-incentives.html';
  var APPS_PAGE = 'User-Applications/user-applications.html';
  var SALES_PAGE = 'User-Sales-Reports/user-sales-reports.html';
  var WALLET_PAGE = 'User-Wallet-Earnings/user-wallet-earnings.html';
  var PERF_PAGE = 'User-Performance-Reports/user-performance-reports.html';
  var LOGIN_PAGE = 'User-Login-Access/user-login-access.html';

  var allUsers = [];
  var loading = false;

  function $(id) {
    return document.getElementById(id);
  }

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[c];
    });
  }

  function toast(message) {
    var t = document.createElement('div');
    t.className = 'us-toast';
    t.textContent = message;
    t.style.cssText =
      'position:fixed;left:16px;right:16px;bottom:24px;z-index:99999;' +
      'padding:14px;border-radius:12px;background:#222;color:#fff;' +
      'font-size:16px;text-align:center;box-shadow:0 4px 18px #0003';

    document.body.appendChild(t);

    setTimeout(function () {
      if (t.parentNode) t.parentNode.removeChild(t);
    }, 3000);
  }

  function money(value) {
    return 'Rs ' + Number(value || 0).toLocaleString('en-US');
  }

  function waNumber(value) {
    var digits = String(value || '').replace(/\D/g, '');
    if (digits.indexOf('0') === 0) digits = '92' + digits.slice(1);
    return digits;
  }

  function makeCode(name) {
    var letters = String(name || '')
      .replace(/[^a-zA-Z]/g, '')
      .toUpperCase()
      .slice(0, 3);

    while (letters.length < 3) letters += 'X';

    return letters + Math.floor(100 + Math.random() * 900);
  }

  function getElement() {
    return $('tab-create') || $('usCreateForm');
  }

  function getListElement() {
    return $('tab-list') || $('usListForm');
  }

  function showTab(name) {
    var create = getElement();
    var list = getListElement();

    document.querySelectorAll('.us-tab').forEach(function (button) {
      button.classList.toggle(
        'active',
        button.getAttribute('data-tab') === name
      );
    });

    if (create) create.hidden = name !== 'create';
    if (list) list.hidden = name !== 'list';

    var workspace = $('usWorkspace');
    if (workspace) workspace.hidden = false;

    if (name === 'list') loadUsers();
  }

  function setCount(id, value) {
    var element = $(id);
    if (element) element.textContent = String(value);
  }

  function renderCounts() {
    var active = allUsers.filter(function (user) {
      return String(user.status || 'active').toLowerCase() === 'active';
    }).length;

    var inactive = allUsers.length - active;

    setCount('sumAll', allUsers.length);
    setCount('sumActive', active);
    setCount('sumInactive', inactive);
  }

  // Create New User
  async function saveUser() {
    var nameInput = $('fName');
    var contactInput = $('fContact');

    if (!nameInput || !contactInput) {
      toast('Create User form HTML mein nahi mila.');
      return;
    }

    var name = nameInput.value.trim();
    var contact = contactInput.value.trim();

    if (!name) {
      toast('Naam likhna zaroori hai.');
      nameInput.focus();
      return;
    }

    if (!contact) {
      toast('Contact number likhna zaroori hai.');
      contactInput.focus();
      return;
    }

    if (typeof db === 'undefined' || !db) {
      toast('Supabase connection nahi mili. Config check karein.');
      return;
    }

    var button = $('saveBtn');
    var oldText = button ? button.textContent : '';

    if (button) {
      button.disabled = true;
      button.textContent = 'Save ho raha hai...';
    }

    var saved = false;
    var lastError = null;

    try {
      for (var i = 0; i < 5; i++) {
        var row = {
          name: name,
          contact: contact,
          whatsapp: ($('fWhatsapp') ? $('fWhatsapp').value.trim() : '') || contact,
          address: $('fAddress') ? $('fAddress').value.trim() : '',
          percentage: Number($('fPercent') ? $('fPercent').value : 0) || 0,
          sale_target: Number($('fTarget') ? $('fTarget').value : 0) || 0,
          incentive: 0,
          status: 'active',
          referral_code: makeCode(name)
        };

        var result = await db.from(TABLE).insert(row);

        if (!result.error) {
          saved = true;
          break;
        }

        lastError = result.error;

        if (result.error.code !== '23505') break;
      }
    } catch (error) {
      lastError = error;
    }

    if (button) {
      button.disabled = false;
      button.textContent = oldText || 'User Save Karein';
    }

    if (!saved) {
      toast('Save nahi hua: ' + (lastError ? lastError.message : 'Unknown error'));
      return;
    }

    ['fName', 'fContact', 'fWhatsapp', 'fAddress', 'fPercent', 'fTarget']
      .forEach(function (id) {
        if ($(id)) $(id).value = '';
      });

    toast('User save ho gaya.');
    await loadUsers();
    showTab('list');
  }

  // Load existing users from Supabase — no records are deleted or modified
  async function loadUsers() {
    if (loading) return;

    if (typeof db === 'undefined' || !db) {
      var list = $('userList');
      if (list) {
        list.innerHTML =
          '<div class="us-empty">Supabase connection nahi mili. ' +
          'supabase-config.js check karein.</div>';
      }
      return;
    }

    loading = true;

    var userList = $('userList');
    if (userList) {
      userList.innerHTML =
        '<div class="us-empty">Users load ho rahe hain...</div>';
    }

    try {
      var result = await db
        .from(TABLE)
        .select('*')
        .order('created_at', { ascending: false });

      if (result.error) {
        if (userList) {
          userList.innerHTML =
            '<div class="us-empty">Users load nahi hue: ' +
            esc(result.error.message) + '</div>';
        }
        toast('Users load nahi hue. Error message check karein.');
        return;
      }

      allUsers = result.data || [];
      renderCounts();
      renderList();
    } catch (error) {
      if (userList) {
        userList.innerHTML =
          '<div class="us-empty">Error: ' + esc(error.message) + '</div>';
      }
    } finally {
      loading = false;
    }
  }

  // Render users and search results
  function renderList() {
    renderCounts();

    var userList = $('userList');
    if (!userList) return;

    var search = $('searchBox');
    var query = search ? search.value.trim().toLowerCase() : '';

    var rows = allUsers.filter(function (user) {
      return (
        String(user.name || '').toLowerCase().indexOf(query) !== -1 ||
        String(user.contact || '').toLowerCase().indexOf(query) !== -1 ||
        String(user.referral_code || '').toLowerCase().indexOf(query) !== -1
      );
    });

    if (!rows.length) {
      userList.innerHTML =
        '<div class="us-empty">' +
        (allUsers.length
          ? 'Koi matching user nahi mila.'
          : 'Database mein koi user record nahi mila.') +
        '</div>';
      return;
    }

    userList.innerHTML = rows.map(function (user) {
      var active = String(user.status || 'active').toLowerCase() === 'active';
      var whatsapp = waNumber(user.whatsapp || user.contact);
      var id = encodeURIComponent(user.id == null ? '' : user.id);

      return (
        '<div class="us-card">' +
          '<div class="us-row">' +
            '<div class="us-name">👤 ' + esc(user.name || 'Unnamed User') + '</div>' +
            '<span class="us-badge ' + (active ? 'on' : 'off') + '">' +
              (active ? 'Active' : 'Inactive') +
            '</span>' +
          '</div>' +

          '<div class="us-line">📞 ' + esc(user.contact || '-') + '</div>' +
          (user.address
            ? '<div class="us-line">📍 ' + esc(user.address) + '</div>'
            : '') +
          '<div class="us-line">Referral Code: <b>' +
            esc(user.referral_code || '-') + '</b></div>' +

          '<div class="us-stats">' +
            '<div><span>Percentage</span><b>' +
              esc(user.percentage || 0) + '%</b></div>' +
            '<div><span>Target</span><b>' +
              money(user.sale_target) + '</b></div>' +
          '</div>' +

          '<div class="us-btns">' +
            '<a class="us-btn" href="tel:' + esc(user.contact || '') + '">Call</a>' +
            '<a class="us-btn wa" href="https://wa.me/' + esc(whatsapp) +
              '" target="_blank" rel="noopener">WhatsApp</a>' +
          '</div>' +

          '<div class="us-btns" style="margin-top:8px">' +
            '<a class="us-btn" href="' + PROFILE_PAGE + '?id=' + id + '">Profile</a>' +
            '<a class="us-btn" href="' + EDIT_PAGE + '?id=' + id + '">Edit</a>' +
          '</div>' +

          '<div class="us-btns" style="margin-top:8px">' +
            '<a class="us-btn" href="' + BRAND_PAGE + '?id=' + id + '">Brand Profit</a>' +
            '<a class="us-btn" href="' + MODEL_PAGE + '?id=' + id + '">Models</a>' +
          '</div>' +

          '<div class="us-btns" style="margin-top:8px">' +
            '<a class="us-btn" href="' + APPS_PAGE + '?id=' + id + '">Applications</a>' +
            '<a class="us-btn" href="' + SALES_PAGE + '?id=' + id + '">Sales Reports</a>' +
          '</div>' +

          '<div class="us-btns" style="margin-top:8px">' +
            '<a class="us-btn" href="' + WALLET_PAGE + '?id=' + id + '">Wallet</a>' +
            '<a class="us-btn" href="' + PERF_PAGE + '?id=' + id + '">Performance</a>' +
          '</div>' +

          '<div class="us-btns" style="margin-top:8px">' +
            '<a class="us-btn" href="' + LOGIN_PAGE + '?id=' + id + '">Login & Access</a>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  // Connect the new module buttons to the available screens
  function connectModuleButtons() {
    document.querySelectorAll('[data-module]').forEach(function (button) {
      button.addEventListener('click', function () {
        var key = String(button.getAttribute('data-module') || '').toLowerCase();

        if (key.includes('create') || key.includes('new-user')) {
          showTab('create');
          return;
        }

        if (key.includes('list') || key.includes('all-users')) {
          showTab('list');
          return;
        }

        var pages = [
          { keys: ['profile', 'details'], page: PROFILE_PAGE },
          { keys: ['edit'], page: EDIT_PAGE },
          { keys: ['brand'], page: BRAND_PAGE },
          { keys: ['model', 'incentive'], page: MODEL_PAGE },
          { keys: ['application'], page: APPS_PAGE },
          { keys: ['sales'], page: SALES_PAGE },
          { keys: ['wallet', 'earning'], page: WALLET_PAGE },
          { keys: ['performance'], page: PERF_PAGE },
          { keys: ['login', 'access', 'password'], page: LOGIN_PAGE }
        ];

        for (var i = 0; i < pages.length; i++) {
          if (pages[i].keys.some(function (part) { return key.includes(part); })) {
            window.location.href = pages[i].page;
            return;
          }
        }

        toast('Is module ka page abhi connect nahi hai.');
      });
    });
  }

  async function start() {
    if (typeof requireLogin === 'function') {
      var session = await requireLogin();
      if (!session) return;
    }

    document.querySelectorAll('.us-tab').forEach(function (button) {
      button.addEventListener('click', function () {
        showTab(button.getAttribute('data-tab'));
      });
    });

    if ($('saveBtn')) {
      $('saveBtn').addEventListener('click', saveUser);
    }

    if ($('searchBox')) {
      $('searchBox').addEventListener('input', renderList);
    }

    connectModuleButtons();

    await loadUsers();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
