const express = require("express");
const router = express.Router();
const { getAllEmployees, getAllEmployeesById, createEmployee, updateEmployee, updateEmployeeStatus } = require("./employee.controller");

router.get("/",getAllEmployees);
router.post("/", createEmployee);
router.patch("/:id/status", updateEmployeeStatus);
router.get("/:id", getAllEmployeesById);
router.put("/:id", updateEmployee);


module.exports = router;
