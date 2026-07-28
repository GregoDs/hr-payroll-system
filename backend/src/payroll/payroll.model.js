const db = require("../database/database");


function getAllPayrollRecords() {

    const query = `
        SELECT
            p.id,
            p.employee_id,
            e.employee_code,
            e.first_name || ' ' || e.last_name AS employee_name,
            e.role_title,
            t.name AS team_name,
            p.pay_period,
            p.basic_salary,
            p.unpaid_leave_days,
            p.unpaid_leave_deduction,
            p.gross_pay,
            p.tax_deduction,
            p.social_security_deduction,
            p.other_deductions,
            p.net_pay,
            p.status,
            p.generated_by,
            g.first_name || ' ' || g.last_name AS generated_by_name,
            p.generated_at,
            p.created_at,
            p.updated_at
        FROM payroll p
        INNER JOIN employees e
            ON p.employee_id = e.id
        LEFT JOIN teams t
            ON e.team_id = t.id
        LEFT JOIN employees g
            ON p.generated_by = g.id
        ORDER BY p.pay_period DESC, p.created_at DESC
    `;

    return new Promise((resolve, reject) => {
        db.all(query, (err, rows) => {
            if (err) {
                return reject(err);
            }

            resolve(rows);
        });
    });
}


function getPayrollById(payrollId) {

    const query = `
        SELECT
            p.id,
            p.employee_id,
            e.employee_code,
            e.first_name,
            e.last_name,
            e.first_name || ' ' || e.last_name AS employee_name,
            e.email,
            e.role_title,
            e.employment_type,
            t.name AS team_name,
            p.pay_period,
            p.basic_salary,
            p.unpaid_leave_days,
            p.unpaid_leave_deduction,
            p.gross_pay,
            p.tax_deduction,
            p.social_security_deduction,
            p.other_deductions,
            p.net_pay,
            p.status,
            p.generated_by,
            g.first_name || ' ' || g.last_name AS generated_by_name,
            p.generated_at,
            p.created_at,
            p.updated_at
        FROM payroll p
        INNER JOIN employees e
            ON p.employee_id = e.id
        LEFT JOIN teams t
            ON e.team_id = t.id
        LEFT JOIN employees g
            ON p.generated_by = g.id
        WHERE p.id = ?
    `;

    return new Promise((resolve, reject) => {
        db.get(query, [payrollId], (err, row) => {
            if (err) {
                return reject(err);
            }

            resolve(row);
        });
    });
}


function getPayrollByEmployeeId(employeeId) {

    const query = `
        SELECT
            p.id,
            p.employee_id,
            e.employee_code,
            e.first_name || ' ' || e.last_name AS employee_name,
            p.pay_period,
            p.basic_salary,
            p.unpaid_leave_days,
            p.unpaid_leave_deduction,
            p.gross_pay,
            p.tax_deduction,
            p.social_security_deduction,
            p.other_deductions,
            p.net_pay,
            p.status,
            p.generated_at,
            p.created_at,
            p.updated_at
        FROM payroll p
        INNER JOIN employees e
            ON p.employee_id = e.id
        WHERE p.employee_id = ?
            AND p.status IN ('Finalized', 'Paid')
        ORDER BY p.pay_period DESC
    `;

    return new Promise((resolve, reject) => {
        db.all(query, [employeeId], (err, rows) => {
            if (err) {
                return reject(err);
            }

            resolve(rows);
        });
    });
}


function updatePayrollStatus(payrollId, payroll) {

    const query = `
        UPDATE payroll
        SET
            status = ?,
            generated_by = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `;

    const values = [
        payroll.status,
        payroll.generated_by,
        payrollId
    ];

    return new Promise((resolve, reject) => {
        db.run(query, values, function (err) {
            if (err) {
                return reject(err);
            }

            resolve({
                changes: this.changes
            });
        });
    });
}


function getActiveEmployeesForPayPeriod(periodEndDate) {

    const query = `
        SELECT
            id,
            employee_code,
            first_name,
            last_name,
            email,
            role_title,
            employment_type,
            salary,
            start_date,
            end_date,
            is_active
        FROM employees
        WHERE is_active = 1
            AND date(start_date) <= date(?)
        ORDER BY id ASC
    `;

    return new Promise((resolve, reject) => {
        db.all(query, [periodEndDate], (err, rows) => {
            if (err) {
                return reject(err);
            }

            resolve(rows);
        });
    });
}


function getExistingPayrollByPeriod(payPeriod) {

    const query = `
        SELECT
            employee_id,
            pay_period
        FROM payroll
        WHERE pay_period = ?
    `;

    return new Promise((resolve, reject) => {
        db.all(query, [payPeriod], (err, rows) => {
            if (err) {
                return reject(err);
            }

            resolve(rows);
        });
    });
}


function getApprovedUnpaidLeavesForPeriod(payPeriodStartDate, payPeriodEndDate) {

    const query = `
        SELECT
            id,
            employee_id,
            leave_type,
            start_date,
            end_date,
            status,
            total_days
        FROM leave_requests
        WHERE leave_type = 'Unpaid'
            AND status = 'Approved'
            AND date(start_date) <= date(?)
            AND date(end_date) >= date(?)
        ORDER BY start_date ASC
    `;

    return new Promise((resolve, reject) => {
        db.all(query, [payPeriodEndDate, payPeriodStartDate], (err, rows) => {
            if (err) {
                return reject(err);
            }

            resolve(rows);
        });
    });
}


function createPayrollRecord(payroll) {

    const query = `
        INSERT INTO payroll (
            employee_id,
            pay_period,
            basic_salary,
            unpaid_leave_days,
            unpaid_leave_deduction,
            gross_pay,
            tax_deduction,
            social_security_deduction,
            other_deductions,
            net_pay,
            status,
            generated_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        payroll.employee_id,
        payroll.pay_period,
        payroll.basic_salary,
        payroll.unpaid_leave_days,
        payroll.unpaid_leave_deduction,
        payroll.gross_pay,
        payroll.tax_deduction,
        payroll.social_security_deduction,
        payroll.other_deductions,
        payroll.net_pay,
        payroll.status,
        payroll.generated_by
    ];

    return new Promise((resolve, reject) => {
        db.run(query, values, function (err) {
            if (err) {
                return reject(err);
            }

            resolve(this.lastID);
        });
    });
}


function beginTransaction() {

    return new Promise((resolve, reject) => {
        db.run("BEGIN TRANSACTION", (err) => {
            if (err) {
                return reject(err);
            }

            resolve();
        });
    });
}


function commitTransaction() {

    return new Promise((resolve, reject) => {
        db.run("COMMIT", (err) => {
            if (err) {
                return reject(err);
            }

            resolve();
        });
    });
}


function rollbackTransaction() {

    return new Promise((resolve) => {
        db.run("ROLLBACK", () => {
            resolve();
        });
    });
}


module.exports = {
    getAllPayrollRecords,
    getPayrollById,
    getPayrollByEmployeeId,
    updatePayrollStatus,
    getActiveEmployeesForPayPeriod,
    getExistingPayrollByPeriod,
    getApprovedUnpaidLeavesForPeriod,
    createPayrollRecord,
    beginTransaction,
    commitTransaction,
    rollbackTransaction,
};
