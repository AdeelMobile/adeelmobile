/* Shared Layout - sidebar + top bar */
(function () {
  var script = document.currentScript;
  var ROOT = script.getAttribute('data-root') || '';
  var ACTIVE = script.getAttribute('data-active') || '';

  // Naye Icons (SVG) - Grey Black theme
  var ICONS = {
    dashboard: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>',
    installments: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>',
    website: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>',
    'social-media': '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>',
    database: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>',
    default: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle></svg>'
  };

  var MENU = [
    { key: 'dashboard', label: 'Dashboard', href: 'Departments/Main-Dashboard/main-dashboard.html', icon: 'dashboard' },
    {
      key: 'installments', label: 'Installment', href: null, icon: 'installments',
      children: [
        { key: 'inst-plans', label: 'Plans & Rules', href: 'Departments/Installments/Installment-Plans-Rules/installment-plans-rules.html' },
        { key: 'inst-customers', label: 'Customers', href: null },
        { key: 'inst-verifications', label: 'Verifications', href: null },
        { 
          key: 'inst-users', 
          label: 'Users', 
          href: null, 
          children: [
            { key: 'inst-users-create', label: 'Create User', href: 'Departments/Installments/Users/Create-New-User/create-new-user.html' },
            { key: 'inst-users-list', label: 'All Users', href: 'Departments/Installments/Users/All-Users-List/all-users.html' },
            { key: 'inst-users-verify', label: 'Verifications', href: 'Departments/Installments/Users/Verifications/verifications.html' },
            { key: 'inst-users-wallet', label: 'Wallet', href: 'Departments/Installments/Users/User-Wallet-Earnings/user-wallet-earnings.html' },
            { key: 'inst-users-sales', label: 'Sales Reports', href: 'Departments/Installments/Users/User-Sales-Reports/user-sales-reports.html' }
          ]
        },
        { key: 'inst-dashboard', label: 'Installment Dashboard', href: null },
        { key: 'inst-website', label: 'Website Control Panel', href: null },
        { key: 'inst-reports', label: 'Reports', href: null }
      ]
    },
    { key: 'website', label: 'Website', href: null, icon: 'website' },
    { key: 'social-media', label: 'Social Media', href: null, icon: 'social-media' },
    { key: 'database', label: 'Database', href: 'Departments/Products-Database/index.html', icon: 'database' }
  ];

  function toast(msg) {
    var t = document.createElement('div');
    t.className = 'lay-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2000);
  }

  function linkHtml(m, extraCls) {
    var cls = 'sb-item' + (extraCls ? ' ' + extraCls : '') + (m.key === ACTIVE ? ' active' : '');
    var href = m.href ? ROOT + m.href : '#';
    var soon = m.href ? ' target="_blank"' : ' data-soon="1"';
    var iconSvg = ICONS[m.icon || 'default'];

    return '<a class="' + cls + '" href="' + href + '"' + soon + '>' +
      '<span class="sb-item-left">' +
        '<span class="sb-icon">' + iconSvg + '</span>' +
        '<span>' + m.label + '</span>' +
      '</span>' +
    '</a>';
  }

  function itemHtml(m) {
    if (m.children) {
      var hasActiveSub = m.key === ACTIVE || m.children.some(function (c) {
        return c.key === ACTIVE || (c.children && c.children.some(function(sc){ return sc.key === ACTIVE; }));
      });

      var kids = m.children.map(function (c) {
         if (c.children) {
            var subKids = c.children.map(function(sc){ return linkHtml(sc); }).join('');
            var hasActiveSubSub = c.key === ACTIVE || c.children.some(function(sc){ return sc.key === ACTIVE; });
            
            return '<div class="sb-group-sub' + (hasActiveSubSub ? ' open' : '') + '">' +
              '<a class="sb-item sb-parent" href="#" data-parent-sub="1">' +
                '<span>' + c.label + '</span><span class="sb-arrow">▾</span>' +
              '</a>' +
              '<div class="sb-sub-sub">' + subKids + '</div>' +
            '</div>';
         } else {
            return linkHtml(c);
         }
      }).join('');

      var iconSvg = ICONS[m.icon || 'default'];

      return '<div class="sb-group' + (hasActiveSub ? ' open' : '') + '">' +
        '<a class="sb-item sb-parent' + (hasActiveSub ? ' has-active' : '') + '" href="#" data-parent="1">' +
          '<span class="sb-item-left">' +
            '<span class="sb-icon">' + iconSvg + '</span>' +
            '<span>' + m.label + '</span>' +
          '</span>' +
          '<span class="sb-arrow">▾</span>' +
        '</a>' +
        '<div class="sb-sub">' + kids + '</div>' +
      '</div>';
    }

    return linkHtml(m);
  }

  function build() {
    var content = document.getElementById('page-content');
    var items = MENU.map(itemHtml).join('');

    var shell = document.createElement('div');
    shell.className = 'app-shell';
    
    var style = document.createElement('style');
    style.textContent = `
      :root {
        --sb-bg: #FFFFFF;
        --sb-border: #E1E5EB;
        --sb-text: #000000;
        --sb-text-light: #555555; 
        --sb-active-bg: #F0F0F0; 
        --sb-active-text: #000000; 
        --sb-hover-bg: #F8F9FA;
        --sb-radius: 10px;
      }

      .app-shell { font-family: 'Roboto', sans-serif; }

      .sb-overlay {
        position: fixed; inset: 0; background: rgba(0,0,0,0.5);
        opacity: 0; visibility: hidden; z-index: 999; transition: 0.3s;
      }
      .sb-overlay.show { opacity: 1; visibility: visible; }

      .sidebar {
        position: fixed; top: 0; left: 0; bottom: 0; width: 100%; /* Full Width */
        background: var(--sb-bg); border-right: 1px solid var(--sb-border);
        z-index: 1000; overflow-y: auto; padding: 20px 12px;
        transform: translateX(-100%); transition: transform 0.3s ease;
        box-shadow: 2px 0 8px rgba(0,0,0,0.02);
      }
      .sidebar.open { transform: translateX(0); }

      .sb-brand {
        font-size: 22px; font-weight: 800; color: #000;
        margin-bottom: 24px; padding-left: 12px;
        font-family: 'Inter', sans-serif;
      }

      .sb-nav { display: flex; flex-direction: column; gap: 4px; }

      .sb-item {
        display: flex; justify-content: space-between; align-items: center;
        padding: 14px 16px; border-radius: var(--sb-radius);
        color: var(--sb-text); text-decoration: none; 
        font-size: 17px; 
        font-weight: 500; 
        transition: background 0.2s, color 0.2s; cursor: pointer;
      }
      .sb-item:hover { background: var(--sb-hover-bg); color: #000; }

      .sb-item-left { display: flex; align-items: center; gap: 12px; }
      .sb-icon { display: flex; align-items: center; justify-content: center; color: #555555; }
      .sb-icon svg { width: 22px; height: 22px; stroke-width: 2; }

      .sb-item.sb-parent { background: var(--sb-hover-bg); font-weight: 500; }
      .sb-item.sb-parent.has-active { color: #000000; }

      .sb-item.active {
        background: var(--sb-active-bg) !important; 
        color: var(--sb-active-text) !important; 
        font-weight: 600; 
      }

      .sb-arrow {
        font-size: 18px; 
        color: var(--sb-text);
        transition: transform 0.3s ease;
      }
      .sb-group.open > .sb-item .sb-arrow,
      .sb-group-sub.open > .sb-item .sb-arrow {
        transform: rotate(180deg);
      }

      .sb-sub, .sb-sub-sub {
        display: none; flex-direction: column;
        margin-top: 4px; 
        padding-left: 0; 
        margin-left: 0;
      }
      .sb-group.open > .sb-sub,
      .sb-group-sub.open > .sb-sub-sub {
        display: flex;
      }

      .sb-sub .sb-item, .sb-sub-sub .sb-item {
        font-size: 16px; 
        font-weight: 400; 
        padding: 12px 16px 12px 45px; /* Indent for sub items */
        color: var(--sb-text);
      }
      .sb-sub .sb-item:hover, .sb-sub-sub .sb-item:hover {
        color: #000;
        background: var(--sb-hover-bg);
      }
      .sb-sub .sb-item.active, .sb-sub-sub .sb-item.active {
         background: var(--sb-active-bg) !important;
         color: var(--sb-active-text) !important;
         font-weight: 500;
      }

      .sidebar::-webkit-scrollbar { width: 6px; }
      .sidebar::-webkit-scrollbar-track { background: transparent; }
      .sidebar::-webkit-scrollbar-thumb {
        background: var(--sb-border); border-radius: 4px;
      }

      .lay-toast {
        position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
        background: #333; color: #fff; padding: 10px 20px; border-radius: 8px;
        font-size: 14px; z-index: 9999; font-family: 'Roboto', sans-serif;
      }
    `;
    document.head.appendChild(style);

    var oldTopbar = document.createElement('style');
    oldTopbar.textContent = `.topbar, .app-header { display: none !important; }`;
    document.head.appendChild(oldTopbar);

    shell.innerHTML =
      '<div class="sb-overlay" id="sbOverlay"></div>' +
      '<aside class="sidebar" id="sidebar">' +
        '<div class="sb-brand">Adeel Mobile</div>' +
        '<nav class="sb-nav">' + items + '</nav>' +
      '</aside>' +
      '<div class="app-main">' +
        '<header class="topbar">' +
          '<button class="menu-btn" id="menuBtn">☰</button>' +
          '<input class="search-box" id="searchBox" type="text" placeholder="Search...">' +
          '<div class="top-right">' +
            '<button class="icon-btn" id="bellBtn">Notifications</button>' +
            '<div class="user-chip"><span class="uname" id="userName"></span></div>' +
            '<button class="lay-btn" id="layLogout">Logout</button>' +
          '</div>' +
        '</header>' +
        '<div class="app-content" id="appContent"></div>' +
      '</div>';

    document.body.insertBefore(shell, document.body.firstChild);
    if (content) document.getElementById('appContent').appendChild(content);

    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sbOverlay');

    function closeMenu() {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
    }

    document.getElementById('menuBtn').addEventListener('click', function () {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('show');
    });

    overlay.addEventListener('click', closeMenu);

    sidebar.addEventListener('click', function (e) {
      var a = e.target.closest('.sb-item');
      if (!a) return;

      if (a.getAttribute('data-parent') || a.getAttribute('data-parent-sub')) {
        e.preventDefault();
        a.parentNode.classList.toggle('open');
        return;
      }

      if (a.getAttribute('data-soon')) {
        e.preventDefault();
        toast('This page is coming soon');
        return; 
      }

      closeMenu();
    });

    document.getElementById('bellBtn').addEventListener('click', function () {
      toast('No notifications yet');
    });

    document.getElementById('searchBox').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') toast('Search is coming soon');
    });

    document.getElementById('layLogout').addEventListener('click', function () {
      if (typeof logoutUser === 'function') logoutUser();
    });

    if (typeof getSession === 'function') {
      Promise.resolve(getSession()).then(function (s) {
        var session = s && s.data ? s.data.session : s;
        if (session && session.user) {
          document.getElementById('userName').textContent =
            session.user.email.replace('@adeelmobile.app', '');
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();