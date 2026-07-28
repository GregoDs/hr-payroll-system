const express = require("express");
const router = express.Router();

const {
    generatePayroll,
    getAllPayrollRecords,
    getPayrollByEmployeeId,
    getPayrollById,
    getPayslipDetails,
    finalizePayroll
} = require("./payroll.controller");

const { validateGeneratePayroll, validatePayrollDecision } = require("./payroll.validation");


router.post("/generate", validateGeneratePayroll, generatePayroll);
router.get("/", getAllPayrollRecords);
router.get("/employee/:employeeId", getPayrollByEmployeeId);
router.patch("/:payrollId/finalize", validatePayrollDecision, finalizePayroll);
router.get("/:payrollId/payslip", getPayslipDetails);
router.get("/:payrollId", getPayrollById);


module.exports = router;
