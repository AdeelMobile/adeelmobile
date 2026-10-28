/* Installment Plans & Rules */
(function () {
  var R = INSTALLMENT_RULES;
  var selMonths = Number(Object.keys(R.markupPercent)[0]);
  var last = null;
  var userId = null;

  function $(id) { return document.getElementById(id); }
  function money(n) { return 'Rs ' + Number(n || 0).toLocaleString('en-PK'); }
  function showNote(t) { var n = $('note'); n.textContent = t || ''; n.hidden = !t; }

  function addRow(tbody, cells) {
    var tr = document.createElement('tr');
    cells.forEach(function (c) {
      var td = document.createElement('td');
      td.textContent = c;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  }

  function buildChips() {
    var box = $('months');
    box.innerHTML = '';
    Object.keys(R.markupPercent).forEach(function (m) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'ip-chip' + (Number(m) === selMonths ? ' active' : '');
      b.textContent = '📆 ' + m + ' mahine';
      b.addEventListener('click', function () { selMonths = Number(m); buildChips(); update(); });
      box.appendChild(b);
    });
  }

  function renderRules() {
    var body = $('rulesBody');
    body.innerHTML = '';
    var lim = Number(R.priceLimit).toLocaleString('en-PK');
    addRow(body, ['Advance (qeemat Rs ' + lim + ' ya kam)', R.advanceLowPercent + '%']);
    addRow(body, ['Advance (qeemat Rs ' + lim + ' se zyada)', R.advanceHighPercent + '%']);
    Object.keys(R.markupPercent).forEach(function (m) {
      addRow(body, ['Markup ' + m + ' mahine (Baqi par)', R.markupPercent[m] + '%']);
    });
  }

  function update() {
    var price = $('price').value;
    last = calcInstallment(price, selMonths);
    var has = !!last;
    $('c-adv').textContent = has ? money(last.advance) : 'Rs 0';
    $('h-adv').textContent = has ? last.advancePercent + '% advance' : '—';
    $('c-bal').textContent = has ? money(last.balance) : 'Rs 0';
    $('c-mk').textContent = has ? money(last.markup) : 'Rs 0';
    $('h-mk').textContent = has ? last.markupPercent + '% (' + selMonths + ' mahine)' : '—';
    $('c-mon').textContent = has ? money(last.monthly) : 'Rs 0';
    $('h-mon').textContent = has ? selMonths + ' mahine, kul ' + money(last.total) : '—';
    $('saveBtn').disabled = !has;

    var body = $('allPlans');
    body.innerHTML = '';
    Object.keys(R.markupPercent).forEach(function (m) {
      var c = calcInstallment(price, m);
      addRow(body, [m + ' mahine', c ? money(c.monthly) : '-', c ? money(c.total) : '-']);
    });
  }

  async function loadSaved() {
    var list = $('saved');
    var r = await db.from('installment_plans').select('*').order('created_at', { ascending: false }).limit(10);
    list.innerHTML = '';
    if (r.error) {
      var e = document.createElement('li');
      e.textContent = 'ℹ️ Save kiye hue plans nahi mile (table "installment_plans" banai hai?)';
      list.appendChild(e);
      return;
    }
    if (!r.data.length) {
      var n = document.createElement('li');
      n.textContent = '📭 Abhi koi plan save nahi hua';
      list.appendChild(n);
      return;
    }
    r.data.forEach(function (p) {
      var li = document.createElement('li');
      li.textContent = '📱 ' + (p.item_name || 'Bina naam') + ' — ' + money(p.price);
      var sm = document.createElement('span');
      sm.className = 'sm';
      sm.textContent = p.months + ' mahine, mahana ' + money(p.monthly) + ', advance ' + money(p.advance);
      li.appendChild(sm);
      list.appendChild(li);
    });
  }

  async function save() {
    if (!last) return;
    var btn = $('saveBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Save ho raha hai...';
    var row = {
      item_name: $('itemName').value.trim() || null,
      price: last.price, months: last.months,
      advance_percent: last.advancePercent, advance: last.advance,
      balance: last.balance,
      markup_percent: last.markupPercent, markup: last.markup,
      total_payable: last.total, monthly: last.monthly,
      created_by: userId
    };
    var r = await db.from('installment_plans').insert(row);
    btn.textContent = '💾 Plan Save Karein';
    btn.disabled = false;
    if (r.error) {
      showNote('ℹ️ Plan save nahi hua. Table "installment_plans" banai hai? (' + r.error.message + ')');
      return;
    }
    showNote('✅ Plan save ho gaya');
    loadSaved();
  }

  requireLogin().then(function (session) {
    if (!session) return;
    userId = session.user.id;
    buildChips();
    renderRules();
    update();
    loadSaved();
    $('price').addEventListener('input', update);
    $('saveBtn').addEventListener('click', save);
  });
})();