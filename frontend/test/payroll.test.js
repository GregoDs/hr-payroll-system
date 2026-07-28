import test from "node:test";
import assert from "node:assert/strict";
import { calculatePayroll, calculateSocialSecurity, calculateTax } from "../js/domain/payroll.js";

test("tax is zero through the first bracket boundary", () => {
  assert.equal(calculateTax(0), 0);
  assert.equal(calculateTax(24000), 0);
});

test("tax brackets are progressive at exact boundaries", () => {
  assert.equal(calculateTax(50000), 2600);
  assert.equal(calculateTax(100000), 12600);
  assert.equal(calculateTax(120000), 18600);
});

test("social security is flat-rate and capped", () => {
  assert.equal(calculateSocialSecurity(0), 0);
  assert.equal(calculateSocialSecurity(100000), 5000);
  assert.equal(calculateSocialSecurity(120000), 6000);
  assert.equal(calculateSocialSecurity(200000), 6000);
});

test("mid-month joiner is prorated on a 30-day month", () => {
  const result = calculatePayroll(
    { id: 1, salary: 90000, start_date: "2026-07-16" },
    "2026-07",
    [],
  );
  assert.equal(result.payable_days, 16);
  assert.equal(result.gross_pay, 48000);
  assert.equal(result.proration, 42000);
});

test("approved unpaid leave reduces gross and net pay", () => {
  const leaves = [{
    employee_id: 1,
    leave_type: "Unpaid",
    status: "Approved",
    start_date: "2026-07-10",
    end_date: "2026-07-12",
  }];
  const result = calculatePayroll(
    { id: 1, salary: 90000, start_date: "2024-01-01" },
    "2026-07",
    leaves,
  );
  assert.equal(result.unpaid_leave_days, 3);
  assert.equal(result.unpaid_leave_deduction, 9000);
  assert.equal(result.gross_pay, 81000);
  assert.equal(result.net_pay, 68150);
});
