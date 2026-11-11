/**
 * Pure installment schedule builder.
 * The contract's total is rounded to paisa once; equal integer-paisa amounts
 * are assigned to early installments and the exact remainder to the last.
 * Due dates are calendar-month anniversaries in UTC, clamped to month-end.
 * No late fee is added and no database writes occur here.
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function parseIsoDate(value) {
  if (typeof value !== "string" || !ISO_DATE.test(value)) {
    throw new TypeError("Contract date must use YYYY-MM-DD.");
  }
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new RangeError("Contract date is not a valid calendar date.");
  }
  return { year, month: month - 1, day };
}

function addCalendarMonths(base, offset) {
  const absoluteMonth = base.month + offset;
  const year = base.year + Math.floor(absoluteMonth / 12);
  const month = absoluteMonth % 12;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const day = Math.min(base.day, lastDay);
  return new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);
}

export function buildInstallmentSchedule(totalBalance, months, contractDate) {
  if (typeof totalBalance !== "number" || !Number.isFinite(totalBalance) || totalBalance <= 0) {
    throw new TypeError("Total installment balance must be a positive finite number.");
  }
  if (!Number.isInteger(months) || ![3, 6, 9].includes(months)) {
    throw new RangeError("Schedule length must be 3, 6, or 9 months.");
  }

  const base = parseIsoDate(contractDate);
  const totalPaisa = Math.round((totalBalance + Number.EPSILON) * 100);
  if (totalPaisa < months) {
    throw new RangeError("Total balance is too small for the selected schedule.");
  }

  const regularPaisa = Math.floor(totalPaisa / months);
  let allocated = 0;

  return Object.freeze(Array.from({ length: months }, (_, index) => {
    const amountPaisa = index === months - 1 ? totalPaisa - allocated : regularPaisa;
    allocated += amountPaisa;
    return Object.freeze({
      sequence: index + 1,
      dueDate: addCalendarMonths(base, index + 1),
      amount: amountPaisa / 100,
      amountPaisa,
      amountPaid: 0,
      status: "pending",
    });
  }));
}
