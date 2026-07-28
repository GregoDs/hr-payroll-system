const express = require("express");
const router = express.Router();
const { getAllEmployees, getAllEmployeesById, createEmployee, updateEmployee, updateEmployeeStatus } = require("./employee.controller");
const { validateCreateEmployee, validateUpdateEmployee } = require("./employee.validation");

router.get("/",getAllEmployees);
router.post("/",validateCreateEmployee, createEmployee);
router.patch("/:id/status", updateEmployeeStatus);
router.get("/:id", getAllEmployeesById);
router.put("/:id",validateUpdateEmployee, updateEmployee);


module.exports = router;
