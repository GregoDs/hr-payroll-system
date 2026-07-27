
CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);




CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_code TEXT UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone_number TEXT UNIQUE NOT NULL,
    national_id TEXT UNIQUE NOT NULL,
    kra_pin TEXT UNIQUE,
    role_title TEXT NOT NULL,
    system_role TEXT NOT NULL DEFAULT 'Employee',
    team_id INTEGER NOT NULL,
    manager_id INTEGER,
    employment_type TEXT NOT NULL,
    salary REAL NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (team_id) REFERENCES teams(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (manager_id) REFERENCES employees(id) ON UPDATE CASCADE ON DELETE SET NULL
);




CREATE TABLE IF NOT EXISTS leave_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    leave_type TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'Pending',
    approved_by INTEGER,
    approved_at DATETIME,
    manager_comment TEXT,
    total_days INTEGER NOT NULL,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME default CURRENT_TIMESTAMP,

    FOREIGN KEY (employee_id) REFERENCES employees(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (approved_by) REFERENCES employees(id) ON UPDATE CASCADE ON DELETE SET NULL
);




CREATE TABLE IF NOT EXISTS payroll (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    pay_period TEXT NOT NULL,
    basic_salary REAL NOT NULL,
    unpaid_leave_days INTEGER NOT NULL DEFAULT 0,
    unpaid_leave_deduction REAL NOT NULL DEFAULT 0,
    gross_pay REAL NOT NULL,
    tax_deduction REAL NOT NULL DEFAULT 0,
    social_security_deductions REAL NOT NULL DEFAULT 0,
    other_deductions REAL NOT NULL DEFAULT 0,
    net_pay REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'Draft',
    generated_by INTEGER NOT NULL,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (employee_id, pay_period),

    FOREIGN KEY (employee_id)
        REFERENCES employees(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    FOREIGN KEY (generated_by)
        REFERENCES employees(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);