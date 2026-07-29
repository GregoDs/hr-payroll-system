PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO teams VALUES(1,'Engineering','Software development and infrastructure','2026-07-28 17:04:00','2026-07-28 17:04:00');
INSERT INTO teams VALUES(2,'Human Resources','People operations','2026-07-28 17:04:00','2026-07-28 17:04:00');
INSERT INTO teams VALUES(3,'Finance','Payroll and finance','2026-07-28 17:04:00','2026-07-28 17:04:00');
INSERT INTO teams VALUES(4,'Sales & Marketing','Sales and marketing','2026-07-28 17:04:00','2026-07-28 17:04:00');
INSERT INTO teams VALUES(5,'Operations','Business operations','2026-07-28 17:04:00','2026-07-28 17:04:00');
CREATE TABLE employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_code TEXT UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone_number TEXT UNIQUE NOT NULL,
    national_id TEXT UNIQUE NOT NULL,
    kra_pin TEXT UNIQUE,
    role_title TEXT NOT NULL,
    system_role TEXT NOT NULL DEFAULT 'Employee'
    CHECK (
        system_role IN ('Admin', 'HR', 'Manager', 'Employee')
    ),
    team_id INTEGER NOT NULL,
    manager_id INTEGER,
    employment_type TEXT NOT NULL
    CHECK (
        employment_type IN (
            'Permanent',
            'Contract',
            'Intern'
        )
    ),
    salary REAL NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    is_active INTEGER NOT NULL DEFAULT 1
    CHECK (
        is_active IN (0,1)
        ),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (team_id) REFERENCES teams(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (manager_id) REFERENCES employees(id) ON UPDATE CASCADE ON DELETE SET NULL
);
INSERT INTO employees VALUES(1,'EMP-2026-001','Grace','Mwangi','grace@company.com','0711000001','31000001','A123450001X','HR Director','Admin',2,NULL,'Permanent',250000.0,'2023-01-02',NULL,1,'2026-07-28 17:04:00','2026-07-28 17:04:00');
INSERT INTO employees VALUES(2,'EMP-2026-002','David','Otieno','david@company.com','0711000002','31000002','A123450002X','Engineering Manager','Manager',1,1,'Permanent',180000.0,'2023-02-10',NULL,1,'2026-07-28 17:04:00','2026-07-28 17:04:00');
INSERT INTO employees VALUES(3,'EMP-2026-003','Mercy','Njeri','mercy@company.com','0711000003','31000003','A123450003X','Finance Manager','Manager',3,1,'Permanent',170000.0,'2023-03-01',NULL,1,'2026-07-28 17:04:00','2026-07-28 17:04:00');
INSERT INTO employees VALUES(4,'EMP-2026-004','Kevin','Kariuki','kevin@company.com','0711000004','31000004','A123450004X','Sales Manager','Manager',4,1,'Permanent',165000.0,'2023-03-15',NULL,1,'2026-07-28 17:04:00','2026-07-28 17:04:00');
INSERT INTO employees VALUES(5,'EMP-2026-005','Faith','Achieng','faith@company.com','0711000005','31000005','A123450005X','Operations Manager','Manager',5,1,'Permanent',160000.0,'2023-04-01',NULL,1,'2026-07-28 17:04:00','2026-07-28 17:04:00');
INSERT INTO employees VALUES(6,'EMP-2026-006','Brian','Maina','brian@company.com','0711000006','31000006','A123450006X','Senior Software Engineer','Employee',1,2,'Permanent',120000.0,'2024-01-08',NULL,1,'2026-07-28 17:04:00','2026-07-28 17:04:00');
INSERT INTO employees VALUES(7,'EMP-2026-007','Joy','Wambui','joy@company.com','0711000007','31000007','A123450007X','Software Engineer','Employee',1,2,'Permanent',95000.0,'2026-07-15',NULL,1,'2026-07-28 17:04:00','2026-07-28 17:04:00');
INSERT INTO employees VALUES(8,'EMP-2026-008','Dennis','Kibet','dennis@company.com','0711000008','31000008','A123450008X','QA Engineer','Employee',1,2,'Permanent',90000.0,'2024-05-12',NULL,1,'2026-07-28 17:04:00','2026-07-28 17:04:00');
INSERT INTO employees VALUES(9,'EMP-2026-009','Lydia','Chebet','lydia@company.com','0711000009','31000009','A123450009X','DevOps Engineer','Employee',1,2,'Contract',105000.0,'2025-02-20',NULL,1,'2026-07-28 17:04:00','2026-07-28 17:04:00');
INSERT INTO employees VALUES(10,'EMP-2026-010','Alice','Kimani','alice@company.com','0711000010','31000010','A123450010X','HR Officer','HR',2,1,'Permanent',80000.0,'2024-02-01',NULL,1,'2026-07-28 17:04:00','2026-07-28 17:04:00');
INSERT INTO employees VALUES(11,'EMP-2026-011','Peter','Mutua','peter@company.com','0711000011','31000011','A123450011X','Finance Officer','Employee',3,3,'Permanent',85000.0,'2024-01-10',NULL,1,'2026-07-28 17:04:00','2026-07-28 17:04:00');
INSERT INTO employees VALUES(12,'EMP-2026-012','Sharon','Atieno','sharon@company.com','0711000012','31000012','A123450012X','Marketing Officer','Employee',4,4,'Permanent',78000.0,'2025-06-01',NULL,1,'2026-07-28 17:04:00','2026-07-28 17:04:00');
INSERT INTO employees VALUES(13,'EMP-2026-013','James','Ouma','james@company.com','0711000013','31000013','A123450013X','Sales Executive','Employee',4,4,'Contract',70000.0,'2025-01-15',NULL,1,'2026-07-28 17:04:00','2026-07-28 17:04:00');
INSERT INTO employees VALUES(14,'EMP-2026-014','Nancy','Muli','nancy@company.com','0711000014','31000014','A123450014X','Operations Assistant','Employee',5,5,'Permanent',65000.0,'2024-09-01','2026-07-01',0,'2026-07-28 17:04:00','2026-07-28 17:04:00');
INSERT INTO employees VALUES(15,'EMP-2026-015','Ian','Mwenda','ian@company.com','0711000015','31000015','A123450015X','Software Intern','Employee',1,2,'Intern',25000.0,'2026-07-20',NULL,1,'2026-07-28 17:04:00','2026-07-28 17:04:00');
INSERT INTO employees VALUES(16,'PAY-LIFE-24000','Tax','Boundary24000','pay.life.24000@company.com','0799102400','99102400','PLIFE24000','Payroll Tester','Employee',3,3,'Permanent',24000.0,'2026-01-01',NULL,1,'2026-07-28 18:21:33','2026-07-28 18:21:33');
INSERT INTO employees VALUES(17,'PAY-LIFE-50000','Tax','Boundary50000','pay.life.50000@company.com','0799105000','99105000','PLIFE50000','Payroll Tester','Employee',3,3,'Permanent',50000.0,'2026-01-01','2026-07-28',0,'2026-07-28 18:23:06','2026-07-28 23:35:35');
INSERT INTO employees VALUES(18,'EMP-2026-50001','Gregory','Kago','gregorykago@gmail.com','0706622071','39933481','A123459999X','UI/UX Designer','Employee',1,2,'Permanent',50000.0,'2026-07-01',NULL,1,'2026-07-28 22:22:33','2026-07-28 23:41:53');
CREATE TABLE leave_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    leave_type TEXT NOT NULL CHECK (
    leave_type IN (
        'Annual',
        'Sick',
        'Maternity',
        'Paternity',
        'Compassionate',
        'Study',
        'Unpaid'
        )
    ),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'Pending'
    CHECK (
        status IN ('Pending','Approved','Rejected','Cancelled')
    ),
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
INSERT INTO leave_requests VALUES(1,6,'Annual','2026-07-07','2026-07-11','Annual vacation','Approved',2,'2026-07-01','Approved',5,'2026-07-28 17:04:00','2026-07-28 17:04:00','2026-07-28 17:04:00');
INSERT INTO leave_requests VALUES(2,8,'Sick','2026-07-14','2026-07-16','Medical leave','Approved',2,'2026-07-14','Get well soon',3,'2026-07-28 17:04:00','2026-07-28 17:04:00','2026-07-28 17:04:00');
INSERT INTO leave_requests VALUES(3,9,'Unpaid','2026-07-20','2026-07-22','Personal matters','Approved',2,'2026-07-10','Salary prorated',3,'2026-07-28 17:04:00','2026-07-28 17:04:00','2026-07-28 17:04:00');
INSERT INTO leave_requests VALUES(4,10,'Study','2026-08-03','2026-08-07','Professional certification','Pending',NULL,NULL,NULL,5,'2026-07-28 17:04:00','2026-07-28 17:04:00','2026-07-28 17:04:00');
INSERT INTO leave_requests VALUES(5,11,'Compassionate','2026-07-18','2026-07-20','Family bereavement','Approved',3,'2026-07-15','Approved',3,'2026-07-28 17:04:00','2026-07-28 17:04:00','2026-07-28 17:04:00');
INSERT INTO leave_requests VALUES(6,12,'Maternity','2026-09-01','2026-11-30','Maternity leave','Approved',4,'2026-08-15','Approved',91,'2026-07-28 17:04:00','2026-07-28 17:04:00','2026-07-28 17:04:00');
INSERT INTO leave_requests VALUES(7,13,'Paternity','2026-08-10','2026-08-16','Paternity leave','Approved',4,'2026-08-01','Congratulations',7,'2026-07-28 17:04:00','2026-07-28 17:04:00','2026-07-28 17:04:00');
INSERT INTO leave_requests VALUES(8,7,'Annual','2026-07-08','2026-07-12','Vacation','Pending',NULL,NULL,NULL,5,'2026-07-28 17:04:00','2026-07-28 17:04:00','2026-07-28 17:04:00');
INSERT INTO leave_requests VALUES(9,8,'Annual','2026-07-09','2026-07-13','Vacation','Approved',2,'2026-07-02','Approved',5,'2026-07-28 17:04:00','2026-07-28 17:04:00','2026-07-28 17:04:00');
INSERT INTO leave_requests VALUES(10,9,'Annual','2026-07-10','2026-07-14','Vacation','Rejected',2,'2026-07-03','Too many engineers away',5,'2026-07-28 17:04:00','2026-07-28 17:04:00','2026-07-28 17:04:00');
INSERT INTO leave_requests VALUES(11,15,'Study','2026-08-18','2026-08-19','University exams','Approved',2,'2026-08-01','Approved',2,'2026-07-28 17:04:00','2026-07-28 17:04:00','2026-07-28 17:04:00');
INSERT INTO leave_requests VALUES(12,6,'Annual','2026-09-15','2026-09-19','Future leave','Approved',2,'2026-08-20','Approved',5,'2026-07-28 17:04:00','2026-07-28 17:04:00','2026-07-28 17:04:00');
INSERT INTO leave_requests VALUES(13,18,'Unpaid','2026-08-10','2026-08-15','Family reasons','Rejected',1,'2026-07-28T23:25:59.986Z','under-staffed',6,'2026-07-28 22:56:27','2026-07-28 22:56:27','2026-07-28 23:25:59');
INSERT INTO leave_requests VALUES(14,1,'Unpaid','2026-08-10','2026-08-15','family matters','Approved',1,'2026-07-28T23:21:55.159Z','Approved from workforce dashboard',6,'2026-07-28 23:00:19','2026-07-28 23:00:19','2026-07-28 23:21:55');
INSERT INTO leave_requests VALUES(15,8,'Annual','2026-08-10','2026-08-16','Family','Approved',1,'2026-07-28T23:26:02.173Z','Approved from workforce dashboard',7,'2026-07-28 23:01:01','2026-07-28 23:01:01','2026-07-28 23:26:02');
INSERT INTO leave_requests VALUES(16,6,'Unpaid','2026-08-10','2026-08-14','yes','Rejected',1,'2026-07-28T23:22:53.871Z',unistr('department not approrpriately covered\u000a'),5,'2026-07-28 23:01:52','2026-07-28 23:01:52','2026-07-28 23:22:53');
INSERT INTO leave_requests VALUES(17,18,'Unpaid','2026-08-20','2026-08-25','family mattters','Approved',1,'2026-07-29T00:15:34.162Z','Approved from workforce dashboard',6,'2026-07-29 00:15:04','2026-07-29 00:15:04','2026-07-29 00:15:34');
INSERT INTO leave_requests VALUES(18,18,'Sick','2026-08-10','2026-08-14','sick','Pending',NULL,NULL,NULL,5,'2026-07-29 00:43:18','2026-07-29 00:43:18','2026-07-29 00:43:18');
CREATE TABLE payroll (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    pay_period TEXT NOT NULL,
    basic_salary REAL NOT NULL,
    unpaid_leave_days INTEGER NOT NULL DEFAULT 0,
    unpaid_leave_deduction REAL NOT NULL DEFAULT 0,
    gross_pay REAL NOT NULL,
    tax_deduction REAL NOT NULL DEFAULT 0,
    social_security_deduction REAL NOT NULL DEFAULT 0,
    other_deductions REAL NOT NULL DEFAULT 0,
    net_pay REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'Draft'
    CHECK (
        status IN (
            'Draft',
            'Finalized',
            'Paid'
        )
    ),
    generated_by INTEGER,
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
INSERT INTO payroll VALUES(1,6,'2026-06',120000.0,0,0.0,120000.0,12000.0,6000.0,0.0,102000.0,'Paid',3,'2026-07-28 17:04:00','2026-07-28 17:04:00','2026-07-28 17:04:00');
INSERT INTO payroll VALUES(2,6,'2026-07',120000.0,0,0.0,120000.0,12000.0,6000.0,5000.0,97000.0,'Finalized',3,'2026-07-28 17:04:00','2026-07-28 17:04:00','2026-07-28 17:04:00');
INSERT INTO payroll VALUES(3,7,'2026-07',95000.0,0,0.0,50645.0,5000.0,2500.0,0.0,43145.0,'Finalized',1,'2026-07-28 17:04:00','2026-07-28 17:04:00','2026-07-29 00:02:54');
INSERT INTO payroll VALUES(4,8,'2026-07',90000.0,0,0.0,90000.0,9000.0,4500.0,0.0,76500.0,'Paid',3,'2026-07-28 17:04:00','2026-07-28 17:04:00','2026-07-28 17:04:00');
INSERT INTO payroll VALUES(5,9,'2026-07',105000.0,3,10500.0,94500.0,9450.0,4725.0,0.0,80325.0,'Paid',3,'2026-07-28 17:04:00','2026-07-28 17:04:00','2026-07-28 17:04:00');
INSERT INTO payroll VALUES(6,11,'2026-07',85000.0,0,0.0,85000.0,8500.0,4250.0,1500.0,70750.0,'Paid',3,'2026-07-28 17:04:00','2026-07-28 17:04:00','2026-07-28 17:04:00');
INSERT INTO payroll VALUES(7,13,'2026-07',70000.0,0,0.0,70000.0,7000.0,3500.0,0.0,59500.0,'Paid',3,'2026-07-28 17:04:00','2026-07-28 17:04:00','2026-07-28 17:04:00');
INSERT INTO payroll VALUES(8,15,'2026-07',25000.0,0,0.0,10000.0,0.0,0.0,0.0,10000.0,'Finalized',1,'2026-07-28 17:04:00','2026-07-28 17:04:00','2026-07-29 00:02:54');
INSERT INTO payroll VALUES(9,1,'2026-08',250000.0,6,50000.0,200000.0,42600.0,6000.0,0.0,151400.0,'Draft',1,'2026-07-28 23:43:39','2026-07-28 23:43:39','2026-07-29 00:28:04');
INSERT INTO payroll VALUES(10,2,'2026-08',180000.0,0,0.0,180000.0,36600.0,6000.0,0.0,137400.0,'Draft',1,'2026-07-28 23:43:39','2026-07-28 23:43:39','2026-07-29 00:28:04');
INSERT INTO payroll VALUES(11,3,'2026-08',170000.0,0,0.0,170000.0,33600.0,6000.0,0.0,130400.0,'Draft',1,'2026-07-28 23:43:39','2026-07-28 23:43:39','2026-07-29 00:28:04');
INSERT INTO payroll VALUES(12,4,'2026-08',165000.0,0,0.0,165000.0,32100.0,6000.0,0.0,126900.0,'Draft',1,'2026-07-28 23:43:39','2026-07-28 23:43:39','2026-07-29 00:28:04');
INSERT INTO payroll VALUES(13,5,'2026-08',160000.0,0,0.0,160000.0,30600.0,6000.0,0.0,123400.0,'Draft',1,'2026-07-28 23:43:39','2026-07-28 23:43:39','2026-07-29 00:28:04');
INSERT INTO payroll VALUES(14,6,'2026-08',120000.0,0,0.0,120000.0,18600.0,6000.0,0.0,95400.0,'Draft',1,'2026-07-28 23:43:39','2026-07-28 23:43:39','2026-07-29 00:28:04');
INSERT INTO payroll VALUES(15,7,'2026-08',95000.0,0,0.0,95000.0,11600.0,4750.0,0.0,78650.0,'Draft',1,'2026-07-28 23:43:39','2026-07-28 23:43:39','2026-07-29 00:28:04');
INSERT INTO payroll VALUES(16,8,'2026-08',90000.0,0,0.0,90000.0,10600.0,4500.0,0.0,74900.0,'Draft',1,'2026-07-28 23:43:39','2026-07-28 23:43:39','2026-07-29 00:28:04');
INSERT INTO payroll VALUES(17,9,'2026-08',105000.0,0,0.0,105000.0,14100.0,5250.0,0.0,85650.0,'Draft',1,'2026-07-28 23:43:39','2026-07-28 23:43:39','2026-07-29 00:28:04');
INSERT INTO payroll VALUES(18,10,'2026-08',80000.0,0,0.0,80000.0,8600.0,4000.0,0.0,67400.0,'Draft',1,'2026-07-28 23:43:39','2026-07-28 23:43:39','2026-07-29 00:28:04');
INSERT INTO payroll VALUES(19,11,'2026-08',85000.0,0,0.0,85000.0,9600.0,4250.0,0.0,71150.0,'Draft',1,'2026-07-28 23:43:39','2026-07-28 23:43:39','2026-07-29 00:28:04');
INSERT INTO payroll VALUES(20,12,'2026-08',78000.0,0,0.0,78000.0,8200.0,3900.0,0.0,65900.0,'Draft',1,'2026-07-28 23:43:39','2026-07-28 23:43:39','2026-07-29 00:28:04');
INSERT INTO payroll VALUES(21,13,'2026-08',70000.0,0,0.0,70000.0,6600.0,3500.0,0.0,59900.0,'Draft',1,'2026-07-28 23:43:39','2026-07-28 23:43:39','2026-07-29 00:28:04');
INSERT INTO payroll VALUES(22,15,'2026-08',25000.0,0,0.0,25000.0,100.0,1250.0,0.0,23650.0,'Draft',1,'2026-07-28 23:43:39','2026-07-28 23:43:39','2026-07-29 00:28:04');
INSERT INTO payroll VALUES(23,16,'2026-08',24000.0,0,0.0,24000.0,0.0,1200.0,0.0,22800.0,'Draft',1,'2026-07-28 23:43:39','2026-07-28 23:43:39','2026-07-29 00:28:04');
INSERT INTO payroll VALUES(24,18,'2026-08',50000.0,0,10000.0,40000.0,1600.0,2000.0,0.0,36400.0,'Draft',1,'2026-07-28 23:43:39','2026-07-28 23:43:39','2026-07-29 00:28:04');
INSERT INTO sqlite_sequence VALUES('teams',5);
INSERT INTO sqlite_sequence VALUES('employees',18);
INSERT INTO sqlite_sequence VALUES('leave_requests',18);
INSERT INTO sqlite_sequence VALUES('payroll',24);
COMMIT;
