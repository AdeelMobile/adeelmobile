/* Main Dashboard - Summary Cards + Date Filters */
(function () {
  'use strict';

  const CFG = {
    products: {
      table: 'models'
    },
    orders: {
      table: 'orders',
      statusCol: 'status',
      amountCol: 'amount',
      advanceCol: 'advance',
      dateCol: 'created_at',
      cancelledValues: ['cancelled', 'canceled', 'rejected'],
      closedValues: ['completed', 'closed']
    },
    customers: {
      table: 'customers',
      dateCol: 'created_at'
    },
    verifications: {
      table: 'verifications',
      statusCol: 'status',
      pendingValue: 'pending'
    }
  };

  let client = null;
  let currentRange = 'today';
  let loadVersion = 0;

  function $(id) {
    return document.getElementById(id);
  }

  function getClient() {
    if (typeof db !== 'undefined' && db?.from) {
      return db;
    }

    throw new Error(
      'Supabase client not found. Check js/supabase-config.js.'
    );
  }

  function startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  function fmtDate(date) {
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  function money(value) {
    return 'Rs ' + Number(value || 0).toLocaleString('en-PK');
  }

  function getRange(key) {
    const today = startOfDay(new Date());

    if (key === 'today') {
      return [today, addDays(today, 1)];
    }

    if (key === 'yesterday') {
      return [addDays(today, -1), today];
    }

    if (key === 'week') {
      const day = (today.getDay() + 6) % 7;
      const start = addDays(today, -day);
      return [start, addDays(start, 7)];
    }

    if (key === 'month') {
      return [
        new Date(today.getFullYear(), today.getMonth(), 1),
        new Date(today.getFullYear(), today.getMonth() + 1, 1)
      ];
    }

    if (key === 'custom') {
      const fromValue = $('fromDate').value;
      const toValue = $('toDate').value;

      if (!fromValue || !toValue || toValue < fromValue) {
        return null;
      }

      return [
        new Date(fromValue + 'T00:00:00'),
        addDays(new Date(toValue + 'T00:00:00'), 1)
      ];
    }

    return null;
  }

  function showRangeText(range) {
    const lastDay = addDays(range[1], -1);
    const from = fmtDate(range[0]);
    const to = fmtDate(lastDay);

    $('rangeText').textContent =
      'Date: ' + (from === to ? from : from + ' → ' + to);
  }

  function setCard(id, value, isMoney) {
    const element = $(id);
    if (!element) return;

    element.textContent = isMoney
      ? money(value)
      : Number(value || 0).toLocaleString('en-PK');
  }

  function showNote(message) {
    const note = $('note');
    if (!note) return;

    note.hidden = !message;
    note.textContent = message || '';
  }

  async function countRows(table, modifyQuery) {
    let query = client
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (modifyQuery) {
      query = modifyQuery(query);
    }

    const result = await query;

    if (result.error) throw result.error;

    return result.count || 0;
  }

  async function fetchOrders() {
    const order = CFG.orders;

    const columns = [
      order.statusCol,
      order.amountCol,
      order.advanceCol,
      order.dateCol
    ].join(',');

    const result = await client
      .from(order.table)
      .select(columns)
      .limit(10000);

    if (result.error) throw result.error;

    return result.data || [];
  }

  function statusOf(row) {
    return String(row[CFG.orders.statusCol] || '')
      .trim()
      .toLowerCase();
  }

  function isCancelled(row) {
    return CFG.orders.cancelledValues.includes(statusOf(row));
  }

  function isActive(row) {
    const status = statusOf(row);

    return !CFG.orders.cancelledValues.includes(status) &&
      !CFG.orders.closedValues.includes(status);
  }

  async function loadDashboard() {
    const version = ++loadVersion;
    const range = getRange(currentRange);

    if (!range) return;

    showRangeText(range);
    showNote('');

    const order = CFG.orders;
    const failed = [];

    let ordersPromise = fetchOrders();

    // Handle promise rejection.
    ordersPromise.catch(function () {});

    async function loadCard(id, label, task, isMoney) {
      try {
        const value = await task();

        if (version !== loadVersion) return;

        setCard(id, value, isMoney);
      } catch (error) {
        if (version !== loadVersion) return;

        setCard(id, 0, isMoney);
        failed.push(label);
        console.error(label + ' load error:', error);
      }
    }

    await Promise.all([
      loadCard(
        'c-products',
        'Products',
        function () {
          return countRows(CFG.products.table);
        }
      ),

      loadCard(
        'c-installments',
        'Active Installments',
        async function () {
          const rows = await ordersPromise;
          return rows.filter(isActive).length;
        }
      ),

      loadCard(
        'c-collected',
        'Collected Amount',
        async function () {
          const rows = await ordersPromise;

          return rows
            .filter(function (row) {
              const date = new Date(row[order.dateCol]);

              return !isCancelled(row) &&
                !Number.isNaN(date.getTime()) &&
                date >= range[0] &&
                date < range[1];
            })
            .reduce(function (total, row) {
              return total + Number(row[order.advanceCol] || 0);
            }, 0);
        },
        true
      ),

      loadCard(
        'c-remaining',
        'Remaining Amount',
        async function () {
          const rows = await ordersPromise;

          return rows
            .filter(isActive)
            .reduce(function (total, row) {
              const amount = Number(row[order.amountCol] || 0);
              const advance = Number(row[order.advanceCol] || 0);

              return total + Math.max(amount - advance, 0);
            }, 0);
        },
        true
      ),

      loadCard(
        'c-customers',
        'Customers',
        function () {
          const customer = CFG.customers;

          return countRows(customer.table, function (query) {
            return query
              .gte(customer.dateCol, range[0].toISOString())
              .lt(customer.dateCol, range[1].toISOString());
          });
        }
      ),

      loadCard(
        'c-verifications',
        'Pending Verifications',
        function () {
          const verification = CFG.verifications;

          return countRows(
            verification.table,
            function (query) {
              return query.ilike(
                verification.statusCol,
                verification.pendingValue
              );
            }
          );
        }
      )
    ]);

    if (version !== loadVersion) return;

    $('c-collected').nextElementSibling.textContent =
      'Advance only; installment payments are recorded separately';

    $('c-remaining').nextElementSibling.textContent =
      'Order amount − advance; active orders';

    if (failed.length) {
      showNote(
        'Data failed to load for these cards: ' +
        failed.join(', ') +
        '. Check table/column names and Supabase permissions.'
      );
    }

    await loadActivity(version);
  }

  async function loadActivity(version) {
    const list = $('activity');
    const items = [];

    try {
      const result = await client
        .from(CFG.products.table)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (result.error) throw result.error;

      (result.data || []).forEach(function (row) {
        items.push({
          icon: 'New',
          text: 'New model: ' +
            (row.name || row.model_name || row.model || row.title || 'Model'),
          at: row.created_at
        });
      });
    } catch (error) {
      console.error('Product activity error:', error);
    }

    try {
      const result = await client
        .from(CFG.orders.table)
        .select('*')
        .order(CFG.orders.dateCol, { ascending: false })
        .limit(5);

      if (result.error) throw result.error;

      (result.data || []).forEach(function (row) {
        items.push({
          icon: 'Order',
          text: 'Order: ' +
            (row.product_name || 'Item') +
            ' — ' +
            money(row[CFG.orders.amountCol]),
          at: row[CFG.orders.dateCol]
        });
      });
    } catch (error) {
      console.error('Order activity error:', error);
    }

    if (version !== loadVersion) return;

    items.sort(function (a, b) {
      return new Date(b.at || 0) - new Date(a.at || 0);
    });

    list.replaceChildren();

    if (!items.length) {
      const li = document.createElement('li');
      li.textContent = 'No recent activity';
      list.appendChild(li);
      return;
    }

    items.slice(0, 6).forEach(function (item) {
      const li = document.createElement('li');

      const text = document.createElement('span');
      text.textContent = item.icon + ': ' + item.text;

      const when = document.createElement('span');
      when.className = 'when';

      if (item.at && !Number.isNaN(new Date(item.at).getTime())) {
        when.textContent = fmtDate(new Date(item.at));
      }

      li.appendChild(text);
      li.appendChild(when);
      list.appendChild(li);
    });
  }

  function setup() {
    const chips = document.querySelectorAll('.md-chip');

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (item) {
          item.classList.remove('active');
        });

        chip.classList.add('active');
        currentRange = chip.getAttribute('data-range');

        $('customBox').hidden = currentRange !== 'custom';

        if (currentRange !== 'custom') {
          loadDashboard();
        }
      });
    });

    $('applyCustom').addEventListener('click', function () {
      if (!getRange('custom')) {
        showNote('Please select a valid start and end date.');
        return;
      }

      loadDashboard();
    });

    client = getClient();
    loadDashboard();
  }

  // Admin access is already checked by requireLogin() in the HTML.
  try {
    setup();
  } catch (error) {
    console.error('Dashboard setup error:', error);
    showNote('Dashboard could not start. Check Supabase config.');
  }
})();