const db = require("../database/database");

function getAllEmployees() {

    const query = `
    SELECT
        e.id,
        e.employee_code,
        e.first_name,
        e.last_name,
        e.email,
        e.phone_number,
        t.name AS team_name,
        m.first_name || ' ' || m.last_name AS manager_name
    FROM employees e
    LEFT JOIN teams t
        ON e.team_id = t.id
    LEFT JOIN employees m
        ON e.manager_id = m.id
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




async function getEmployeeById(id) {

    const query = `
        SELECT
            e.id,
            e.employee_code,
            e.first_name,
            e.last_name,
            e.email,
            e.phone_number,
            e.national_id,
            e.kra_pin,
            e.role_title,
            e.system_role, 
            e.employment_type,
            e.salary,
            e.start_date,
            e.end_date,
            e.is_active,
            e.created_at,
            e.updated_at,
            t.name AS team_name,
            m.first_name || ' ' || m.last_name AS manager_name
            FROM employees e
            LEFT JOIN teams t
            ON e.team_id = t.id
            LEFT JOIN employees m
            ON e.manager_id = m.id
            WHERE e.id = ?;
 `;

    return new Promise((resolve, reject) => {

        db.get(query, [id], (err, row) => {
            if (err) {
                return reject(err);
            }
            resolve(row);
        });
    });
}


//Private helper
function getEmployeeByField(field, value) {
    
    const query = `
    SELECT *
    FROM employees
    WHERE ${field} = ?
    LIMIT 1;
    `;

    return new Promise((resolve, reject) => {
        db.get(query, [value], (err, row) => {
            if (err) {
                return reject(err);
            }
            resolve(row);
        });
    });

}

function getEmployeeByEmployeeCode(employeeCode) {
    return getEmployeeByField("employee_code", employeeCode);
}

function getEmployeeByEmail(email) {
    return getEmployeeByField("email", email);
}

function getEmployeeByPhoneNumber(phoneNumber) {
    return getEmployeeByField("phone_number", phoneNumber);
}

function getEmployeeByNationalId(nationalId) {
    return getEmployeeByField("national_id", nationalId);
}

function getEmployeeByKraPin(kraPin) {
    return getEmployeeByField("kra_pin", kraPin);
}





//create employee
function createEmployee(employee) {

    const query = `

        INSERT INTO employees (
            employee_code,
            first_name,
            last_name,
            email,
            phone_number,
            national_id,
            kra_pin,
            role_title,
            system_role,
            team_id,
            manager_id,
            employment_type,
            salary,
            start_date,
            end_date,
            is_active
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

    `;

    const values = [

        employee.employee_code,
        employee.first_name,
        employee.last_name,
        employee.email,
        employee.phone_number,
        employee.national_id,
        employee.kra_pin,
        employee.role_title,
        employee.system_role,
        employee.team_id,
        employee.manager_id,
        employee.employment_type,
        employee.salary,
        employee.start_date,
        employee.end_date,
        employee.is_active

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


//update employee

function updateEmployee(id, employee) {

    const query = `

        UPDATE employees
        SET
            employee_code = ?,
            first_name = ?,
            last_name = ?,
            email = ?,
            phone_number = ?,
            national_id = ?,
            kra_pin = ?,
            role_title = ?,
            system_role = ?,
            team_id = ?,
            manager_id = ?,
            employment_type = ?,
            salary = ?,
            start_date = ?,
            end_date = ?,
            is_active = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?

    `;

    const values = [

        employee.employee_code,
        employee.first_name,
        employee.last_name,
        employee.email,
        employee.phone_number,
        employee.national_id,
        employee.kra_pin,
        employee.role_title,
        employee.system_role,
        employee.team_id,
        employee.manager_id,
        employee.employment_type,
        employee.salary,
        employee.start_date,
        employee.end_date,
        employee.is_active,
        id

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


//update status...deactivate or activate

function updateEmployeeStatus(id, is_active) {

    const query = `

        UPDATE employees
        SET
            is_active = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?

    `;

    return new Promise((resolve, reject) => {

        db.run(query, [is_active, id], function (err) {

            if (err) {
                return reject(err);
            }

            resolve({
                changes: this.changes
            });

        });

    });

}




module.exports = {
    getAllEmployees,
    getEmployeeById,
    getEmployeeByEmployeeCode,
    getEmployeeByEmail,
    getEmployeeByPhoneNumber,
    getEmployeeByNationalId,
    getEmployeeByKraPin,
    createEmployee,
    updateEmployee,
    updateEmployeeStatus,
};