# PeopleOps HR & Payroll

Software Engineering Practical Test submission for Vunoh Global Services.

The repository contains an Express/SQLite backend and a framework-free frontend built with semantic HTML, plain CSS and vanilla JavaScript. The frontend currently runs against an isolated in-memory dummy-data adapter so it can be reviewed before backend integration.

## What was prioritized

The current frontend prioritizes the operational paths that carry the most risk:

- Employee records, search, filtering, editing, reporting structure and reversible deactivation
- Leave submission and manager decisions with visible coverage, notice, overlap and balance checks
- Leave balances, weekly absence visibility and aging/escalation indicators
- Monthly payroll generation, mid-month proration, unpaid-leave adjustments, progressive tax, social security and payslip review
- Keyboard navigation, focus-managed dialogs, reduced-motion support and responsive layouts
- A low-glare warm light theme by default, with a restrained dark theme remembered per browser

Mock changes intentionally last only for the current page session. Refreshing restores the fixture in `frontend/data/dummy-data.js`.

## Frontend structure

The frontend is still a vanilla JavaScript single-page app, but the files are now separated by responsibility:

- `frontend/index.html` is the application shell: sidebar, modal layer, toast region and the page outlet.
- `frontend/pages/*.html` contains the readable page markup for dashboard, employees, leave, payroll and reports.
- `frontend/css/main.css` only imports the real CSS files from `base`, `components` and `pages`.
- `frontend/js/pages/*.js` is the page registry that tells the app which HTML partials to load.
- `frontend/js/app.js` owns shared state, rendering, forms and interactions while the backend is still deferred.

## Run the frontend

No dependency installation or build step is required. From the repository root, start any static file server. This is required because the app loads page partials from `frontend/pages/*.html`.

```bash
python3 -m http.server 5500 --directory frontend
```

Then open:

```text
http://localhost:5500
```

Alternatively, use a VS Code Live Server extension and serve the `frontend` directory. Do not open the HTML through `file://`; browsers commonly block the JavaScript module and partial-loading requests from local files.

## Run the frontend tests

Node.js 18 or newer is required:

```bash
cd frontend
npm test
```

The tests use Node's built-in test runner and require no downloaded packages.

## Backend

The existing backend is not required for the current mock-first frontend. To run it separately:

```bash
cd backend
npm install
node src/server.js
```

Its API base is `http://localhost:3000/api`, with employee, leave and payroll routes. Connecting the frontend adapter to those routes is intentionally deferred.

## Leave safeguards and thresholds

The mock workflow applies client-side operational checks:

- Annual allowance: 21 calendar days
- Standard minimum notice: 7 calendar days
- Maternity and paternity notice: 14 calendar days
- Sick and compassionate leave notice: 0 days
- Team coverage: at most one approved colleague from a team away during the same dates
- Pending escalation: requests waiting 3 or more days are marked for escalation
- Active pending/approved requests cannot overlap for the same employee
- Only pending requests can be approved or rejected
- Inactive employees cannot have leave approved
- Annual requests cannot exceed remaining balance
- End date must be on or after start date

Frontend checks provide early feedback only. The backend must remain authoritative once integration is enabled.

## Payroll formula and assumptions

Currency is KES and values are formatted with `Intl.NumberFormat("en-KE")`.

1. Monthly payroll uses a fixed 30-day denominator.
2. `daily rate = monthly basic salary / 30`
3. Mid-month joiner pay is the daily rate multiplied by eligible calendar days, capped at 30.
4. Only approved unpaid leave overlapping the selected pay period is deducted.
5. `gross pay = prorated salary - unpaid leave deduction`, never below zero.
6. Tax is progressive:
   - 0% on the first KSh 24,000
   - 10% above KSh 24,000 through KSh 50,000
   - 20% above KSh 50,000 through KSh 100,000
   - 30% above KSh 100,000
7. Social security is 5% of gross pay, capped at KSh 6,000.
8. `net pay = gross pay - tax - social security - other deductions`, never below zero.
9. Other deductions currently default to zero.
10. Duplicate payroll generation for the same month is blocked.
11. Historical payroll remains visible even if an employee later becomes inactive.

Automated cases cover zero tax, exact tax-bracket boundaries, the social-security cap, mid-month joining and approved unpaid leave.

## Known limitations

- Data is in-memory and resets on refresh.
- Authentication and role permissions are represented visually but not enforced.
- Calendar-day leave calculations do not yet exclude weekends or public holidays.
- Leave allowances are currently a single annual default rather than per-type accrual records.
- Team coverage uses a fixed threshold instead of configurable team staffing requirements.
- Payroll records can be generated and reviewed in mock mode, but the complete draft/finalized/paid transition controls are not yet exposed.
- The Google Fonts import requires a network connection; the system font fallbacks remain usable offline.

## With more time

- Connect the isolated store interface to the existing Express endpoints and make server rules authoritative
- Add persisted leave-balance and team configuration tables
- Add public-holiday-aware working-day calculations
- Add authentication, role permissions and audit history
- Add payroll adjustments for underpayments and overpayments
- Add end-to-end browser tests for keyboard, mobile and decision workflows
