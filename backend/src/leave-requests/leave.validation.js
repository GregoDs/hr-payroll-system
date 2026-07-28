const requiredCreateFields = [
    "employee_id",
    "leave_type",
    "start_date",
    "end_date",
    "reason"
];

const allowedLeaveTypes = [
    "Annual",
    "Sick",
    "Maternity",
    "Paternity",
    "Compassionate",
    "Study",
    "Unpaid"
];


function validateCreateLeaveRequest(req, res, next) {

    for (const field of requiredCreateFields) {
        if (!req.body[field]) {
            const error = new Error(`${field} is required.`);
            error.statusCode = 400;

            return next(error);
        }
    }

    if (!allowedLeaveTypes.includes(req.body.leave_type)) {
        const error = new Error("Invalid leave type.");
        error.statusCode = 400;

        return next(error);
    }

    if (Number.isNaN(Number(req.body.employee_id))) {
        const error = new Error("Invalid employee id.");
        error.statusCode = 400;

        return next(error);
    }

    next();
}


function validateLeaveDecision(req, res, next) {

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


module.exports = {
    validateCreateLeaveRequest,
    validateLeaveDecision
};
