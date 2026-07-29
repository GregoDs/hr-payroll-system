const express = require("express");
const router = express.Router();

const {
    generatePayroll,
    getAllPayrollRecords,
    getPayrollByEmployeeId,
    getPayrollById,
    getPayslipDetails,
    finalizePayroll,
    updateDraftBasicSalary,
    refreshDraftPayroll
} = require("./payroll.controller");

const { validateGeneratePayroll, validatePayrollDecision, validateBasicSalaryUpdate } = require("./payroll.validation");


router.post("/generate", validateGeneratePayroll, generatePayroll);
router.patch("/refresh-draft", validateGeneratePayroll, refreshDraftPayroll);
router.get("/", getAllPayrollRecords);
router.get("/employee/:employeeId", getPayrollByEmployeeId);
router.patch("/:payrollId/basic-salary", validateBasicSalaryUpdate, updateDraftBasicSalary);
router.patch("/:payrollId/finalize", validatePayrollDecision, finalizePayroll);
router.get("/:payrollId/payslip", getPayslipDetails);
router.get("/:payrollId", getPayrollById);


module.exports = router;
