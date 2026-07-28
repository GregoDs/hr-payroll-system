const payrollModel = require("./payroll.model");

const WORKING_DAYS_PER_MONTH = 30;
const SOCIAL_SECURITY_RATE = 0.05;
const SOCIAL_SECURITY_CAP = 6000;
const DEFAULT_GENERATED_BY = 1;

const TAX_BRACKETS = [
    { min: 0, max: 24000, rate: 0 },
    { min: 24000, max: 50000, rate: 0.10 },
    { min: 50000, max: 100000, rate: 0.20 },
    { min: 100000, max: null, rate: 0.30 }
];


//Generate the Payroll
async function generatePayroll(payrollData) {

    const payPeriod = payrollData.pay_period;
    const periodDates = getPayPeriodDates(payPeriod);

    const employees = await payrollModel.getActiveEmployeesForPayPeriod(periodDates.endDateString);

    if (employees.length === 0) {
        throw createError("No active employees found for this pay period.", 404);
    }

    const existingPayrollRecords = await payrollModel.getExistingPayrollByPeriod(payPeriod);

    if (existingPayrollRecords.length > 0) {
        throw createError("Payroll has already been generated for this pay period.", 409);
    }

    const approvedUnpaidLeaves = await payrollModel.getApprovedUnpaidLeavesForPeriod(
        periodDates.startDateString,
        periodDates.endDateString
    );

    const payrollRecords = [];

    await payrollModel.beginTransaction();

    try {
        for (const employee of employees) {
            //Calculate how many approved unpaid leave days affects employee in this period
            const employeeUnpaidLeaveDays = calculateEmployeeUnpaidLeaveDays(
                employee.id,
                approvedUnpaidLeaves,
                periodDates.startDate,
                periodDates.endDate
            );
            //calcu;ate payroll values 
            const payrollCalculation = calculatePayrollForEmployee(
                employee,
                payPeriod,
                employeeUnpaidLeaveDays,
                payrollData.generated_by || DEFAULT_GENERATED_BY,
                periodDates
            );
            //save payroll
            const payrollId = await payrollModel.createPayrollRecord(payrollCalculation);
            const payrollRecord = await payrollModel.getPayrollById(payrollId);
            //fetch payroll
            payrollRecords.push(payrollRecord);
        }
        //permanently save the payroll records of all employees
        await payrollModel.commitTransaction();
    } catch (error) {
        await payrollModel.rollbackTransaction();
        throw error;
    }

    return payrollRecords;
}


async function getAllPayrollRecords() {
    return await payrollModel.getAllPayrollRecords();
}


async function getPayrollById(payrollId) {

    if (!payrollId) {
        throw createError("Payroll ID is required.", 400);
    }

    const payroll = await payrollModel.getPayrollById(payrollId);

    if (!payroll) {
        throw createError("Payroll record not found.", 404);
    }

    return payroll;
}


async function getPayrollByEmployeeId(employeeId) {

    if (!employeeId) {
        throw createError("Employee id is required.", 400);
    }

    const payrollRecords = await payrollModel.getPayrollByEmployeeId(employeeId);

    if (payrollRecords.length === 0) {
        throw createError("No payroll records found for this employee.", 404);
    }

    return payrollRecords;
}


async function getPayslipDetails(payrollId) {

    const payroll = await getPayrollById(payrollId);

    if (payroll.status === "Draft") {
        throw createError("Payslip is not available until payroll is finalized.", 409);
    }

    return {
        payroll_id: payroll.id,
        employee: {
            employee_id: payroll.employee_id,
            employee_code: payroll.employee_code,
            name: payroll.employee_name,
            email: payroll.email,
            role_title: payroll.role_title,
            employment_type: payroll.employment_type,
            team_name: payroll.team_name
        },
        pay_period: payroll.pay_period,
        earnings: {
            basic_salary: payroll.basic_salary,
            gross_pay: payroll.gross_pay
        },
        deductions: {
            unpaid_leave_days: payroll.unpaid_leave_days,
            unpaid_leave_deduction: payroll.unpaid_leave_deduction,
            tax_deduction: payroll.tax_deduction,
            social_security_deduction: payroll.social_security_deduction,
            other_deductions: payroll.other_deductions,
            total_deductions: roundMoney(
                payroll.unpaid_leave_deduction +
                payroll.tax_deduction +
                payroll.social_security_deduction +
                payroll.other_deductions
            )
        },
        net_pay: payroll.net_pay,
        status: payroll.status,
        generated_at: payroll.generated_at
    };
}


async function finalizePayroll(payrollId, managerId) {

    if (!managerId) {
        throw createError("Manager id is required.", 400);
    }

    const payroll = await getPayrollById(payrollId);

    if (payroll.status !== "Draft") {
        throw createError("Only draft payroll records can be finalized.", 409);
    }

    await payrollModel.updatePayrollStatus(payrollId, {
        status: "Finalized",
        generated_by: managerId
    });

    return await payrollModel.getPayrollById(payrollId);
}




///Calculate an employees payroll
function calculatePayrollForEmployee(employee, payPeriod, unpaidLeaveDays, generatedBy, periodDates) {

    const basicSalary = Number(employee.salary);
    const dailyRate = basicSalary / WORKING_DAYS_PER_MONTH;
    const payableDays = calculatePayableDays(employee.start_date, periodDates.startDate, periodDates.endDate);
    const proratedSalary = dailyRate * payableDays;
    const unpaidLeaveDeduction = dailyRate * unpaidLeaveDays;
    const grossPay = Math.max(proratedSalary - unpaidLeaveDeduction, 0);
    const taxDeduction = calculateTax(grossPay);
    const socialSecurityDeduction = calculateSocialSecurity(grossPay);
    const otherDeductions = 0;
    const netPay = Math.max(grossPay - taxDeduction - socialSecurityDeduction - otherDeductions, 0);

    return {
        employee_id: employee.id,
        pay_period: payPeriod,
        basic_salary: roundMoney(basicSalary),
        unpaid_leave_days: unpaidLeaveDays,
        unpaid_leave_deduction: roundMoney(unpaidLeaveDeduction),
        gross_pay: roundMoney(grossPay),
        tax_deduction: roundMoney(taxDeduction),
        social_security_deduction: roundMoney(socialSecurityDeduction),
        other_deductions: roundMoney(otherDeductions),
        net_pay: roundMoney(netPay),
        status: "Draft",
        generated_by: generatedBy
    };
}


function calculateTax(grossPay) {

    let tax = 0;

    for (const bracket of TAX_BRACKETS) {
        if (grossPay <= bracket.min) {
            continue;
        }

        const taxableLimit = bracket.max || grossPay;
        const taxableAmount = Math.min(grossPay, taxableLimit) - bracket.min;

        tax += taxableAmount * bracket.rate;
    }

    return roundMoney(tax);
}


function calculateSocialSecurity(grossPay) {
    return roundMoney(Math.min(grossPay * SOCIAL_SECURITY_RATE, SOCIAL_SECURITY_CAP));
}


function calculatePayableDays(startDateValue, periodStartDate, periodEndDate) {

    const employeeStartDate = parseDate(startDateValue, "Employee start date is invalid.", 400);
    const effectiveStartDate = employeeStartDate > periodStartDate ? employeeStartDate : periodStartDate;

    if (effectiveStartDate > periodEndDate) {
        return 0;
    }

    return Math.min(daysBetweenInclusive(effectiveStartDate, periodEndDate), WORKING_DAYS_PER_MONTH);
}


function calculateEmployeeUnpaidLeaveDays(employeeId, unpaidLeaves, periodStartDate, periodEndDate) {

    return unpaidLeaves
        .filter((leaveRequest) => leaveRequest.employee_id === employeeId)
        .reduce((totalDays, leaveRequest) => {
            const leaveStartDate = parseDate(leaveRequest.start_date, "Leave start date is invalid.", 400);
            const leaveEndDate = parseDate(leaveRequest.end_date, "Leave end date is invalid.", 400);
            const overlapStartDate = leaveStartDate > periodStartDate ? leaveStartDate : periodStartDate;
            const overlapEndDate = leaveEndDate < periodEndDate ? leaveEndDate : periodEndDate;

            if (overlapStartDate > overlapEndDate) {
                return totalDays;
            }

            return totalDays + daysBetweenInclusive(overlapStartDate, overlapEndDate);
        }, 0);
}


function getPayPeriodDates(payPeriod) {

    const startDate = parseDate(`${payPeriod}-01`, "pay_period is invalid.", 400);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

    return {
        startDate,
        endDate,
        startDateString: formatDate(startDate),
        endDateString: formatDate(endDate)
    };
}


function daysBetweenInclusive(startDate, endDate) {

    const millisecondsInDay = 24 * 60 * 60 * 1000;
    const start = new Date(startDate);
    const end = new Date(endDate);

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const difference = end.getTime() - start.getTime();

    return Math.floor(difference / millisecondsInDay) + 1;
}


function formatDate(date) {
    return date.toISOString().split("T")[0];
}


function parseDate(value, errorMessage, statusCode) {

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        throw createError(errorMessage, statusCode);
    }

    return date;
}


function roundMoney(amount) {
    return Number(Number(amount).toFixed(2));
}


function createError(message, statusCode = 500) {

    const error = new Error(message);
    error.statusCode = statusCode;

    return error;
}


module.exports = {
    generatePayroll,
    getAllPayrollRecords,
    getPayrollById,
    getPayrollByEmployeeId,
    getPayslipDetails,
    finalizePayroll,
    calculatePayrollForEmployee,
    calculateTax,
    calculateSocialSecurity,
};
