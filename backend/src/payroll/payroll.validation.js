function validateGeneratePayroll(req, res, next) {

    if (!req.body.pay_period) {
        const error = new Error("pay_period is required.");
        error.statusCode = 400;

        return next(error);
    }

    if (!isValidPayPeriod(req.body.pay_period)) {
        const error = new Error("pay_period must be in YYYY-MM format.");
        error.statusCode = 400;

        return next(error);
    }

    next();
}


function validatePayrollDecision(req, res, next) {

    if (!req.body.manager_id) {
        const error = new Error("manager_id is required.");
        error.statusCode = 400;

        return next(error);
    }

    if (Number.isNaN(Number(req.body.manager_id))) {
        const error = new Error("Invalid manager id.");
        error.statusCode = 400;

        return next(error);
    }

    next();
}


function validateBasicSalaryUpdate(req, res, next) {

    const basicSalary = Number(req.body.basic_salary);

    if (req.body.basic_salary === undefined) {
        const error = new Error("basic_salary is required.");
        error.statusCode = 400;

        return next(error);
    }

    if (!Number.isFinite(basicSalary) || basicSalary <= 0) {
        const error = new Error("basic_salary must be a positive amount.");
        error.statusCode = 400;

        return next(error);
    }

    next();
}


function isValidPayPeriod(payPeriod) {
    return /^\d{4}-(0[1-9]|1[0-2])$/.test(payPeriod);
}


module.exports = {
    validateGeneratePayroll,
    validatePayrollDecision,
    validateBasicSalaryUpdate
};
