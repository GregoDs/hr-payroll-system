const employeeModel =  require("./employee.model");

async function getAllEmployees() {
    const employees = await employeeModel.getAllEmployees();
    
    return employees;
}


//fetch one employee
async function getEmployeeById(id) {
    const employee = await employeeModel.getEmployeeById(id);

    if (!employee) {
     throw new Error("Employee not found.");
    }

    return employee;

}



//create an employee
async function createEmployee(employeeData) {

    // Validation
    if (!employeeData.first_name) {
        throw new Error("First name is required.");
    }

    if (!employeeData.last_name) {
        throw new Error("Last name is required.");
    }

    if (!employeeData.email) {
        throw new Error("Email is required.");
    }

    // Insert employee
    const result = await employeeModel.createEmployee(employeeData);

    // Fetch the newly created employee
    const employee = await employeeModel.getEmployeeById(result.id);

    return employee;
}

async function updateEmployee(id, employeeData) {

    const existingEmployee = await employeeModel.getEmployeeById(id);

    if (!existingEmployee) {
        throw new Error("Employee not found.");
    }

    await employeeModel.updateEmployee(id, employeeData);

    const employee = await employeeModel.getEmployeeById(id);

    return employee;
}

async function updateEmployeeStatus(id, is_active) {

    const existingEmployee = await employeeModel.getEmployeeById(id);

    if (!existingEmployee) {
        throw new Error("Employee not found.");
    }

    await employeeModel.updateEmployeeStatus(id, is_active);

    const employee = await employeeModel.getEmployeeById(id);

    return employee;
}


module.exports = {
    getAllEmployees,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    updateEmployeeStatus,
};
