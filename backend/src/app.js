const express = require("express");
const employeeRoutes = require("./employees/employee.routes");
const leaveRoutes = require("./leave-requests/leave.routes");
const logger = require("./middleware/logger.middleware");
const errorHandler = require("./middleware/error.middleware");

const app = express();
app.use(express.json());
app.use(logger);

app.get("/", (req,res) => {
    res.send('Hr Payroll Api is running ....')
});

app.use("/api/employees", employeeRoutes);
app.use("/api/leaves", leaveRoutes);
// POST   /employees           -> Create employee
// PUT    /employees/:id       -> Update employee
// PATCH  /employees/:id/status -> Activate/Deactivate employee


app.use(errorHandler);

module.exports = app;