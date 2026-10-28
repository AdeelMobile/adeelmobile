// Hisaab: Baqi = Qeemat - Advance, Markup = Baqi x %, Mahana = (Baqi + Markup) / Mahine
function getAdvancePercent(price) {
  return Number(price) <= INSTALLMENT_RULES.priceLimit
    ? INSTALLMENT_RULES.advanceLowPercent
    : INSTALLMENT_RULES.advanceHighPercent;
}

function calcInstallment(price, months) {
  price = Number(price);
  months = Number(months);
  var markupPercent = INSTALLMENT_RULES.markupPercent[months];
  if (!(price > 0) || markupPercent === undefined) return null;

  var advancePercent = getAdvancePercent(price);
  var advance = Math.round(price * advancePercent / 100);
  var balance = price - advance;
  var markup = Math.round(balance * markupPercent / 100);
  var total = balance + markup;
  var monthly = Math.round(total / months);

  return {
    price: price, months: months,
    advancePercent: advancePercent, advance: advance,
    balance: balance,
    markupPercent: markupPercent, markup: markup,
    total: total, monthly: monthly
  };
}