
const requiredFields = [
    "first_name",
    "last_name",
    "email",
    "phone_number",
    "national_id",
    "role_title",
    "team_id",
    "employment_type",
    "salary",
    "start_date"
];

function validateCreateEmployee(req, res, next) {

    for (const field of requiredFields) {
        if (!req.body[field]) {
            const error = new Error(`${field} is required.`);
            error.statusCode = 400;

            return next(error);
        }
    }
    next();
}

function validateUpdateEmployee(req, res, next) {

    for (const field of requiredFields) {
        if (!req.body[field]) {
          const error = new Error(`${field} is required.`);
            error.statusCode = 400;

            return next(error);
        }
    }

    next();
}

module.exports = {
    validateCreateEmployee,
    validateUpdateEmployee
};
