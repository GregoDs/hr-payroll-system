const employeeService = require("./employee.service");

async function getAllEmployees(req, res, next) {
    try {
        const employees = await employeeService.getAllEmployees();

        return res.status(200).json({
            success: true,
            data: employees,
        });
    } catch (error) {
        // return res.status(500).json({
        //     success: false,
        //     message: error.message,
        // });
        next(error);
    }
}

async function getAllEmployeesById(req, res, next){
    try {
        const id = Number(req.params.id);
            if (Number.isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid employee ID.",
                });

            }
        const employees = await employeeService.getEmployeeById(id);
        
        return res.status(200).json({
            success: true,
            data: employees,
        });

    } catch (error) {
         next(error);
    }
}

async function createEmployee(req, res, next) {

    try {
        const employee = await employeeService.createEmployee(req.body);

        return res.status(201).json({
            success: true,
            message: "Employee created successfully.",
            data: employee
        });

    } catch (error) {
        next(error);
    }
}





async function updateEmployee(req, res, next) {
    try {
        const id = Number(req.params.id);

        if (Number.isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid employee ID.",
            });
        }
        const employee = await employeeService.updateEmployee(id, req.body);
        return res.status(200).json({
            success: true,
            message: "Employee updated successfully.",
            data: employee
        });

    } catch (error) {
        next(error);
    }
}

async function updateEmployeeStatus(req, res, next) {

    try {
        const id = Number(req.params.id);

        if (Number.isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid employee ID.",
            });
        }

        const employee = await employeeService.updateEmployeeStatus(id, req.body.is_active);

        return res.status(200).json({
            success: true,
            message: "Employee status updated successfully.",
            data: employee
        });

    } catch (error) {
        next(error);
    }
}



module.exports = {
    getAllEmployees,
    getAllEmployeesById,
    createEmployee,
    updateEmployee,
    updateEmployeeStatus
};
