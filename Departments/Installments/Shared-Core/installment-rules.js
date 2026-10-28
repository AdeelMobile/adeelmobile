// Installment ke sab rules ek hi jagah. Rate badalna ho to sirf yahan badlein.
const INSTALLMENT_RULES = {
  priceLimit: 60000,        // is qeemat tak (barabar bhi) advance kam
  advanceLowPercent: 20,    // qeemat 60,000 ya kam
  advanceHighPercent: 30,   // qeemat 60,000 se zyada
  markupPercent: { 3: 15, 6: 30, 9: 40 }  // mahine : markup %
};