const PAYROLL_DAYS = 30;
const SOCIAL_SECURITY_RATE = 0.05;
const SOCIAL_SECURITY_CAP = 6000;

export function roundMoney(value) {
  return Number(Number(value).toFixed(2));
}

export function calculateTax(grossPay) {
  const gross = Math.max(Number(grossPay) || 0, 0);
  const bands = [
    { floor: 0, ceiling: 24000, rate: 0 },
    { floor: 24000, ceiling: 50000, rate: 0.1 },
    { floor: 50000, ceiling: 100000, rate: 0.2 },
    { floor: 100000, ceiling: Infinity, rate: 0.3 },
  ];

  return roundMoney(
    bands.reduce((tax, band) => {
      const taxable = Math.max(Math.min(gross, band.ceiling) - band.floor, 0);
      return tax + taxable * band.rate;
    }, 0),
  );
}

export function calculateSocialSecurity(grossPay) {
  return roundMoney(Math.min(Math.max(Number(grossPay) || 0, 0) * SOCIAL_SECURITY_RATE, SOCIAL_SECURITY_CAP));
}

export function getPayPeriodDates(payPeriod) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(payPeriod)) {
    throw new Error("Pay period must use YYYY-MM.");
  }
  const [year, month] = payPeriod.split("-").map(Number);
  return {
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month, 0)),
  };
}

export function daysInclusive(start, end) {
  const millisecondsPerDay = 86400000;
  return Math.floor((end.getTime() - start.getTime()) / millisecondsPerDay) + 1;
}

export function payableDays(startDate, payPeriod) {
  const period = getPayPeriodDates(payPeriod);
  const joined = new Date(`${startDate}T00:00:00Z`);
  const effectiveStart = joined > period.start ? joined : period.start;
  if (effectiveStart > period.end) return 0;
  return Math.min(daysInclusive(effectiveStart, period.end), PAYROLL_DAYS);
}

export function unpaidDaysForPeriod(employeeId, payPeriod, leaveRequests) {
  const period = getPayPeriodDates(payPeriod);
  return leaveRequests
    .filter((request) =>
      request.employee_id === employeeId &&
      request.leave_type === "Unpaid" &&
      request.status === "Approved")
    .reduce((total, request) => {
      const start = new Date(`${request.start_date}T00:00:00Z`);
      const end = new Date(`${request.end_date}T00:00:00Z`);
      const overlapStart = start > period.start ? start : period.start;
      const overlapEnd = end < period.end ? end : period.end;
      return overlapStart > overlapEnd ? total : total + daysInclusive(overlapStart, overlapEnd);
    }, 0);
}

export function calculatePayroll(employee, payPeriod, leaveRequests = []) {
  const basicSalary = Number(employee.salary);
  const days = payableDays(employee.start_date, payPeriod);
  const unpaidLeaveDays = unpaidDaysForPeriod(employee.id, payPeriod, leaveRequests);
  const dailyRate = basicSalary / PAYROLL_DAYS;
  const proratedSalary = dailyRate * days;
  const unpaidLeaveDeduction = dailyRate * unpaidLeaveDays;
  const grossPay = Math.max(proratedSalary - unpaidLeaveDeduction, 0);
  const taxDeduction = calculateTax(grossPay);
  const socialSecurityDeduction = calculateSocialSecurity(grossPay);
  const netPay = Math.max(grossPay - taxDeduction - socialSecurityDeduction, 0);

  return {
    basic_salary: roundMoney(basicSalary),
    payable_days: days,
    proration: roundMoney(Math.max(basicSalary - proratedSalary, 0)),
    unpaid_leave_days: unpaidLeaveDays,
    unpaid_leave_deduction: roundMoney(unpaidLeaveDeduction),
    gross_pay: roundMoney(grossPay),
    tax_deduction: taxDeduction,
    social_security_deduction: socialSecurityDeduction,
    other_deductions: 0,
    net_pay: roundMoney(netPay),
  };
}
