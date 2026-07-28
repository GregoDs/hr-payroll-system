import { mockStore } from "./data/store.js";
import { openDialog, closeDialog } from "./components/dialog.js";
import { appPages } from "./pages/registry.js";
import { formatCurrency, formatDate, formatPeriod, pluralize } from "./utils/format.js";
import {
  calendarDays,
  leaveBalance,
  minimumNoticeDays,
  noticeDays,
  teamAbsencesDuring,
  validateLeaveApproval,
  MAX_TEAM_ABSENCES,
  ESCALATION_DAYS,
} from "./domain/leave-rules.js";

const TODAY = "2026-07-28";
const app = {
  data: { employees: [], leaveRequests: [], payrollRecords: [], teams: [] },
  employeeFilters: { query: "", type: "all", status: "active" },
  leaveFilters: { status: "all", type: "all" },
  payrollPeriod: "2026-07",
  selectedMetric: null,
};

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
})[character]);

function nameOf(employee) {
  return `${employee.first_name} ${employee.last_name}`;
}

function setFeedback(selector, message, isError = false) {
  const element = $(selector);
  element.textContent = message;
  element.hidden = false;
  element.classList.toggle("is-error", isError);
  $("#app-status").textContent = message;
}

function hideFeedback(selector) {
  $(selector).hidden = true;
}

function toast(message) {
  const element = document.createElement("div");
  element.className = "toast";
  element.textContent = message;
  $("#toast-region").append(element);
  window.setTimeout(() => element.remove(), 3600);
}

function statusClass(status) {
  return `status status--${status.toLowerCase()}`;
}

function waitingDays(request) {
  const submitted = new Date(`${request.submitted_at.slice(0, 10)}T00:00:00Z`);
  const today = new Date(`${TODAY}T00:00:00Z`);
  return Math.max(Math.floor((today - submitted) / 86400000), 0);
}

function approvalMeta(request) {
  const balance = leaveBalance(request.employee_id, app.data.leaveRequests);
  const absences = teamAbsencesDuring(request, app.data.leaveRequests, app.data.employees);
  const notice = noticeDays(request.start_date, TODAY);
  const minimum = minimumNoticeDays(request.leave_type);
  return { balance, absences, notice, minimum, waiting: waitingDays(request) };
}

function navigate(viewName, updateHash = true) {
  const target = $(`[data-view="${viewName}"]`) ?? $("[data-view='overview']");
  $$(".view").forEach((view) => {
    const active = view === target;
    view.hidden = !active;
    view.classList.toggle("is-active", active);
  });
  $$("[data-view-link]").forEach((link) => {
    if (link.dataset.viewLink === target.dataset.view) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  $("#primary-nav").classList.remove("is-open");
  $("#nav-toggle").setAttribute("aria-expanded", "false");
  if (updateHash) history.replaceState(null, "", `#${target.dataset.view}`);
  document.title = `${$("h1", target).textContent.trim().replace(/\s+/g, " ")} — PeopleOps`;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderKpis() {
  const activeEmployees = app.data.employees.filter((employee) => employee.is_active).length;
  const pending = app.data.leaveRequests.filter((request) => request.status === "Pending").length;
  const outToday = app.data.leaveRequests.filter((request) =>
    request.status === "Approved" && request.start_date <= TODAY && request.end_date >= TODAY).length;
  const periodRecords = app.data.payrollRecords.filter((record) => record.pay_period === app.payrollPeriod);
  const netTotal = periodRecords.reduce((sum, record) => sum + record.net_pay, 0);
  const metrics = [
    { id: "active", label: "Active employees", value: activeEmployees, meta: `${app.data.teams.length} operating teams`, view: "employees" },
    { id: "pending", label: "Pending approvals", value: pending, meta: pending ? "Decision required" : "Queue is clear", view: "leave" },
    { id: "out", label: "Out today", value: outToday, meta: outToday ? "Coverage monitored" : "Full coverage", view: "leave" },
    { id: "payroll", label: "Current payroll", value: formatCurrency(netTotal), meta: `${periodRecords.length} employees · ${formatPeriod(app.payrollPeriod)}`, view: "payroll" },
  ];
  $("#kpi-grid").innerHTML = metrics.map((metric) => `
    <button class="kpi ${app.selectedMetric === metric.id ? "is-selected" : ""}" type="button" data-kpi="${metric.id}" data-go-view="${metric.view}">
      <span class="kpi__label">${metric.label}</span>
      <strong class="kpi__value">${escapeHtml(metric.value)}</strong>
      <span class="kpi__meta">${escapeHtml(metric.meta)}</span>
    </button>`).join("");
}

function renderApprovalQueue() {
  const pending = app.data.leaveRequests.filter((request) => request.status === "Pending");
  $("#approval-title").textContent = `Pending leave approvals · ${pending.length}`;
  if (!pending.length) {
    $("#approval-list").innerHTML = `<div class="empty-state"><strong>No decisions waiting</strong><span>New leave requests will appear here.</span></div>`;
    $("#approval-list").setAttribute("aria-busy", "false");
    return;
  }
  $("#approval-list").innerHTML = pending.map((request) => {
    const meta = approvalMeta(request);
    const coverageHealthy = meta.absences < MAX_TEAM_ABSENCES;
    const noticeHealthy = meta.notice >= meta.minimum;
    const balanceHealthy = request.leave_type !== "Annual" || request.total_days <= meta.balance.remaining;
    return `
      <article class="approval-row" data-leave-id="${request.id}">
        <div class="approval-person">
          <strong>${escapeHtml(request.employee_name)}</strong>
          <span>${escapeHtml(request.role_title)} · ${escapeHtml(request.team_name)}</span>
          <div class="approval-flags">
            <span class="flag ${coverageHealthy ? "flag--success" : "flag--danger"}">${coverageHealthy ? "Coverage healthy" : "Under-covered"}</span>
            <span class="flag ${noticeHealthy ? "flag--success" : "flag--warning"}">${noticeHealthy ? "Notice met" : "Short notice"}</span>
            <span class="flag ${balanceHealthy ? "flag--success" : "flag--danger"}">${balanceHealthy ? "Balance available" : "Insufficient balance"}</span>
          </div>
        </div>
        <div class="approval-facts">
          <div class="fact"><span>Leave</span><strong>${escapeHtml(request.leave_type)}</strong></div>
          <div class="fact"><span>Dates</span><strong>${formatDate(request.start_date)} — ${formatDate(request.end_date)}</strong></div>
          <div class="fact"><span>Duration</span><strong>${pluralize(request.total_days, "day")}</strong></div>
          <div class="fact"><span>Waiting</span><strong>${pluralize(meta.waiting, "day")}${meta.waiting >= ESCALATION_DAYS ? " · Escalate" : ""}</strong></div>
        </div>
        <div class="approval-actions">
          <button class="button button--primary button--small" type="button" data-approve="${request.id}">Approve</button>
          <button class="button button--small" type="button" data-reject="${request.id}">Reject</button>
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
  const requests = app.data.leaveRequests.filter((request) =>
    request.status === "Approved" && request.start_date <= week.end && request.end_date >= week.start);
  $("#out-list").innerHTML = requests.length ? requests.map((request) => `
    <div class="out-row">
      <div><strong><span class="status-dot ${request.leave_type === "Unpaid" ? "status-dot--warning" : ""}"></span> ${escapeHtml(request.employee_name)}</strong><p>${escapeHtml(request.team_name)} · ${escapeHtml(request.leave_type)} leave</p></div>
      <div class="out-row__date">Back ${formatDate(request.end_date)}</div>
    </div>`).join("") : `<div class="empty-state"><strong>No approved leave this week</strong><span>Team coverage is at full strength.</span></div>`;
}

function renderBalances() {
  const employees = app.data.employees.filter((employee) => employee.is_active).slice(0, 5);
  $("#balance-list").innerHTML = employees.map((employee) => {
    const balance = leaveBalance(employee.id, app.data.leaveRequests);
    const percent = Math.min((balance.used / balance.allowance) * 100, 100);
    return `<div class="balance-row">
      <div class="balance-row__top"><strong>${escapeHtml(nameOf(employee))}</strong><span>${balance.remaining} remaining · ${balance.pending} pending</span></div>
      <div class="progress ${balance.remaining <= 5 ? "is-low" : ""}" title="${balance.used} of ${balance.allowance} days used"><span style="width:${percent}%"></span></div>
    </div>`;
  }).join("");
}

function payrollForPeriod() {
  return app.data.payrollRecords.filter((record) => record.pay_period === app.payrollPeriod);
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
    ["Payroll status", status],
    ["Total gross", formatCurrency(totals.gross)],
    ["Tax", formatCurrency(totals.tax)],
    ["Social security", formatCurrency(totals.social)],
    ["Unpaid leave", formatCurrency(totals.unpaid)],
    ["Total net", formatCurrency(totals.net), true],
  ].map(([label, value, key]) => `<div class="summary-stat ${key ? "summary-stat--key" : ""}"><span>${label}</span><strong>${escapeHtml(value)}</strong></div>`).join("");
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
  $("#employee-table").innerHTML = employees.length ? employees.map((employee) => `
    <tr>
      <td><div class="person-cell"><strong>${escapeHtml(nameOf(employee))}</strong><span class="mono">${escapeHtml(employee.employee_code)}</span></div></td>
      <td><div class="person-cell"><strong>${escapeHtml(employee.role_title)}</strong><span>${escapeHtml(employee.team_name)}</span></div></td>
      <td>${escapeHtml(employee.manager_name ?? "Executive")}</td>
      <td class="mono">${formatDate(employee.start_date)}</td>
      <td>${escapeHtml(employee.employment_type)}</td>
      <td class="money">${formatCurrency(employee.salary)}</td>
      <td><span class="${employee.is_active ? "status status--approved" : "status status--rejected"}">${employee.is_active ? "Active" : "Inactive"}</span></td>
      <td><div class="row-actions"><button class="text-button" type="button" data-edit-employee="${employee.id}">Edit</button><button class="text-button" type="button" data-toggle-employee="${employee.id}">${employee.is_active ? "Deactivate" : "Reactivate"}</button></div></td>
    </tr>`).join("") : `<tr><td colspan="8"><div class="empty-state">No employees match these filters.</div></td></tr>`;
}

function renderOrgTree() {
  const managers = app.data.employees.filter((employee) =>
    employee.is_active && app.data.employees.some((person) => person.manager_id === employee.id));
  $("#org-tree").innerHTML = managers.map((manager) => {
    const reports = app.data.employees.filter((employee) => employee.manager_id === manager.id && employee.is_active);
    return `<article class="org-manager"><strong>${escapeHtml(nameOf(manager))}</strong><span>${escapeHtml(manager.role_title)} · ${pluralize(reports.length, "direct report")}</span>
      <div class="direct-reports">${reports.map((report) => `<div class="direct-report">${escapeHtml(nameOf(report))} <span>— ${escapeHtml(report.role_title)}</span></div>`).join("")}</div>
    </article>`;
  }).join("");
}

function coverageLabel(request) {
  return teamAbsencesDuring(request, app.data.leaveRequests, app.data.employees) < MAX_TEAM_ABSENCES ? "Healthy" : "At risk";
}

function renderLeaveDesk() {
  $("#leave-rules-strip").innerHTML = [
    ["Standard notice", "7 calendar days"],
    ["Family leave", "14 calendar days"],
    ["Team coverage", `Max ${MAX_TEAM_ABSENCES} away at once`],
    ["Escalation", `Pending after ${ESCALATION_DAYS} days`],
  ].map(([label, value]) => `<div class="rule-item"><strong>${label}</strong><span>${value}</span></div>`).join("");
  const requests = app.data.leaveRequests.filter((request) =>
    (app.leaveFilters.status === "all" || request.status === app.leaveFilters.status) &&
    (app.leaveFilters.type === "all" || request.leave_type === app.leaveFilters.type));
  $("#leave-table").innerHTML = requests.length ? requests.map((request) => `
    <tr><td><div class="person-cell"><strong>${escapeHtml(request.employee_name)}</strong><span>${escapeHtml(request.team_name)}</span></div></td>
    <td>${escapeHtml(request.leave_type)}</td><td class="mono">${formatDate(request.start_date)} — ${formatDate(request.end_date)}</td>
    <td>${request.total_days}</td><td><span class="flag ${coverageLabel(request) === "Healthy" ? "flag--success" : "flag--danger"}">${coverageLabel(request)}</span></td>
    <td>${pluralize(waitingDays(request), "day")} ago</td><td><span class="${statusClass(request.status)}">${escapeHtml(request.status)}</span></td></tr>`).join("")
    : `<tr><td colspan="7"><div class="empty-state">No leave requests match these filters.</div></td></tr>`;
}

function renderPayroll() {
  const records = payrollForPeriod();
  $("#payroll-summary").innerHTML = summaryMarkup(records);
  $("#payroll-table").innerHTML = records.length ? records.map((record) => `
    <tr><td><div class="person-cell"><strong>${escapeHtml(record.employee_name)}</strong><span>${escapeHtml(record.employee_code)}</span></div></td>
    <td class="money">${formatCurrency(record.basic_salary)}</td><td class="money">${formatCurrency(record.proration ?? Math.max(record.basic_salary - record.gross_pay - record.unpaid_leave_deduction, 0))}</td>
    <td class="money">${formatCurrency(record.unpaid_leave_deduction)}</td><td class="money">${formatCurrency(record.gross_pay)}</td>
    <td class="money">${formatCurrency(record.tax_deduction)}</td><td class="money">${formatCurrency(record.social_security_deduction)}</td>
    <td class="money"><strong>${formatCurrency(record.net_pay)}</strong></td><td><span class="${statusClass(record.status)}">${record.status}</span></td>
    <td><button class="text-button" type="button" data-payslip="${record.id}">View →</button></td></tr>`).join("")
    : `<tr><td colspan="10"><div class="empty-state"><strong>No payroll for ${escapeHtml(formatPeriod(app.payrollPeriod))}</strong><span>Generate a draft run to review calculations.</span></div></td></tr>`;
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
    <section class="report-panel"><div class="section-heading"><div><p class="eyebrow">Monthly base</p><h2>Salary by team</h2></div></div><div class="report-panel__body">
      ${salaryByTeam.map((item) => `<div class="bar-row"><span>${escapeHtml(item.name)}</span><div class="progress"><span style="width:${item.total / maxSalary * 100}%"></span></div><span>${Math.round(item.total / 1000)}k</span></div>`).join("")}
    </div></section>
    <section class="report-panel"><div class="section-heading"><div><p class="eyebrow">Workforce mix</p><h2>Employment types</h2></div></div><div class="report-panel__body">
      ${typeCounts.map((item) => `<div class="bar-row"><span>${item.name}</span><div class="progress"><span style="width:${item.total / Math.max(active.length, 1) * 100}%"></span></div><span>${item.total}</span></div>`).join("")}
    </div></section>`;
}

function renderAll() {
  renderKpis();
  renderApprovalQueue();
  renderWhoIsOut();
  renderBalances();
  renderPayrollPreview();
  renderEmployees();
  renderOrgTree();
  renderLeaveDesk();
  renderPayroll();
  renderReports();
}

function createField(label, name, type = "text", value = "", options = null, required = true) {
  const wrapper = document.createElement("label");
  wrapper.className = "field";
  const labelElement = document.createElement("span");
  labelElement.textContent = label;
  let control;
  if (options) {
    control = document.createElement("select");
    options.forEach(([optionValue, text]) => control.add(new Option(text, optionValue)));
  } else if (type === "textarea") {
    control = document.createElement("textarea");
  } else {
    control = document.createElement("input");
    control.type = type;
  }
  control.name = name;
  control.value = value ?? "";
  control.required = required;
  wrapper.append(labelElement, control);
  return wrapper;
}

function addFormActions(form, submitLabel) {
  const actions = document.createElement("div");
  actions.className = "form-actions field--full";
  const cancel = document.createElement("button");
  cancel.className = "button";
  cancel.type = "button";
  cancel.textContent = "Cancel";
  cancel.dataset.closeModal = "";
  const submit = document.createElement("button");
  submit.className = "button button--primary";
  submit.type = "submit";
  submit.textContent = submitLabel;
  actions.append(cancel, submit);
  form.append(actions);
}

function openEmployeeForm(employee = null) {
  const form = document.createElement("form");
  form.className = "form-grid";
  const managerOptions = [["", "No manager"], ...app.data.employees.filter((item) => item.is_active && item.id !== employee?.id).map((item) => [item.id, nameOf(item)])];
  const teamOptions = app.data.teams.map((team) => [team.id, team.name]);
  [
    createField("First name", "first_name", "text", employee?.first_name),
    createField("Last name", "last_name", "text", employee?.last_name),
    createField("Email", "email", "email", employee?.email),
    createField("Phone number", "phone_number", "tel", employee?.phone_number),
    createField("National ID", "national_id", "text", employee?.national_id),
    createField("KRA PIN", "kra_pin", "text", employee?.kra_pin, null, false),
    createField("Role title", "role_title", "text", employee?.role_title),
    createField("System role", "system_role", "text", employee?.system_role ?? "Employee"),
    createField("Team", "team_id", "select", employee?.team_id, teamOptions),
    createField("Manager", "manager_id", "select", employee?.manager_id ?? "", managerOptions, false),
    createField("Employment type", "employment_type", "select", employee?.employment_type ?? "Permanent", [["Permanent", "Permanent"], ["Contract", "Contract"], ["Intern", "Intern"]]),
    createField("Monthly salary (KES)", "salary", "number", employee?.salary),
    createField("Start date", "start_date", "date", employee?.start_date),
  ].forEach((field) => form.append(field));
  addFormActions(form, employee ? "Save changes" : "Add employee");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = form.querySelector("[type='submit']");
    submit.disabled = true;
    submit.textContent = "Saving…";
    const values = Object.fromEntries(new FormData(form));
    values.team_id = Number(values.team_id);
    values.manager_id = values.manager_id ? Number(values.manager_id) : null;
    values.salary = Number(values.salary);
    await mockStore.saveEmployee(values, employee?.id);
    app.data = await mockStore.load();
    renderAll();
    closeDialog();
    toast(employee ? "Employee record updated." : "Employee added to the directory.");
  });
  openDialog({ title: employee ? "Edit employee" : "Add employee", eyebrow: "Employee record", content: form });
}

function openLeaveForm() {
  const form = document.createElement("form");
  form.className = "form-grid";
  [
    createField("Employee", "employee_id", "select", "", app.data.employees.filter((item) => item.is_active).map((item) => [item.id, nameOf(item)])),
    createField("Leave type", "leave_type", "select", "Annual", ["Annual", "Sick", "Maternity", "Paternity", "Compassionate", "Study", "Unpaid"].map((item) => [item, item])),
    createField("Start date", "start_date", "date", "2026-08-10"),
    createField("End date", "end_date", "date", "2026-08-14"),
    createField("Reason", "reason", "textarea", ""),
  ].forEach((field, index) => {
    if (index === 4) field.classList.add("field--full");
    form.append(field);
  });
  const error = document.createElement("p");
  error.className = "form-error field--full";
  error.setAttribute("aria-live", "polite");
  form.append(error);
  addFormActions(form, "Submit request");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form));
    const days = calendarDays(values.start_date, values.end_date);
    const required = minimumNoticeDays(values.leave_type);
    const notice = noticeDays(values.start_date, TODAY);
    if (days <= 0) { error.textContent = "End date must be on or after the start date."; return; }
    if (notice < required) { error.textContent = `${values.leave_type} leave requires at least ${required} days' notice.`; return; }
    values.employee_id = Number(values.employee_id);
    values.total_days = days;
    const candidate = { ...values, id: -1, status: "Pending" };
    const overlapping = app.data.leaveRequests.some((request) =>
      request.employee_id === values.employee_id && ["Pending", "Approved"].includes(request.status) &&
      request.start_date <= values.end_date && request.end_date >= values.start_date);
    if (overlapping) { error.textContent = "This employee has an overlapping active request."; return; }
    if (teamAbsencesDuring(candidate, app.data.leaveRequests, app.data.employees) >= MAX_TEAM_ABSENCES) {
      error.textContent = "Team coverage would fall below the safe threshold."; return;
    }
    await mockStore.createLeave(values);
    app.data = await mockStore.load();
    renderAll();
    closeDialog();
    toast("Leave request submitted for approval.");
  });
  openDialog({ title: "Request leave", eyebrow: "New leave request", content: form });
}

function openRejectDialog(request) {
  const form = document.createElement("form");
  form.className = "form-grid";
  const reason = createField("Reason for rejection (optional)", "reason", "textarea", "", null, false);
  reason.classList.add("field--full");
  form.append(reason);
  addFormActions(form, "Reject request");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await mockStore.decideLeave(request.id, "Rejected", new FormData(form).get("reason") || null);
    app.data = await mockStore.load();
    renderAll();
    closeDialog();
    setFeedback("#leave-feedback", `${request.employee_name}'s leave request was rejected.`);
  });
  openDialog({ title: `Reject ${request.employee_name}'s request?`, eyebrow: "Leave decision", content: form });
}

function openDeactivateDialog(employee) {
  const wrapper = document.createElement("div");
  const copy = document.createElement("p");
  copy.className = "page-intro";
  copy.textContent = employee.is_active
    ? `${nameOf(employee)} will lose active access but their employment and payroll history will remain intact.`
    : `${nameOf(employee)} will return to active employee lists.`;
  const actions = document.createElement("div");
  actions.className = "form-actions";
  const cancel = document.createElement("button");
  cancel.className = "button";
  cancel.type = "button";
  cancel.textContent = "Cancel";
  cancel.dataset.closeModal = "";
  const confirm = document.createElement("button");
  confirm.className = `button ${employee.is_active ? "button--danger" : "button--primary"}`;
  confirm.type = "button";
  confirm.textContent = employee.is_active ? "Deactivate" : "Reactivate";
  confirm.addEventListener("click", async () => {
    confirm.disabled = true;
    confirm.textContent = "Updating…";
    await mockStore.setEmployeeActive(employee.id, !employee.is_active);
    app.data = await mockStore.load();
    renderAll();
    closeDialog();
    toast(`${nameOf(employee)} is now ${employee.is_active ? "inactive" : "active"}.`);
  });
  actions.append(cancel, confirm);
  wrapper.append(copy, actions);
  openDialog({ title: `${employee.is_active ? "Deactivate" : "Reactivate"} employee`, eyebrow: "Employment status", content: wrapper });
}

function openPayslip(record) {
  const content = document.createElement("div");
  content.innerHTML = `
    <div class="payslip-head"><p class="eyebrow">${escapeHtml(record.employee_code)} · ${escapeHtml(formatPeriod(record.pay_period))}</p><h3>${escapeHtml(record.employee_name)}</h3><p class="page-intro">${escapeHtml(record.role_title)} · ${escapeHtml(record.team_name)}</p></div>
    <div class="payslip-grid">
      <div class="payslip-line"><span>Basic salary</span><strong>${formatCurrency(record.basic_salary)}</strong></div>
      <div class="payslip-line"><span>Gross pay</span><strong>${formatCurrency(record.gross_pay)}</strong></div>
      <div class="payslip-line"><span>Tax</span><strong>− ${formatCurrency(record.tax_deduction)}</strong></div>
      <div class="payslip-line"><span>Social security</span><strong>− ${formatCurrency(record.social_security_deduction)}</strong></div>
      <div class="payslip-line"><span>Unpaid leave · ${record.unpaid_leave_days} days</span><strong>− ${formatCurrency(record.unpaid_leave_deduction)}</strong></div>
      <div class="payslip-line"><span>Status</span><strong>${escapeHtml(record.status)}</strong></div>
    </div><div class="payslip-net"><span>Net pay</span><strong>${formatCurrency(record.net_pay)}</strong></div>`;
  openDialog({ title: "Payslip detail", eyebrow: `Payroll #${record.id}`, content });
}

async function handleAction(event) {
  const goView = event.target.closest("[data-go-view]");
  if (goView) {
    if (goView.dataset.kpi) {
      app.selectedMetric = goView.dataset.kpi;
      renderKpis();
    }
    navigate(goView.dataset.goView);
    return;
  }
  const approve = event.target.closest("[data-approve]");
  if (approve) {
    hideFeedback("#leave-feedback");
    const request = app.data.leaveRequests.find((item) => item.id === Number(approve.dataset.approve));
    const validation = validateLeaveApproval(request, { ...app.data, today: TODAY });
    if (!validation.valid) {
      setFeedback("#leave-feedback", `Approval blocked: ${validation.problems.join(" ")}`, true);
      return;
    }
    approve.disabled = true;
    approve.textContent = "Approving…";
    await mockStore.decideLeave(request.id, "Approved", "Approved from workforce dashboard");
    app.data = await mockStore.load();
    renderAll();
    setFeedback("#leave-feedback", `${request.employee_name}'s leave was approved. Coverage and balance checks passed.`);
    return;
  }
  const reject = event.target.closest("[data-reject]");
  if (reject) openRejectDialog(app.data.leaveRequests.find((item) => item.id === Number(reject.dataset.reject)));
  const edit = event.target.closest("[data-edit-employee]");
  if (edit) openEmployeeForm(app.data.employees.find((item) => item.id === Number(edit.dataset.editEmployee)));
  const toggle = event.target.closest("[data-toggle-employee]");
  if (toggle) openDeactivateDialog(app.data.employees.find((item) => item.id === Number(toggle.dataset.toggleEmployee)));
  const payslip = event.target.closest("[data-payslip]");
  if (payslip) openPayslip(app.data.payrollRecords.find((item) => item.id === Number(payslip.dataset.payslip)));
}

function bindEvents() {
  document.addEventListener("click", handleAction);
  $$("[data-view-link]").forEach((link) => link.addEventListener("click", (event) => {
    event.preventDefault();
    navigate(link.dataset.viewLink);
  }));
  $("#nav-toggle").addEventListener("click", () => {
    const open = $("#primary-nav").classList.toggle("is-open");
    $("#nav-toggle").setAttribute("aria-expanded", String(open));
  });
  $("#theme-toggle").addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("peopleops-theme", next);
    $("#theme-toggle span").textContent = next === "light" ? "Dark mode" : "Light mode";
    $("#theme-toggle").setAttribute("aria-label", `Switch to ${next === "light" ? "dark" : "light"} mode`);
  });
  $("#leave-week").addEventListener("change", renderWhoIsOut);
  $("#employee-search").addEventListener("input", (event) => { app.employeeFilters.query = event.target.value; renderEmployees(); });
  $("#employment-filter").addEventListener("change", (event) => { app.employeeFilters.type = event.target.value; renderEmployees(); });
  $("#status-filter").addEventListener("change", (event) => { app.employeeFilters.status = event.target.value; renderEmployees(); });
  $("#leave-status-filter").addEventListener("change", (event) => { app.leaveFilters.status = event.target.value; renderLeaveDesk(); });
  $("#leave-type-filter").addEventListener("change", (event) => { app.leaveFilters.type = event.target.value; renderLeaveDesk(); });
  $("#pay-period").addEventListener("change", (event) => {
    app.payrollPeriod = event.target.value;
    renderKpis(); renderPayrollPreview(); renderPayroll();
  });
  $("#add-employee").addEventListener("click", () => openEmployeeForm());
  $("#request-leave").addEventListener("click", openLeaveForm);
  $("#generate-payroll").addEventListener("click", async (event) => {
    hideFeedback("#payroll-feedback");
    const button = event.currentTarget;
    button.disabled = true;
    button.textContent = "Generating…";
    try {
      const records = await mockStore.generatePayroll(app.payrollPeriod);
      app.data = await mockStore.load();
      renderAll();
      setFeedback("#payroll-feedback", `${records.length} draft payslips generated for ${formatPeriod(app.payrollPeriod)}.`);
    } catch (error) {
      setFeedback("#payroll-feedback", error.message, true);
    } finally {
      button.disabled = false;
      button.textContent = "Generate payroll";
    }
  });
  $("[data-demo-action='signout']").addEventListener("click", () => toast("Sign-out is disabled in the demo workspace."));
  window.addEventListener("hashchange", () => navigate(location.hash.slice(1) || "overview", false));
}

async function loadPagePartials() {
  const root = $("#views-root");
  const pages = await Promise.all(appPages.map(async ({ partial }) => {
    const response = await fetch(partial);
    if (!response.ok) throw new Error(`Unable to load ${partial}`);
    return response.text();
  }));
  root.innerHTML = pages.join("\n");
}

async function init() {
  const savedTheme = localStorage.getItem("peopleops-theme");
  if (savedTheme === "dark") {
    document.documentElement.dataset.theme = "dark";
    $("#theme-toggle span").textContent = "Light mode";
    $("#theme-toggle").setAttribute("aria-label", "Switch to light mode");
  }
  try {
    await loadPagePartials();
    bindEvents();
    app.data = await mockStore.load();
    renderAll();
    navigate(location.hash.slice(1) || "overview", false);
  } catch (error) {
    const root = $("#views-root");
    if (root) {
      root.innerHTML = `<div class="error-state">Unable to load the demo workspace. Refresh the page to try again.</div>`;
    }
    $("#app-status").textContent = error.message;
  }
}

init();
