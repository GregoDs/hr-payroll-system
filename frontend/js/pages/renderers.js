import { formatCurrency, formatDate, formatPeriod, pluralize } from "../utils/format.js";
import {
  leaveBalance,
  minimumNoticeDays,
  noticeDays,
  teamAbsencesDuring,
  MAX_TEAM_ABSENCES,
  ESCALATION_DAYS,
} from "../domain/leave-rules.js";
import { $, escapeHtml, icons, icon, rowNumber, nameOf } from "../ui/presentation.js";

export function createPageRenderers({ app, today, currentEmployee, isHrUser, openLeaveForm }) {
  function statusClass(status) {
    return `status status--${status.toLowerCase()}`;
  }

  function waitingDays(request) {
    const submitted = new Date(`${request.submitted_at.slice(0, 10)}T00:00:00Z`);
    const current = new Date(`${today}T00:00:00Z`);
    return Math.max(Math.floor((current - submitted) / 86400000), 0);
  }

  function approvalMeta(request) {
    const balance = leaveBalance(request.employee_id, app.data.leaveRequests);
    const absences = teamAbsencesDuring(request, app.data.leaveRequests, app.data.employees);
    const notice = noticeDays(request.start_date, today);
    const minimum = minimumNoticeDays(request.leave_type);
    return { balance, absences, notice, minimum, waiting: waitingDays(request) };
  }

  function renderKpis() {
    const activeEmployees = app.data.employees.filter((employee) => employee.is_active).length;
    const pending = app.data.leaveRequests.filter((request) => request.status === "Pending").length;
    const outToday = app.data.leaveRequests.filter((request) =>
      request.status === "Approved" && request.start_date <= today && request.end_date >= today).length;
    const periodRecords = app.data.payrollRecords.filter((record) => record.pay_period === app.payrollPeriod);
    const netTotal = periodRecords.reduce((sum, record) => sum + record.net_pay, 0);
    const metrics = [
      { id: "active", label: "Active employees", value: activeEmployees, meta: `${app.data.teams.length} operating teams`, view: "employees", icon: "users" },
      { id: "pending", label: "Pending approvals", value: pending, meta: pending ? "Decision required" : "Queue is clear", view: "leave", icon: "clock" },
      { id: "out", label: "Out today", value: outToday, meta: outToday ? "Coverage monitored" : "Full coverage", view: "leave", icon: "calendar" },
      { id: "payroll", label: "Current payroll", value: formatCurrency(netTotal), meta: `${periodRecords.length} employees · ${formatPeriod(app.payrollPeriod)}`, view: "payroll", icon: "banknote" },
    ];
    $("#kpi-grid").innerHTML = metrics.map((metric) => `
      <button class="kpi ${app.selectedMetric === metric.id ? "is-selected" : ""}" type="button" data-kpi="${metric.id}" data-go-view="${metric.view}">
        <span class="kpi__top">
          ${icon(metric.icon)}
          <span class="kpi__label">${metric.label}</span>
        </span>
        <strong class="kpi__value">${escapeHtml(metric.value)}</strong>
        <span class="kpi__meta">${escapeHtml(metric.meta)}</span>
      </button>`).join("");
  }

  function myLeaveRequests() {
    const employee = currentEmployee();
    return app.data.leaveRequests.filter((request) => request.employee_id === employee?.id);
  }

  function myPayslips() {
    const employee = currentEmployee();
    return app.data.payrollRecords.filter((record) => record.employee_id === employee?.id);
  }

  function renderEmployeeDashboard() {
    const employee = currentEmployee();
    const manager = app.data.employees.find((person) => person.id === employee.manager_id);
    const balance = leaveBalance(employee.id, app.data.leaveRequests);
    const requests = myLeaveRequests();
    const upcoming = requests.filter((request) => ["Pending", "Approved"].includes(request.status) && request.start_date >= today);
    const payslips = myPayslips();
    const latestPayslip = payslips[0];
    const notifications = [
      upcoming.length ? `${upcoming.length} upcoming or pending leave request${upcoming.length === 1 ? "" : "s"}.` : "No upcoming leave is currently scheduled.",
      latestPayslip ? `Latest payslip: ${formatPeriod(latestPayslip.pay_period)} · ${formatCurrency(latestPayslip.net_pay)} net.` : "No payslip has been generated yet.",
      manager ? `Your manager is ${nameOf(manager)}.` : "No manager is assigned to your profile.",
    ];

    $("#overview").innerHTML = `
      <header class="page-header">
        <div>
          <p class="eyebrow accent-text">${icon("users")}Employee Dashboard</p>
          <h1 id="overview-title">Welcome back,<br>${escapeHtml(employee.first_name)}</h1>
          <p class="page-intro">Your leave, payslips, manager and employment record in one place.</p>
        </div>
        <div class="live-state">${icon("clock")}<span>Updated today</span></div>
      </header>

      <div class="kpi-grid" aria-label="Employee summary">
        <button class="kpi" type="button" data-go-view="leave">
          <span class="kpi__top">${icon("shield")}<span class="kpi__label">My Leave Balance</span></span>
          <strong class="kpi__value">${balance.remaining}</strong>
          <span class="kpi__meta">${balance.used} used · ${balance.pending} pending · ${balance.allowance} allowance</span>
        </button>
        <button class="kpi" type="button" data-go-view="leave">
          <span class="kpi__top">${icon("calendar")}<span class="kpi__label">My Leave Requests</span></span>
          <strong class="kpi__value">${requests.length}</strong>
          <span class="kpi__meta">${requests.filter((request) => request.status === "Pending").length} pending review</span>
        </button>
        <button class="kpi" type="button" data-go-view="payslip">
          <span class="kpi__top">${icon("receipt")}<span class="kpi__label">My Payslips</span></span>
          <strong class="kpi__value">${payslips.length}</strong>
          <span class="kpi__meta">${latestPayslip ? `${formatPeriod(latestPayslip.pay_period)} available` : "No payslip yet"}</span>
        </button>
        <button class="kpi" type="button" data-go-view="profile">
          <span class="kpi__top">${icon("briefcase")}<span class="kpi__label">Employment Details</span></span>
          <strong class="kpi__value">${escapeHtml(employee.employment_type)}</strong>
          <span class="kpi__meta">${escapeHtml(employee.role_title)}</span>
        </button>
      </div>

      <div class="employee-action-strip" aria-label="Quick actions">
        <button class="button button--primary" type="button" id="employee-request-leave">${icon("plus")}Request Leave</button>
        <button class="button" type="button" data-go-view="payslip">${icon("receipt")}View Payslip</button>
        <button class="button" type="button" data-go-view="profile">${icon("edit")}Update Profile</button>
      </div>

      <div class="split-grid">
        <section class="section-block">
          <div class="section-heading">
            <div><p class="eyebrow">${icon("calendar")}My Upcoming Leave</p><h2>Upcoming leave</h2></div>
          </div>
          <div>${upcoming.length ? upcoming.map((request, index) => `
            <div class="out-row clickable-row" data-leave-row="${request.id}" tabindex="0" role="button">
              ${rowNumber(index)}
              <div><strong>${icon("calendar")}${escapeHtml(request.leave_type)}</strong><p>${formatDate(request.start_date)} - ${formatDate(request.end_date)} · ${escapeHtml(request.status)}</p></div>
              <div class="out-row__date">${pluralize(request.total_days, "day")}</div>
            </div>`).join("") : `<div class="empty-state">${icon("calendar")}<strong>No upcoming leave</strong><span>Request leave when you need time away.</span></div>`}</div>
        </section>

        <section class="section-block">
          <div class="section-heading">
            <div><p class="eyebrow">${icon("org")}Manager and team</p><h2>Reporting line</h2></div>
          </div>
          <div class="profile-grid profile-grid--compact">
            <div class="profile-card"><span>My Manager</span><strong>${manager ? escapeHtml(nameOf(manager)) : "Unassigned"}</strong><em>${manager ? escapeHtml(manager.role_title) : "No manager assigned"}</em></div>
            <div class="profile-card"><span>Team</span><strong>${escapeHtml(employee.team_name)}</strong><em>${escapeHtml(employee.role_title)}</em></div>
          </div>
        </section>
      </div>

      <section class="section-block">
        <div class="section-heading">
          <div><p class="eyebrow">${icon("alert")}Recent Notifications</p><h2>Recent notifications</h2></div>
        </div>
        <div class="notification-list">
          ${notifications.map((item, index) => `<div class="notification-row">${rowNumber(index)}${icon("check")}<span>${escapeHtml(item)}</span></div>`).join("")}
        </div>
      </section>`;

    $("#employee-request-leave").addEventListener("click", openLeaveForm);
  }

  function renderApprovalQueue() {
    const pending = app.data.leaveRequests.filter((request) => request.status === "Pending");
    $("#approval-title").textContent = `Pending leave approvals · ${pending.length}`;
    if (!pending.length) {
      $("#approval-list").innerHTML = `<div class="empty-state">${icon("check")}<strong>No decisions waiting</strong><span>New leave requests will appear here.</span></div>`;
      $("#approval-list").setAttribute("aria-busy", "false");
      return;
    }
    $("#approval-list").innerHTML = pending.map((request, index) => {
      const meta = approvalMeta(request);
      const coverage = coverageMeta(request);
      const noticeHealthy = meta.notice >= meta.minimum;
      const balanceHealthy = request.leave_type !== "Annual" || request.total_days <= meta.balance.remaining;
      return `
        <article class="approval-row" data-leave-id="${request.id}">
          ${rowNumber(index)}
          <div class="approval-person">
            <strong>${escapeHtml(request.employee_name)}</strong>
            <span>${escapeHtml(request.role_title)} · ${escapeHtml(request.team_name)}</span>
            <div class="approval-flags">
              <span class="flag ${coverage.className}">${icon(coverage.iconName)}${coverage.label === "Healthy" ? "Coverage healthy" : coverage.label}</span>
              <span class="flag ${noticeHealthy ? "flag--success" : "flag--danger"}">${icon("clock")}${noticeHealthy ? "Notice met" : "Short notice"}</span>
              <span class="flag ${balanceHealthy ? "flag--success" : "flag--danger"}">${icon(balanceHealthy ? "check" : "alert")}${balanceHealthy ? "Balance available" : "Insufficient balance"}</span>
            </div>
          </div>
          <div class="approval-facts">
            <div class="fact"><span>${icon("calendar")}Leave</span><strong>${escapeHtml(request.leave_type)}</strong></div>
            <div class="fact"><span>${icon("calendar")}Dates</span><strong>${formatDate(request.start_date)} - ${formatDate(request.end_date)}</strong></div>
            <div class="fact"><span>${icon("clock")}Duration</span><strong>${pluralize(request.total_days, "day")}</strong></div>
            <div class="fact"><span>${icon("alert")}Waiting</span><strong>${pluralize(meta.waiting, "day")}${meta.waiting >= ESCALATION_DAYS ? " · Escalate" : ""}</strong></div>
          </div>
          <div class="approval-actions">
            <button class="button button--primary button--small" type="button" data-approve="${request.id}">${icon("check")}Approve</button>
            <button class="button button--small" type="button" data-reject="${request.id}">${icon("x")}Reject</button>
          </div>
        </article>`;
    }).join("");
    $("#approval-list").setAttribute("aria-busy", "false");
  }

  function isoWeekBounds(value) {
    const [year, week] = value.split("-W").map(Number);
    const januaryFourth = new Date(Date.UTC(year, 0, 4));
    const monday = new Date(januaryFourth);
    monday.setUTCDate(januaryFourth.getUTCDate() - ((januaryFourth.getUTCDay() || 7) - 1) + (week - 1) * 7);
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    const format = (date) => date.toISOString().slice(0, 10);
    return { start: format(monday), end: format(sunday) };
  }

  function renderWhoIsOut() {
    const week = isoWeekBounds($("#leave-week").value || "2026-W31");
    const approved = app.data.leaveRequests.filter((request) => request.status === "Approved");
    const requests = approved.filter((request) => request.start_date <= week.end && request.end_date >= week.start);
    const fallbackRequests = approved
      .filter((request) => request.end_date >= today)
      .sort((left, right) => left.start_date.localeCompare(right.start_date))
      .slice(0, 5);

    if (requests.length) {
      $("#out-list").innerHTML = requests.map((request, index) => `
      <div class="out-row">
        ${rowNumber(index)}
        <div><strong>${icon(request.leave_type === "Unpaid" ? "alert" : "calendar")} ${escapeHtml(request.employee_name)}</strong><p>${escapeHtml(request.team_name)} · ${escapeHtml(request.leave_type)} leave</p></div>
        <div class="out-row__date">Back ${formatDate(request.end_date)}</div>
      </div>`).join("");
      return;
    }

    $("#out-list").innerHTML = fallbackRequests.length ? `
      <div class="empty-state empty-state--compact">${icon("calendar")}<strong>No approved leave this selected week</strong><span>Showing the next approved absences instead.</span></div>
      ${fallbackRequests.map((request, index) => `
        <div class="out-row">
          ${rowNumber(index)}
          <div><strong>${icon(request.leave_type === "Unpaid" ? "alert" : "calendar")} ${escapeHtml(request.employee_name)}</strong><p>${escapeHtml(request.team_name)} · ${escapeHtml(request.leave_type)} leave · starts ${formatDate(request.start_date)}</p></div>
          <div class="out-row__date">Back ${formatDate(request.end_date)}</div>
        </div>`).join("")}`
      : `<div class="empty-state">${icon("calendar")}<strong>No approved leave scheduled</strong><span>Approved absences will appear here after managers approve leave.</span></div>`;
  }

  function renderBalances() {
    const employees = app.data.employees.filter((employee) => employee.is_active).slice(0, 5);
    $("#balance-list").innerHTML = employees.map((employee, index) => {
      const balance = leaveBalance(employee.id, app.data.leaveRequests);
      const percent = Math.min((balance.used / balance.allowance) * 100, 100);
      return `<div class="balance-row">
        ${rowNumber(index)}
        <div class="balance-row__top"><strong>${escapeHtml(nameOf(employee))}</strong><span>${balance.remaining} remaining · ${balance.pending} pending</span></div>
        <div class="progress ${balance.remaining <= 5 ? "is-low" : ""}" title="${balance.used} of ${balance.allowance} days used"><span style="width:${percent}%"></span></div>
      </div>`;
    }).join("");
  }

  function payrollForPeriod() {
    return app.data.payrollRecords.filter((record) => record.pay_period === app.payrollPeriod);
  }

  function filteredPayrollRecords() {
    const records = payrollForPeriod();
    return app.payrollStatusFilter === "all"
      ? records
      : records.filter((record) => record.status === app.payrollStatusFilter);
  }

  function payrollTotals(records = payrollForPeriod()) {
    return records.reduce((totals, record) => ({
      gross: totals.gross + record.gross_pay,
      tax: totals.tax + record.tax_deduction,
      social: totals.social + record.social_security_deduction,
      unpaid: totals.unpaid + record.unpaid_leave_deduction,
      net: totals.net + record.net_pay,
    }), { gross: 0, tax: 0, social: 0, unpaid: 0, net: 0 });
  }

  function summaryMarkup(records) {
    const totals = payrollTotals(records);
    const status = records.length && records.every((record) => record.status === "Paid") ? "Paid" :
      records.some((record) => record.status === "Draft") ? "Draft" : records.length ? "Finalized" : "Not generated";
    return [
      ["Payroll status", status, "receipt"],
      ["Total gross", formatCurrency(totals.gross), "banknote"],
      ["Tax", formatCurrency(totals.tax), "fileText"],
      ["Social security", formatCurrency(totals.social), "shield"],
      ["Unpaid leave", formatCurrency(totals.unpaid), "calendar"],
      ["Total net", formatCurrency(totals.net), "banknote", true],
    ].map(([label, value, iconName, key]) => `<div class="summary-stat ${key ? "summary-stat--key" : ""}"><span>${icon(iconName)}${label}</span><strong>${escapeHtml(value)}</strong></div>`).join("");
  }

  function renderPayrollPreview() {
    $("#payroll-preview").innerHTML = summaryMarkup(payrollForPeriod());
  }

  function filteredEmployees() {
    return app.data.employees.filter((employee) => {
      const queryTarget = [nameOf(employee), employee.role_title, employee.team_name, employee.manager_name].join(" ").toLowerCase();
      const status = employee.is_active ? "active" : "inactive";
      return queryTarget.includes(app.employeeFilters.query.toLowerCase()) &&
        (app.employeeFilters.type === "all" || employee.employment_type === app.employeeFilters.type) &&
        (app.employeeFilters.status === "all" || status === app.employeeFilters.status);
    });
  }

  function renderEmployees() {
    const employees = filteredEmployees();
    $("#employee-table").innerHTML = employees.length ? employees.map((employee, index) => `
      <tr>
        <td>${rowNumber(index)}</td>
        <td><div class="person-cell"><strong>${icon("users")}${escapeHtml(nameOf(employee))}</strong><span class="mono">${escapeHtml(employee.employee_code)}</span></div></td>
        <td><div class="person-cell"><strong>${icon("briefcase")}${escapeHtml(employee.role_title)}</strong><span>${escapeHtml(employee.team_name)}</span></div></td>
        <td>${escapeHtml(employee.manager_name ?? "Executive")}</td>
        <td class="mono">${formatDate(employee.start_date)}</td>
        <td>${escapeHtml(employee.employment_type)}</td>
        <td class="money">${formatCurrency(employee.salary)}</td>
        <td><span class="${employee.is_active ? "status status--approved" : "status status--rejected"}">${icon(employee.is_active ? "check" : "slash")}${employee.is_active ? "Active" : "Inactive"}</span></td>
        <td><div class="row-actions"><button class="text-button" type="button" data-edit-employee="${employee.id}">${icon("edit")}Edit</button><button class="text-button" type="button" data-toggle-employee="${employee.id}">${icon(employee.is_active ? "slash" : "check")}${employee.is_active ? "Deactivate" : "Reactivate"}</button></div></td>
      </tr>`).join("") : `<tr><td colspan="9"><div class="empty-state">${icon("search")}No employees match these filters.</div></td></tr>`;
  }

  function renderOrgTree() {
    const managers = app.data.employees.filter((employee) =>
      employee.is_active && app.data.employees.some((person) => person.manager_id === employee.id));
    $("#org-tree").innerHTML = managers.map((manager, managerIndex) => {
      const reports = app.data.employees.filter((employee) => employee.manager_id === manager.id && employee.is_active);
      return `<article class="org-manager">${rowNumber(managerIndex)}<strong>${icon("org")}${escapeHtml(nameOf(manager))}</strong><span>${escapeHtml(manager.role_title)} · ${pluralize(reports.length, "direct report")}</span>
        <div class="direct-reports">${reports.map((report, reportIndex) => `<div class="direct-report">${rowNumber(reportIndex)}${icon("users")}${escapeHtml(nameOf(report))} <span>- ${escapeHtml(report.role_title)}</span></div>`).join("")}</div>
      </article>`;
    }).join("");
  }

  function coverageMeta(request) {
    if (request.leave_type === "Sick") {
      return { label: "Sick", healthy: false, iconName: "alert", className: "flag--warning", textClass: "text-warning" };
    }
    const healthy = teamAbsencesDuring(request, app.data.leaveRequests, app.data.employees) < MAX_TEAM_ABSENCES;
    return {
      label: healthy ? "Healthy" : "At risk",
      healthy,
      iconName: healthy ? "shield" : "alert",
      className: healthy ? "flag--success" : "flag--danger",
      textClass: healthy ? "text-success" : "text-danger",
    };
  }

  function renderLeaveDesk() {
    $("#leave-rules-strip").innerHTML = [
      ["Standard notice", "7 calendar days", "clock"],
      ["Family leave", "14 calendar days", "calendar"],
      ["Team coverage", `Max ${MAX_TEAM_ABSENCES} away at once`, "shield"],
      ["Escalation", `Pending after ${ESCALATION_DAYS} days`, "alert"],
    ].map(([label, value, iconName], index) => `<div class="rule-item">${rowNumber(index)}${icon(iconName)}<strong>${label}</strong><span>${value}</span></div>`).join("");
    const visibleSource = isHrUser() ? app.data.leaveRequests : myLeaveRequests();
    const requests = visibleSource.filter((request) =>
      (app.leaveFilters.status === "all" || request.status === app.leaveFilters.status) &&
      (app.leaveFilters.type === "all" || request.leave_type === app.leaveFilters.type));
    $("#leave-table").innerHTML = requests.length ? requests.map((request, index) => {
      const meta = approvalMeta(request);
      const noticeHealthy = meta.notice >= meta.minimum;
      const coverage = coverageMeta(request);
      return `
      <tr class="clickable-row" data-leave-row="${request.id}" tabindex="0" role="button" aria-label="Open ${escapeHtml(request.employee_name)} leave request">
      <td>${rowNumber(index)}</td><td><div class="person-cell"><strong>${icon("users")}${escapeHtml(request.employee_name)}</strong><span>${escapeHtml(request.team_name)}</span></div></td>
      <td>${escapeHtml(request.leave_type)}</td><td class="mono">${formatDate(request.start_date)} - ${formatDate(request.end_date)}</td>
      <td>${request.total_days}</td><td><span class="flag ${coverage.className}">${icon(coverage.iconName)}${coverage.label}</span></td>
      <td>${pluralize(waitingDays(request), "day")} ago</td><td><span class="${statusClass(request.status)}">${icon(request.status === "Approved" ? "check" : request.status === "Rejected" ? "x" : "clock")}${escapeHtml(request.status)}</span><span class="notice-note ${noticeHealthy ? "notice-note--ok" : "notice-note--danger"}">${noticeHealthy ? "Notice met" : "Short notice"}</span></td></tr>`;
    }).join("")
      : `<tr><td colspan="8"><div class="empty-state">${icon("filter")}No leave requests match these filters.</div></td></tr>`;
  }

  function renderPayroll() {
    const periodRecords = payrollForPeriod();
    const records = filteredPayrollRecords();
    const draftCount = periodRecords.filter((record) => record.status === "Draft").length;
    $("#payroll-summary").innerHTML = summaryMarkup(periodRecords);
    $("#finalize-payroll").disabled = !draftCount;
    $("#finalize-payroll").innerHTML = `${icon("shield")}${draftCount ? `Finalize payroll · ${draftCount}` : "Finalized"}`;
    $("#refresh-payroll").disabled = !draftCount;
    $("#refresh-payroll").innerHTML = `${icon("refresh")}${draftCount ? `Refresh draft · ${draftCount}` : "No draft to refresh"}`;
    $("#payroll-table").innerHTML = records.length ? records.map((record, index) => `
      <tr class="clickable-row" data-payslip-row="${record.id}" tabindex="0" role="button" aria-label="Open ${escapeHtml(record.employee_name)} payslip">
      <td>${rowNumber(index)}</td><td><div class="person-cell"><strong>${icon("users")}${escapeHtml(record.employee_name)}</strong><span>${escapeHtml(record.employee_code)}</span></div></td>
      <td class="money">${formatCurrency(record.basic_salary)}</td><td class="money">${formatCurrency(record.proration ?? Math.max(record.basic_salary - record.gross_pay - record.unpaid_leave_deduction, 0))}</td>
      <td class="money">${formatCurrency(record.unpaid_leave_deduction)}</td><td class="money">${formatCurrency(record.gross_pay)}</td>
      <td class="money">${formatCurrency(record.tax_deduction)}</td><td class="money">${formatCurrency(record.social_security_deduction)}</td>
      <td class="money"><strong>${formatCurrency(record.net_pay)}</strong></td><td><span class="${statusClass(record.status)}">${icon(record.status === "Draft" ? "edit" : "check")}${record.status}</span></td>
      <td><div class="row-actions">${record.status === "Draft" ? `<button class="text-button" type="button" data-edit-payroll-salary="${record.id}">${icon("edit")}Edit salary</button>` : ""}<button class="text-button" type="button" data-payslip="${record.id}">${icon("receipt")}View</button></div></td></tr>`).join("")
      : `<tr><td colspan="11"><div class="empty-state">${icon("receipt")}<strong>No ${escapeHtml(app.payrollStatusFilter === "all" ? "payroll" : app.payrollStatusFilter.toLowerCase() + " payroll")} for ${escapeHtml(formatPeriod(app.payrollPeriod))}</strong><span>${periodRecords.length ? "Switch the status filter to see other payslips." : "Generate a draft run to review calculations."}</span></div></td></tr>`;
  }

  function renderMyPayslips() {
    const records = myPayslips();
    const table = $("#my-payslip-table");
    if (!table) return;
    table.innerHTML = records.length ? records.map((record, index) => `
      <tr class="clickable-row" data-payslip-row="${record.id}" tabindex="0" role="button" aria-label="Open ${escapeHtml(formatPeriod(record.pay_period))} payslip">
        <td>${rowNumber(index)}</td>
        <td><div class="person-cell"><strong>${icon("receipt")}${escapeHtml(formatPeriod(record.pay_period))}</strong><span>${escapeHtml(record.employee_code)}</span></div></td>
        <td class="money">${formatCurrency(record.gross_pay)}</td>
        <td class="money">${formatCurrency(record.tax_deduction + record.social_security_deduction + record.other_deductions + record.unpaid_leave_deduction)}</td>
        <td class="money"><strong>${formatCurrency(record.net_pay)}</strong></td>
        <td><span class="${statusClass(record.status)}">${icon(record.status === "Draft" ? "edit" : "check")}${escapeHtml(record.status)}</span></td>
        <td><button class="text-button" type="button" data-payslip="${record.id}">${icon("receipt")}View -</button></td>
      </tr>`).join("") : `<tr><td colspan="7"><div class="empty-state">${icon("receipt")}<strong>No payslips yet</strong><span>Your payslips will appear here once payroll is available.</span></div></td></tr>`;
  }

  function renderProfile() {
    const employee = currentEmployee();
    const manager = app.data.employees.find((person) => person.id === employee.manager_id);
    const grid = $("#profile-grid");
    if (!grid) return;
    grid.innerHTML = [
      ["Employee", nameOf(employee), employee.employee_code, "users"],
      ["Role", employee.role_title, employee.system_role, "briefcase"],
      ["Team", employee.team_name, manager ? `Manager: ${nameOf(manager)}` : "No manager assigned", "org"],
      ["Employment type", employee.employment_type, `Started ${formatDate(employee.start_date)}`, "fileText"],
      ["Email", employee.email, employee.phone_number, "fileText"],
      ["Salary", formatCurrency(employee.salary), "Visible only to you and HR", "banknote"],
    ].map(([label, value, meta, iconName], index) => `
      <article class="profile-card">
        ${rowNumber(index)}
        <span>${icon(iconName)}${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
        <em>${escapeHtml(meta)}</em>
      </article>`).join("");
  }

  function renderReports() {
    const active = app.data.employees.filter((employee) => employee.is_active);
    const salaryByTeam = app.data.teams.map((team) => ({
      name: team.name,
      total: active.filter((employee) => employee.team_id === team.id).reduce((sum, employee) => sum + employee.salary, 0),
    }));
    const maxSalary = Math.max(...salaryByTeam.map((item) => item.total), 1);
    const typeCounts = ["Permanent", "Contract", "Intern"].map((type) => ({
      name: type, total: active.filter((employee) => employee.employment_type === type).length,
    }));
    $("#report-grid").innerHTML = `
      <section class="report-panel"><div class="section-heading"><div><p class="eyebrow">${icon("banknote")}Monthly base</p><h2>Salary by team</h2></div></div><div class="report-panel__body">
        ${salaryByTeam.map((item, index) => `<div class="bar-row">${rowNumber(index)}<span>${icon("briefcase")}${escapeHtml(item.name)}</span><div class="progress"><span style="width:${item.total / maxSalary * 100}%"></span></div><span>${Math.round(item.total / 1000)}k</span></div>`).join("")}
      </div></section>
      <section class="report-panel"><div class="section-heading"><div><p class="eyebrow">${icon("users")}Workforce mix</p><h2>Employment types</h2></div></div><div class="report-panel__body">
        ${typeCounts.map((item, index) => `<div class="bar-row">${rowNumber(index)}<span>${icon("briefcase")}${item.name}</span><div class="progress"><span style="width:${item.total / Math.max(active.length, 1) * 100}%"></span></div><span>${item.total}</span></div>`).join("")}
      </div></section>`;
  }

  function renderAll() {
    if (isHrUser()) {
      renderKpis();
      renderApprovalQueue();
      renderWhoIsOut();
      renderBalances();
      renderPayrollPreview();
      renderEmployees();
      renderOrgTree();
      renderPayroll();
      renderReports();
    } else {
      renderEmployeeDashboard();
      renderMyPayslips();
      renderProfile();
    }
    renderLeaveDesk();
  }

  return {
    approvalMeta,
    coverageMeta,
    myLeaveRequests,
    myPayslips,
    renderAll,
    renderEmployees,
    renderKpis,
    renderLeaveDesk,
    renderPayroll,
    renderPayrollPreview,
    renderWhoIsOut,
    statusClass,
    waitingDays,
  };
}
