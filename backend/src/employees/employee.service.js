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


// Update employee
async function updateEmployee(id, employeeData) {
    
    const existingEmployee = await employeeModel.getEmployeeById(id);
    if (!existingEmployee) {
        throw createError("Employee not found.", 404);
    }

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