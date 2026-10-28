"use strict";

window.ProductProfit = {
  calculate: function (price, brandPercent, incentiveType, incentiveValue) {
    price = Number(price) || 0;
    brandPercent = Number(brandPercent) || 0;
    incentiveValue = Number(incentiveValue) || 0;

    const brandProfit = price * brandPercent / 100;

    const modelIncentive =
      incentiveType === "percent"
        ? price * incentiveValue / 100
        : incentiveValue;

    return Math.round((brandProfit + modelIncentive) * 100) / 100;
  },

  format: function (amount) {
    return "Rs. " + Number(amount || 0).toLocaleString("en-PK");
  }
};