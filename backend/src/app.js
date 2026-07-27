const express = require("express");
const employeeRoutes = require("./employees/employee.routes");

const app = express();
app.use(express.json());

app.get("/", (req,res) => {
    res.send('Hr Payroll Api is running ....')
});

app.use("/api/employees", employeeRoutes);
// POST   /employees           -> Create employee
// PUT    /employees/:id       -> Update employee
// PATCH  /employees/:id/status -> Activate/Deactivate employee

module.exports = app;