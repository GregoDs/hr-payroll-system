const employeeModel = require("./employee.model");


async function getAllEmployees() {
    return await employeeModel.getAllEmployees();
}


// Get one employee
async function getEmployeeById(id) {

    const employee = await employeeModel.getEmployeeById(id);

    if (!employee) {
        throw createError("Employee not found.", 404);
    }
    return employee;
}


// Create employee
async function createEmployee(employeeData) {
    employeeData = {
        ...employeeData,
        employee_code: employeeData.employee_code || await nextEmployeeCode(),
        system_role: employeeData.system_role || "Employee",
        manager_id: employeeData.manager_id || null,
        end_date: employeeData.end_date || null,
        is_active: employeeData.is_active === undefined ? 1 : Number(Boolean(employeeData.is_active))
    };
    await validateReportingRelationship(employeeData);

    const employeeCode = await employeeModel.getEmployeeByEmployeeCode(employeeData.employee_code);
    const employeeEmail = await employeeModel.getEmployeeByEmail(employeeData.email);
    const employeePhone = await employeeModel.getEmployeeByPhoneNumber(employeeData.phone_number);
    const employeeNationalId = await employeeModel.getEmployeeByNationalId(employeeData.national_id);
    const employeeKraPin = employeeData.kra_pin ? await employeeModel.getEmployeeByKraPin(employeeData.kra_pin) : null;

    if (employeeCode) {
        throw createError("Employee code already exists.", 409);
    }
    if (employeeEmail) {
        throw createError("Email already exists.", 409);
    }
    if (employeePhone) {
        throw createError("Phone number already exists.", 409);
    }
    if (employeeNationalId) {
        throw createError("National ID already exists.", 409);
    }
    if (employeeKraPin) {
        throw createError("KRA PIN already exists.", 409);
    }

    const employeeId = await employeeModel.createEmployee(employeeData);

    return await employeeModel.getEmployeeById(employeeId);
}

async function nextEmployeeCode() {
    const employees = await employeeModel.getAllEmployees();
    const nextNumber = employees.reduce((highest, employee) => {
        const match = String(employee.employee_code || "").match(/(\d+)$/);
        return Math.max(highest, match ? Number(match[1]) : 0);
    }, 0) + 1;
    return `EMP-${new Date().getFullYear()}-${String(nextNumber).padStart(3, "0")}`;
}


// Update employee
async function updateEmployee(id, employeeData) {
    
    const existingEmployee = await employeeModel.getEmployeeById(id);
    if (!existingEmployee) {
        throw createError("Employee not found.", 404);
    }
    await validateReportingRelationship(employeeData, id);

    // Check email only if it changed
    if (employeeData.email !== existingEmployee.email) {
        const employee = await employeeModel.getEmployeeByEmail(employeeData.email);
        if (employee) {
            throw createError("Email already exists.", 409);
        }
    }
    // Employee code
    if (employeeData.employee_code !== existingEmployee.employee_code) {
        const employee = await employeeModel.getEmployeeByEmployeeCode(employeeData.employee_code);
        if (employee) {
            throw createError("Employee code already exists.", 409);
        }
    }
    // Phone
    if (employeeData.phone_number !== existingEmployee.phone_number) {
        const employee = await employeeModel.getEmployeeByPhoneNumber(employeeData.phone_number);
        if (employee) {
            throw createError("Phone number already exists.", 409);
        }
    }
    // National ID
    if (employeeData.national_id !== existingEmployee.national_id) {
        const employee = await employeeModel.getEmployeeByNationalId(employeeData.national_id);
        if (employee) {
            throw createError("National ID already exists.", 409);
        }
    }
    // KRA PIN
    if (employeeData.kra_pin !== existingEmployee.kra_pin) {
        const employee = await employeeModel.getEmployeeByKraPin(employeeData.kra_pin);
        if (employee) {
            throw createError("KRA PIN already exists.", 409);
        }
    }

    await employeeModel.updateEmployee(id, employeeData);

    return await employeeModel.getEmployeeById(id);
}

async function validateReportingRelationship(employeeData, employeeId = null) {
    const leaders = ["Manager", "Admin"];
    if (leaders.includes(employeeData.system_role)) {
        const employees = await employeeModel.getAllEmployees();
        const existingLeader = employees.find((employee) =>
            employee.id !== Number(employeeId) &&
            employee.is_active &&
            leaders.includes(employee.system_role) &&
            Number(employee.team_id) === Number(employeeData.team_id)
        );
        if (existingLeader) {
            throw createError(`${existingLeader.team_name} already has ${existingLeader.first_name} ${existingLeader.last_name} as its department manager.`, 409);
        }
        return;
    }

    if (!employeeData.manager_id) {
        throw createError("A manager is required for this employee's team.", 400);
    }

    const manager = await employeeModel.getEmployeeById(Number(employeeData.manager_id));
    if (!manager) {
        throw createError("Selected manager was not found.", 400);
    }
    if (employeeId && manager.id === Number(employeeId)) {
        throw createError("An employee cannot be their own manager.", 409);
    }
    if (!manager.is_active) {
        throw createError("Selected manager is inactive.", 409);
    }
    if (!leaders.includes(manager.system_role)) {
        throw createError("Selected employee is not a department manager.", 409);
    }
    if (Number(manager.team_id) !== Number(employeeData.team_id)) {
        throw createError(`Selected manager belongs to ${manager.team_name}, not the employee's team.`, 409);
    }
}





async function updateEmployeeStatus(id, is_active) {

    const employee = await employeeModel.getEmployeeById(id);
    if (!employee) {
        throw createError("Employee not found.", 404);
    }

    await employeeModel.updateEmployeeStatus(id, is_active);

    return await employeeModel.getEmployeeById(id);
}




//Helper function for errors
function createError(message, statusCode) {

    const error = new Error(message);
    error.statusCode = statusCode;

    return error;
}


module.exports = {
    getAllEmployees,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    updateEmployeeStatus,
};
