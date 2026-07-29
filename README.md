# HR & Payroll System

Small HR and payroll system for the Software Engineer Practical Test.

The app covers employee records, leave approvals and monthly payroll. I focused on making the core business rules work properly instead of only building CRUD screens.

Repository: <https://github.com/GregoDs/hr-payroll-system>

## Live demo

- Frontend: <https://hr-payroll-system-snowy.vercel.app>
- Backend API: <https://hr-payroll-api-ke4e.onrender.com>
- API health check: <https://hr-payroll-api-ke4e.onrender.com/api/health>

The frontend is hosted on Vercel. API requests from the frontend are proxied through Vercel from `/api/*` to the Render backend.

The backend is hosted on Render. It uses SQLite with the committed sample database for the demo. On Render's free environment, runtime data changes are not guaranteed to persist after restarts or redeploys.

## Stack

- Backend: Express
- Frontend: HTML, CSS, vanilla JavaScript
- Database: SQLite
- Tests: Node test runner

## Screenshots

Screenshots are in `assets/screenshots`.

![Screenshot 1](assets/screenshots/Screenshot%202026-07-29%20at%2004.10.28.png)

![Screenshot 2](assets/screenshots/Screenshot%202026-07-29%20at%2004.10.48.png)

![Screenshot 3](assets/screenshots/Screenshot%202026-07-29%20at%2004.11.17.png)

## How to run locally

Clone the repo:

```bash
git clone https://github.com/GregoDs/hr-payroll-system.git
cd hr-payroll-system
```

Install and start the backend:

```bash
cd backend
npm install
npm run db:init
npm run db:seed
npm run dev
```

The backend runs on:

```text
http://localhost:3000
```

In a second terminal, start the frontend from the project root:

```bash
cd hr-payroll-system
python3 -m http.server 5500 --directory frontend
```

Open:

```text
http://localhost:5500
```

When the frontend is served from `localhost`, API requests automatically go to:

```text
http://localhost:3000/api
```

On Vercel, the same frontend uses `/api` and Vercel proxies those requests to the hosted Render API.

Do not open the frontend directly with `file://`, because browser module loading can fail.

## Demo accounts

The login page has demo account buttons. Select one and it fills the email and password.

Password for demo users:

```text
12345
```

| User | Email | Use case |
| --- | --- | --- |
| Grace Mwangi | `grace@company.com` | Admin access |
| Alice Kimani | `alice@company.com` | HR workflows |
| Brian Maina | `brian@company.com` | Employee view |

## SQL dump

The SQL dump is committed here:

```text
backend/src/database/hr_payroll_dump.sql
```

It contains the schema and sample data:

- teams
- employees
- leave requests
- generated payroll records

To recreate the SQLite database from the dump:

```bash
sqlite3 backend/src/database/hr_payroll.db < backend/src/database/hr_payroll_dump.sql
```

The normal local setup can also use:

```bash
cd backend
npm run db:init
npm run db:seed
```

To regenerate the dump after changing local data:

```bash
sqlite3 backend/src/database/hr_payroll.db .dump > backend/src/database/hr_payroll_dump.sql
```

## Main features

### Employee records

- Add and edit employees.
- Store team, manager, role, start date, salary and employment type.
- Show reporting lines.
- Deactivate employees instead of deleting them.
- Inactive employees keep their old records and payroll history.
- Inactive employees cannot log in.

The manager and team fields are linked. A manager belongs to one team, so the app prevents assigning an employee to a manager from a different team.

### Leave management

Employees can request leave. HR/admin users can approve or reject requests.

Rules implemented:

- Annual leave allowance is 21 days.
- Annual, unpaid and normal planned leave require 7 days notice.
- Maternity and paternity require 14 days notice.
- Sick and compassionate leave require no notice.
- An employee cannot have overlapping pending or approved leave.
- Ordinary leave is blocked if another person in the same team is already away for those dates.
- Sick leave can still be submitted as an emergency, but it still counts as someone being away when checking later planned leave.
- Pending requests older than 3 days are treated as needing attention.

This was mainly to handle team coverage, duplicate requests, short-notice leave and requests sitting too long.

### Payroll

HR/admin users can generate payroll for a month. Payroll starts as draft, then can be finalized.

Rules implemented:

- Payroll can only be generated once per period.
- Draft payroll can be refreshed if leave or salary data changes before finalization.
- Basic salary can be edited while payroll is still draft.
- Finalized payroll cannot be edited.
- Employee payslips are only available after payroll is finalized.
- Approved unpaid leave reduces gross pay.
- Mid-month joiners are prorated.

## Payroll formula

The formula is simple and documented. It is not meant to match a specific country's tax law.

```text
Payroll days per month = 30
Daily rate = Basic salary / 30
Unpaid leave deduction = Daily rate * approved unpaid leave days
Gross pay = prorated salary - unpaid leave deduction
```

Tax brackets:

| Gross pay band | Rate |
| --- | ---: |
| 0 - 24,000 | 0% |
| Over 24,000 - 50,000 | 10% |
| Over 50,000 - 100,000 | 20% |
| Over 100,000 | 30% |

Other deductions:

```text
Social security = 5% of gross pay, capped at 6,000
Net pay = gross pay - tax - social security
```

Example for salary `50,000` with `6` unpaid leave days:

```text
Daily rate = 50,000 / 30 = 1,666.67
Unpaid leave deduction = 1,666.67 * 6 = 10,000
Gross pay = 40,000
Tax = 1,600
Social security = 2,000
Net pay = 36,400
```

## Tests

Run frontend tests:

```bash
npm --prefix frontend test
```

Run backend tests:

```bash
npm --prefix backend test
```

The tests focus on the main business logic:

- leave notice rules
- leave overlap checks
- team coverage checks
- sick leave exception
- annual leave balance
- payroll tax brackets
- social security cap
- mid-month proration
- unpaid leave payroll deduction

## What I prioritized

I prioritized:

1. Employee records and deactivation.
2. Leave rules that prevent obvious operational problems.
3. Payroll calculations that are tied to leave.
4. Draft payroll review before finalizing payslips.
5. A frontend that consumes the backend instead of mock data.

## What I would improve with more time

- Add proper production authentication.
- Add stricter backend role-based authorization.
- Add audit logs for salary changes and payroll finalization.
- Add working-day calendars and public holidays.
- Add end-to-end browser tests.
- Move the hosted backend from SQLite to a persistent managed database such as PostgreSQL.

## Submission files

- Source code: full repo
- SQL dump: `backend/src/database/hr_payroll_dump.sql`
- Screenshots: `assets/screenshots`
- README: this file
- Live frontend: <https://hr-payroll-system-snowy.vercel.app>
- Live backend API: <https://hr-payroll-api-ke4e.onrender.com>
