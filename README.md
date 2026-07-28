# HR & Payroll Management System

Software Engineering Practical Test submission for Vunoh Global Services.

## Tech Stack

- Backend: Express.js
- Frontend: HTML, CSS, Vanilla JavaScript
- Database: SQLite

## Planned Features

- Employee Records
- Leave Management
- Payroll Processing

Development is being completed incrementally with meaningful commits across the project timeline.

Just made the project structure as start to the project.

Future improvement: payroll adjustment workflow for correcting underpayments and overpayments.


##Business rules for leave 

✔ No overlapping leave

✔ Cannot approve own leave

✔ Cannot request leave in the past

✔ End date >= Start date

✔ Only pending requests can be approved

✔ Team coverage limit

✔ Minimum notice period

✔ Unpaid leave reduces salary


## Payroll assumptions

- Payroll is generated once per employee per month using `pay_period` in `YYYY-MM` format.
- Payroll lifecycle is `Draft -> Finalized -> Paid`.
- Generated payroll starts as `Draft` so HR/Finance can review calculations before employees see payslips.
- Draft payroll is visible through internal payroll review endpoints, but payslips are only available after payroll is `Finalized` or `Paid`.
- Employee payroll history only returns `Finalized` and `Paid` records.
- Payroll can only be finalized from `Draft`; already finalized or paid records cannot be finalized again.
- Payroll generation includes only active employees whose start date is on or before the last day of the pay period.
- Payroll records are stored as history snapshots. They should not be deleted because employee salary, leave, or active status may change later.
- Monthly salary is prorated for mid-month joiners using a fixed 30-day payroll month.
- Only approved leave requests with `leave_type = 'Unpaid'` reduce payroll.
- Unpaid leave deduction is calculated as `monthly salary / 30 * approved unpaid leave days overlapping the pay period`.
- Gross pay is prorated salary minus unpaid leave deduction.
- Tax is calculated using simple brackets on gross pay:
  - 0% on the first 24,000
  - 10% on income above 24,000 up to 50,000
  - 20% on income above 50,000 up to 100,000
  - 30% on income above 100,000
- Social security is calculated as 5% of gross pay, capped at 6,000.
- Other deductions default to 0 in the current implementation.
- Net pay is `gross pay - tax - social security - other deductions`.
- Until authentication is connected to payroll generation, records generated through `POST /api/payroll/generate` use employee ID `1` as the system generator fallback.
