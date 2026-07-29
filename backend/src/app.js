const express = require("express");
const employeeRoutes = require("./employees/employee.routes");
const leaveRoutes = require("./leave-requests/leave.routes");
const payrollRoutes = require("./payroll/payroll.routes");
const logger = require("./middleware/logger.middleware");
const errorHandler = require("./middleware/error.middleware");
const db = require("./database/database");

const app = express();
app.use((req, res, next) => {
    const allowedOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5500";
    res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
});
app.use(express.json());
app.use(logger);

app.get("/", (req,res) => {
    res.send('Hr Payroll Api is running ....')
});

app.get("/api/health", (req, res) => {
    res.json({ success: true, data: { status: "ok" } });
});

app.post("/api/auth/login", (req, res, next) => {
    const email = String(req.body.email || "").trim().toLowerCase();
    const demoPassword = process.env.DEMO_PASSWORD || "12345";
    if (!email || req.body.password !== demoPassword) {
        return res.status(401).json({ success: false, message: "Invalid email or password." });
    }
    db.get(
        `SELECT e.*, t.name AS team_name,
                m.first_name || ' ' || m.last_name AS manager_name
         FROM employees e
         LEFT JOIN teams t ON e.team_id = t.id
         LEFT JOIN employees m ON e.manager_id = m.id
         WHERE lower(e.email) = ? LIMIT 1`,
        [email],
        (error, employee) => {
            if (error) return next(error);
            if (!employee) return res.status(401).json({ success: false, message: "Invalid email or password." });
            if (!employee.is_active) return res.status(403).json({ success: false, message: "This employee account is inactive." });
            res.json({ success: true, data: employee });
        }
    );
});

app.get("/api/teams", (req, res, next) => {
    db.all("SELECT id, name, description, created_at, updated_at FROM teams ORDER BY name", (error, teams) => {
        if (error) return next(error);
        res.json({ success: true, data: teams });
    });
});

app.use("/api/employees", employeeRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/payroll", payrollRoutes);

app.use(errorHandler);

module.exports = app;
