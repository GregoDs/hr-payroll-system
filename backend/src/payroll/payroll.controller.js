const payrollService = require("./payroll.service");


async function generatePayroll(req, res, next) {
    try {
        const payrollRecords = await payrollService.generatePayroll(req.body);

        return res.status(201).json({
            success: true,
            message: "Payroll generated successfully.",
            data: payrollRecords,
        });
    } catch (error) {
        next(error);
    }
}


async function getAllPayrollRecords(req, res, next) {
    try {
        const payrollRecords = await payrollService.getAllPayrollRecords();

        return res.status(200).json({
            success: true,
            data: payrollRecords,
        });
    } catch (error) {
        next(error);
    }
}


async function getPayrollByEmployeeId(req, res, next) {
    try {
        const employeeId = Number(req.params.employeeId);

        if (Number.isNaN(employeeId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid employee ID.",
            });
        }

        const payrollRecords = await payrollService.getPayrollByEmployeeId(employeeId);

        return res.status(200).json({
            success: true,
            data: payrollRecords,
        });
    } catch (error) {
        next(error);
    }
}


async function getPayrollById(req, res, next) {
    try {
        const payrollId = Number(req.params.payrollId);

        if (Number.isNaN(payrollId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid payroll ID.",
            });
        }

        const payrollRecord = await payrollService.getPayrollById(payrollId);

        return res.status(200).json({
            success: true,
            data: payrollRecord,
        });
    } catch (error) {
        next(error);
    }
}


async function getPayslipDetails(req, res, next) {
    try {
        const payrollId = Number(req.params.payrollId);

        if (Number.isNaN(payrollId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid payroll ID.",
            });
        }

        const payslip = await payrollService.getPayslipDetails(payrollId);

        return res.status(200).json({
            success: true,
            data: payslip,
        });
    } catch (error) {
        next(error);
    }
}


async function finalizePayroll(req, res, next) {
    try {
        const payrollId = Number(req.params.payrollId);

        if (Number.isNaN(payrollId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid payroll ID.",
            });
        }

        const payrollRecord = await payrollService.finalizePayroll(
            payrollId,
            req.body.manager_id
        );

        return res.status(200).json({
            success: true,
            message: "Payroll finalized successfully.",
            data: payrollRecord,
        });
    } catch (error) {
        next(error);
    }
}


async function updateDraftBasicSalary(req, res, next) {
    try {
        const payrollId = Number(req.params.payrollId);

        if (Number.isNaN(payrollId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid payroll ID.",
            });
        }

        const payrollRecord = await payrollService.updateDraftBasicSalary(
            payrollId,
            req.body.basic_salary
        );

        return res.status(200).json({
            success: true,
            message: "Draft payroll salary updated successfully.",
            data: payrollRecord,
        });
    } catch (error) {
        next(error);
    }
}


async function refreshDraftPayroll(req, res, next) {
    try {
        const payrollRecords = await payrollService.refreshDraftPayroll(req.body.pay_period);

        return res.status(200).json({
            success: true,
            message: "Draft payroll refreshed successfully.",
            data: payrollRecords,
        });
    } catch (error) {
        next(error);
    }
}


module.exports = {
    generatePayroll,
    getAllPayrollRecords,
    getPayrollByEmployeeId,
    getPayrollById,
    getPayslipDetails,
    finalizePayroll,
    updateDraftBasicSalary,
    refreshDraftPayroll,
};
