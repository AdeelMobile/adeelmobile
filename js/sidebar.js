/* Shared Layout - sidebar + top bar (Floating Small Panels) */
(function () {
  var script = document.currentScript;
  var ROOT = script.getAttribute('data-root') || '';
  var ACTIVE = script.getAttribute('data-active') || '';

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
      key: 'installments', label: 'Installments', href: null, icon: 'installments',
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
    // Website ab seedha naye page par jayega
    { key: 'website', label: 'Website', href: 'Departments/Website/index.html', icon: 'website' },
    
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

  function renderMainItem(m) {
    var iconSvg = ICONS[m.icon || 'default'];
    var hasChildren = !!m.children;
    var arrow = hasChildren ? '<span class="sb-arrow">›</span>' : '<span class="sb-arrow empty"></span>';
    var href = m.href ? ROOT + m.href : 'javascript:void(0)';
    var target = m.href ? 'target="_blank"' : '';

    return '<div class="sb-main-item" data-id="' + m.key + '">' +
      '<a class="sb-link" href="' + href + '" ' + target + '>' +
        '<span class="sb-icon">' + iconSvg + '</span>' +
        '<span class="sb-label">' + m.label + '</span>' +
        arrow +
      '</a>' +
    '</div>';
  }

  function renderSubItem(item) {
    var hasChildren = !!item.children;
    var arrow = hasChildren ? '<span class="sb-arrow">›</span>' : '<span class="sb-arrow empty"></span>';
    var href = item.href ? ROOT + item.href : 'javascript:void(0)';
    var target = item.href ? 'target="_blank"' : '';

    return '<div class="sb-panel-item" data-id="' + item.key + '">' +
      '<a class="sb-panel-link" href="' + href + '" ' + target + '>' +
        '<span>' + item.label + '</span>' +
        arrow +
      '</a>' +
    '</div>';
  }

  function build() {
    var content = document.getElementById('page-content');

    var shell = document.createElement('div');
    shell.className = 'app-shell';
    
    var style = document.createElement('style');
    style.textContent = `
      :root {
        --sb-bg: #FFFFFF;
        --sb-border: #E5E7EB;
        --sb-text: #202020;
        --sb-hover-bg: #F5F5F5;
        --sb-radius: 8px;
      }

      .app-shell { font-family: 'Roboto', sans-serif; }

      .sb-overlay {
        position: fixed; inset: 0; background: rgba(0,0,0,0.3);
        opacity: 0; visibility: hidden; z-index: 999; transition: 0.3s;
      }
      .sb-overlay.show { opacity: 1; visibility: visible; }

      .sidebar {
        position: fixed; top: 0; left: 0; bottom: 0; 
        width: 70%; 
        max-width: 280px;
        background: #FFFFFF;
        z-index: 1000; display: flex; flex-direction: column;
        transform: translateX(-100%); transition: transform 0.3s ease;
        box-shadow: 2px 0 12px rgba(0,0,0,0.1);
      }
      .sidebar.open { transform: translateX(0); }

      .sb-header {
        padding: 20px 16px; border-bottom: 1px solid var(--sb-border);
        font-size: 20px; font-weight: 700; color: #202020;
        font-family: 'Inter', sans-serif;
        background: #FFFFFF;
      }

      .sb-main-menu {
        flex: 1; overflow-y: auto; padding: 8px;
        display: flex; flex-direction: column; gap: 2px;
        background: #FFFFFF;
      }

      .sb-main-item .sb-link {
        display: flex; align-items: center; gap: 12px;
        padding: 14px 12px; 
        border-radius: var(--sb-radius);
        text-decoration: none; color: var(--sb-text);
        font-size: 15px; 
        font-weight: 500; transition: background 0.2s;
      }
      .sb-main-item .sb-link:hover, .sb-main-item .sb-link.active-parent {
        background: var(--sb-hover-bg);
      }
      .sb-main-item .sb-icon { display: flex; color: #555555; }
      .sb-main-item .sb-icon svg { width: 22px; height: 22px; }
      .sb-main-item .sb-label { flex: 1; }
      
      .sb-arrow {
        font-size: 18px; color: #888; font-weight: bold;
        display: flex; align-items: center;
      }
      .sb-arrow.empty { visibility: hidden; }

      .sub-panel {
        position: absolute; 
        top: 60px; 
        left: 10px; 
        right: 10px; 
        width: auto; 
        max-height: 70vh; 
        background: #FFFFFF;
        z-index: 1001;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        border: 1px solid var(--sb-border);
        overflow-y: auto;
        transform: scale(0.95);
        opacity: 0;
        visibility: hidden;
        transition: all 0.2s ease;
      }
      .sub-panel.open { 
        transform: scale(1);
        opacity: 1;
        visibility: visible;
      }

      .sub-panel.level-3 {
        top: 80px; 
        z-index: 1002;
        background: #FFFFFF;
      }

      .sb-panel-header {
        padding: 12px 16px; 
        border-bottom: 1px solid var(--sb-border);
        font-size: 16px; 
        font-weight: 600; color: #202020;
        display: flex; align-items: center; gap: 8px;
        background: #F9FAFB;
        border-top-left-radius: 12px;
        border-top-right-radius: 12px;
        position: sticky; top: 0; z-index: 2;
      }
      .sb-back-btn {
        cursor: pointer; font-size: 20px; color: #333;
        font-weight: bold; padding: 0 4px;
        display: flex; align-items: center; justify-content: center;
      }

      .sb-panel-content {
        padding: 8px;
        display: flex; flex-direction: column; gap: 4px;
      }

      .sb-panel-item .sb-panel-link {
        display: flex; align-items: center; justify-content: space-between;
        padding: 12px 12px; 
        border-radius: 8px;
        text-decoration: none; color: var(--sb-text);
        font-size: 15px; 
        font-weight: 500; transition: background 0.2s;
      }
      .sb-panel-item .sb-panel-link:hover, .sb-panel-item .sb-panel-link.active-parent {
        background: var(--sb-hover-bg);
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

    var mainMenuHtml = MENU.map(renderMainItem).join('');

    shell.innerHTML =
      '<div class="sb-overlay" id="sbOverlay"></div>' +
      
      '<aside class="sidebar" id="sidebar">' +
        '<div class="sb-header">Adeel Mobile</div>' +
        '<nav class="sb-main-menu" id="mainMenu">' + mainMenuHtml + '</nav>' +
        
        '<div class="sub-panel" id="panelL2">' +
          '<div class="sb-panel-header"><span class="sb-back-btn" id="backL2">‹</span> <span id="titleL2">Menu</span></div>' +
          '<div class="sb-panel-content" id="contentL2"></div>' +
        '</div>' +
        
        '<div class="sub-panel level-3" id="panelL3">' +
          '<div class="sb-panel-header"><span class="sb-back-btn" id="backL3">‹</span> <span id="titleL3">Sub Menu</span></div>' +
          '<div class="sb-panel-content" id="contentL3"></div>' +
        '</div>' +
        
      '</aside>' +
      
      '<div class="app-main">' +
        '<header class="topbar">' +
          '<button class="menu-btn" id="menuBtn">☰</button>' +
        '</header>' +
        '<div class="app-content" id="appContent"></div>' +
      '</div>';

    document.body.insertBefore(shell, document.body.firstChild);
    if (content) document.getElementById('appContent').appendChild(content);

    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sbOverlay');
    var panelL2 = document.getElementById('panelL2');
    var panelL3 = document.getElementById('panelL3');
    var contentL2 = document.getElementById('contentL2');
    var contentL3 = document.getElementById('contentL3');

    function closeAll() {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
      panelL2.classList.remove('open');
      panelL3.classList.remove('open');
    }

    document.getElementById('menuBtn').addEventListener('click', function () {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('show');
      if (!sidebar.classList.contains('open')) {
        panelL2.classList.remove('open');
        panelL3.classList.remove('open');
      }
    });

    overlay.addEventListener('click', closeAll);

    document.getElementById('mainMenu').addEventListener('click', function(e) {
      var link = e.target.closest('.sb-link');
      if (!link) return;
      
      var itemDiv = link.parentNode;
      var id = itemDiv.getAttribute('data-id');
      var m = MENU.find(function(x) { return x.key === id; });

      if (m && m.children) {
        e.preventDefault();
        document.querySelectorAll('.sb-link').forEach(function(el) { el.classList.remove('active-parent'); });
        link.classList.add('active-parent');
        
        var subHtml = m.children.map(renderSubItem).join('');
        contentL2.innerHTML = subHtml;
        document.getElementById('titleL2').textContent = m.label;
        
        panelL2.classList.add('open');
        panelL3.classList.remove('open');
      } else {
        closeAll();
      }
    });

    contentL2.addEventListener('click', function(e) {
      var link = e.target.closest('.sb-panel-link');
      if (!link) return;
      
      var itemDiv = link.parentNode;
      var id = itemDiv.getAttribute('data-id');
      
      var parentM = MENU.find(function(x) { 
        return x.children && x.children.find(function(c){ return c.key === id; }); 
      });
      var subM = parentM.children.find(function(c) { return c.key === id; });

      if (subM && subM.children) {
        e.preventDefault();
        contentL2.querySelectorAll('.sb-panel-link').forEach(function(el) { el.classList.remove('active-parent'); });
        link.classList.add('active-parent');

        var subSubHtml = subM.children.map(renderSubItem).join('');
        contentL3.innerHTML = subSubHtml;
        document.getElementById('titleL3').textContent = subM.label;
        
        panelL3.classList.add('open');
      } else {
        closeAll();
      }
    });

    document.getElementById('backL2').addEventListener('click', function() {
      panelL2.classList.remove('open');
      document.querySelectorAll('.sb-link').forEach(function(el) { el.classList.remove('active-parent'); });
    });

    document.getElementById('backL3').addEventListener('click', function() {
      panelL3.classList.remove('open');
    });

    contentL3.addEventListener('click', function(e) {
      var link = e.target.closest('.sb-panel-link');
      if (link && link.getAttribute('href') !== 'javascript:void(0)') {
        closeAll();
      }
    });
    
    document.querySelectorAll('.sb-link, .sb-panel-link').forEach(function(link) {
      var href = link.getAttribute('href');
      if (href === 'javascript:void(0)') {
        link.addEventListener('click', function(e) {
          if (!link.querySelector('.sb-arrow:not(.empty)')) {
            e.preventDefault();
            toast('This page is coming soon');
          }
        });
      }
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
})()