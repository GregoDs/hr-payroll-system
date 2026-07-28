-- seed.sql
PRAGMA foreign_keys = ON;

-- =========================
-- TEAMS
-- =========================
INSERT INTO teams (id,name,description) VALUES
(1,'Engineering','Software development and infrastructure'),
(2,'Human Resources','People operations'),
(3,'Finance','Payroll and finance'),
(4,'Sales & Marketing','Sales and marketing'),
(5,'Operations','Business operations');

-- =========================
-- EMPLOYEES
-- =========================
INSERT INTO employees
(id,employee_code,first_name,last_name,email,phone_number,national_id,kra_pin,role_title,system_role,team_id,manager_id,employment_type,salary,start_date,end_date,is_active)
VALUES
(1,'EMP-2026-001','Grace','Mwangi','grace@company.com','0711000001','31000001','A123450001X','HR Manager','Admin',2,NULL,'Permanent',250000,'2023-01-02',NULL,1),
(2,'EMP-2026-002','David','Otieno','david@company.com','0711000002','31000002','A123450002X','Engineering Manager','Manager',1,1,'Permanent',180000,'2023-02-10',NULL,1),
(3,'EMP-2026-003','Mercy','Njeri','mercy@company.com','0711000003','31000003','A123450003X','Finance Manager','Manager',3,1,'Permanent',170000,'2023-03-01',NULL,1),
(4,'EMP-2026-004','Kevin','Kariuki','kevin@company.com','0711000004','31000004','A123450004X','Sales Manager','Manager',4,1,'Permanent',165000,'2023-03-15',NULL,1),
(5,'EMP-2026-005','Faith','Achieng','faith@company.com','0711000005','31000005','A123450005X','Operations Manager','Manager',5,1,'Permanent',160000,'2023-04-01',NULL,1),
(6,'EMP-2026-006','Brian','Maina','brian@company.com','0711000006','31000006','A123450006X','Senior Software Engineer','Employee',1,2,'Permanent',120000,'2024-01-08',NULL,1),
(7,'EMP-2026-007','Joy','Wambui','joy@company.com','0711000007','31000007','A123450007X','Software Engineer','Employee',1,2,'Permanent',95000,'2026-07-15',NULL,1),
(8,'EMP-2026-008','Dennis','Kibet','dennis@company.com','0711000008','31000008','A123450008X','QA Engineer','Employee',1,2,'Permanent',90000,'2024-05-12',NULL,1),
(9,'EMP-2026-009','Lydia','Chebet','lydia@company.com','0711000009','31000009','A123450009X','DevOps Engineer','Employee',1,2,'Contract',105000,'2025-02-20',NULL,1),
(10,'EMP-2026-010','Alice','Kimani','alice@company.com','0711000010','31000010','A123450010X','HR Officer','HR',2,1,'Permanent',80000,'2024-02-01',NULL,1),
(11,'EMP-2026-011','Peter','Mutua','peter@company.com','0711000011','31000011','A123450011X','Finance Officer','Employee',3,3,'Permanent',85000,'2024-01-10',NULL,1),
(12,'EMP-2026-012','Sharon','Atieno','sharon@company.com','0711000012','31000012','A123450012X','Marketing Officer','Employee',4,4,'Permanent',78000,'2025-06-01',NULL,1),
(13,'EMP-2026-013','James','Ouma','james@company.com','0711000013','31000013','A123450013X','Sales Executive','Employee',4,4,'Contract',70000,'2025-01-15',NULL,1),
(14,'EMP-2026-014','Nancy','Muli','nancy@company.com','0711000014','31000014','A123450014X','Operations Assistant','Employee',5,5,'Permanent',65000,'2024-09-01','2026-07-01',0),
(15,'EMP-2026-015','Ian','Mwenda','ian@company.com','0711000015','31000015','A123450015X','Software Intern','Employee',1,2,'Intern',25000,'2026-07-20',NULL,1);

-- =========================
-- LEAVE REQUESTS
-- =========================
INSERT INTO leave_requests
(employee_id,leave_type,start_date,end_date,reason,status,approved_by,approved_at,manager_comment,total_days)
VALUES
(6,'Annual','2026-07-07','2026-07-11','Annual vacation','Approved',2,'2026-07-01','Approved',5),
(8,'Sick','2026-07-14','2026-07-16','Medical leave','Approved',2,'2026-07-14','Get well soon',3),
(9,'Unpaid','2026-07-20','2026-07-22','Personal matters','Approved',2,'2026-07-10','Salary prorated',3),
(10,'Study','2026-08-03','2026-08-07','Professional certification','Pending',NULL,NULL,NULL,5),
(11,'Compassionate','2026-07-18','2026-07-20','Family bereavement','Approved',3,'2026-07-15','Approved',3),
(12,'Maternity','2026-09-01','2026-11-30','Maternity leave','Approved',4,'2026-08-15','Approved',91),
(13,'Paternity','2026-08-10','2026-08-16','Paternity leave','Approved',4,'2026-08-01','Congratulations',7),
(7,'Annual','2026-07-08','2026-07-12','Vacation','Pending',NULL,NULL,NULL,5),
(8,'Annual','2026-07-09','2026-07-13','Vacation','Approved',2,'2026-07-02','Approved',5),
(9,'Annual','2026-07-10','2026-07-14','Vacation','Rejected',2,'2026-07-03','Too many engineers away',5),
(15,'Study','2026-08-18','2026-08-19','University exams','Approved',2,'2026-08-01','Approved',2),
(6,'Annual','2026-09-15','2026-09-19','Future leave','Approved',2,'2026-08-20','Approved',5);

-- =========================
-- PAYROLL
-- =========================
INSERT INTO payroll
(employee_id,pay_period,basic_salary,unpaid_leave_days,unpaid_leave_deduction,gross_pay,tax_deduction,social_security_deduction,other_deductions,net_pay,status,generated_by)
VALUES
(6,'2026-06',120000,0,0,120000,12000,6000,0,102000,'Paid',3),
(6,'2026-07',120000,0,0,120000,12000,6000,5000,97000,'Finalized',3),
(7,'2026-07',95000,0,0,50645,5000,2500,0,43145,'Draft',3),
(8,'2026-07',90000,0,0,90000,9000,4500,0,76500,'Paid',3),
(9,'2026-07',105000,3,10500,94500,9450,4725,0,80325,'Paid',3),
(11,'2026-07',85000,0,0,85000,8500,4250,1500,70750,'Paid',3),
(13,'2026-07',70000,0,0,70000,7000,3500,0,59500,'Paid',3),
(15,'2026-07',25000,0,0,10000,0,0,0,10000,'Draft',3);
