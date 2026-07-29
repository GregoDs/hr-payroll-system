const test = require("node:test");
const assert = require("node:assert/strict");

const {
    calculatePayrollForEmployee,
    calculateTax,
    calculateSocialSecurity,
} = require("../src/payroll/payroll.service");
const db = require("../src/database/database");

test.after(() => {
    db.close();
});

test("tax is zero up to 24,000", () => {
    assert.equal(calculateTax(24000), 0);
});

test("tax does not enter the 20% bracket at exactly 50,000", () => {
    assert.equal(calculateTax(50000), 2600);
});

test("tax only applies the 20% rate to the amount above 50,000", () => {
    assert.equal(calculateTax(50001), 2600.2);
});

test("social security is 5% of gross pay but capped at 6,000", () => {
    assert.equal(calculateSocialSecurity(40000), 2000);
    assert.equal(calculateSocialSecurity(200000), 6000);
});

test("approved unpaid leave reduces gross pay and net pay", () => {
    const payroll = calculatePayrollForEmployee(
        {
            id: 1,
            salary: 50000,
            start_date: "2026-08-01",
        },
        "2026-08",
        6,
        1,
        {
            startDate: new Date("2026-08-01"),
            endDate: new Date("2026-08-31"),
        }
    );

    assert.equal(payroll.basic_salary, 50000);
    assert.equal(payroll.unpaid_leave_days, 6);
    assert.equal(payroll.unpaid_leave_deduction, 10000);
    assert.equal(payroll.gross_pay, 40000);
    assert.equal(payroll.tax_deduction, 1600);
    assert.equal(payroll.social_security_deduction, 2000);
    assert.equal(payroll.net_pay, 36400);
});

test("mid-month joiners are prorated", () => {
    const payroll = calculatePayrollForEmployee(
        {
            id: 2,
            salary: 30000,
            start_date: "2026-08-16",
        },
        "2026-08",
        0,
        1,
        {
            startDate: new Date("2026-08-01"),
            endDate: new Date("2026-08-31"),
        }
    );

    assert.equal(payroll.gross_pay, 16000);
    assert.equal(payroll.net_pay, 15200);
});
