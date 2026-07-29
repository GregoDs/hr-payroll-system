import { liveStore as store } from "./data/live-store.js";
import { appPages } from "./pages/registry.js";
import { createPageRenderers } from "./pages/renderers.js";
import { createEmployeeWorkflows } from "./pages/employee-workflows.js";
import { createLeaveWorkflows } from "./pages/leave-workflows.js";
import { createPayrollWorkflows } from "./pages/payroll-workflows.js";
import { SESSION_USER_KEY, LOGIN_URL } from "./session.js";
import { formatPeriod } from "./utils/format.js";
import { runAction } from "./ui/async-action.js";
import { $, $$, escapeHtml, icons, icon, nameOf, setFeedback, hideFeedback } from "./ui/presentation.js";

const TODAY = "2026-07-29";

const app = {
  data: { employees: [], leaveRequests: [], payrollRecords: [], teams: [] },
  currentUserId: null,
  employeeFilters: { query: "", type: "all", status: "active" },
  leaveFilters: { status: "all", type: "all" },
  payrollPeriod: "2026-07",
  payrollStatusFilter: "all",
  selectedMetric: null,
};

let leaveWorkflows;

const renderers = createPageRenderers({
  app,
  today: TODAY,
  currentEmployee,
  isHrUser,
  openLeaveForm: (...args) => leaveWorkflows.openLeaveForm(...args),
});

const {
  coverageMeta,
  renderAll,
  renderEmployees,
  renderKpis,
  renderLeaveDesk,
  renderPayroll,
  renderPayrollPreview,
  renderWhoIsOut,
} = renderers;

const employeeWorkflows = createEmployeeWorkflows({
  app,
  store,
  renderAll: () => renderAll(),
});

leaveWorkflows = createLeaveWorkflows({
  app,
  store,
  today: TODAY,
  currentEmployee,
  isHrUser,
  renderAll: () => renderAll(),
  coverageMeta,
});

const payrollWorkflows = createPayrollWorkflows({
  app,
  store,
  renderAll: () => renderAll(),
});

const { openEmployeeForm, openDeactivateDialog } = employeeWorkflows;
const { openLeaveForm, openRejectDialog, approveLeaveRequest, openLeaveDecisionDialog } = leaveWorkflows;
const { openPayslip, openBasicSalaryDialog } = payrollWorkflows;

function currentEmployee() {
  return app.data.employees.find((employee) => employee.id === app.currentUserId);
}

function isHrUser(employee = currentEmployee()) {
  return ["Admin", "HR"].includes(employee?.system_role);
}

function canAccessView(viewName) {
  if (isHrUser()) return ["overview", "employees", "leave", "payroll", "reports"].includes(viewName);
  return ["overview", "leave", "profile", "payslip"].includes(viewName);
}

function showLogin() {
  location.replace(LOGIN_URL);
}

function enterApp(employee) {
  app.currentUserId = Number(employee.id);
  store.setActiveUser(employee.id);
  sessionStorage.setItem(SESSION_USER_KEY, String(employee.id));
  renderShellForRole();
  bindEvents();
  renderAll();
  navigate("overview", false);
}

function restoreSession() {
  const savedUserId = Number(sessionStorage.getItem(SESSION_USER_KEY));
  if (!savedUserId) return null;
  return app.data.employees.find((employee) => employee.id === savedUserId && employee.is_active) ?? null;
}

function renderShellForRole() {
  const employee = currentEmployee();
  const hrItems = [
    ["overview", "Overview", "M4 13h6V4H4zM14 20h6V4h-6zM4 20h6v-3H4z"],
    ["employees", "Employees", icons.users],
    ["leave", "Leave", icons.calendar],
    ["payroll", "Payroll", icons.banknote],
    ["reports", "Reports", "M4 19V5M4 19h17M8 16V9M13 16V6M18 16v-4"],
  ];
  const employeeItems = [
    ["overview", "Dashboard", "M4 13h6V4H4zM14 20h6V4h-6zM4 20h6v-3H4z"],
    ["leave", "Leave", icons.calendar],
    ["profile", "Profile", icons.users],
    ["payslip", "Payslip", icons.receipt],
  ];
  const items = isHrUser(employee) ? hrItems : employeeItems;

  $("#primary-nav").innerHTML = items.map(([view, label, path], index) => `
    <a href="#${view}" data-view-link="${view}">
      <span>${String(index + 1).padStart(2, "0")}</span>
      <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg>
      ${label}
    </a>`).join("");

  $(".sidebar__footer").innerHTML = `
    <button class="theme-toggle" id="theme-toggle" type="button" aria-label="Switch to dark mode">
      ${icon(document.documentElement.dataset.theme === "dark" ? "moon" : "sun")}
      <span>${document.documentElement.dataset.theme === "dark" ? "Light mode" : "Dark mode"}</span>
    </button>
    <p class="eyebrow">Signed in as</p>
    <strong>${escapeHtml(nameOf(employee))}</strong>
    <span>${escapeHtml(employee.role_title)} · ${escapeHtml(employee.system_role)}</span>
    <button class="text-button" type="button" data-demo-action="signout">
      ${icon("arrowRight")}
      Logout
    </button>`;
}

function navigate(viewName, updateHash = true) {
  const safeView = canAccessView(viewName) ? viewName : "overview";
  const target = $(`[data-view="${safeView}"]`) ?? $("[data-view='overview']");

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
  if (updateHash || safeView !== viewName) history.replaceState(null, "", `#${target.dataset.view}`);
  document.title = `${$("h1", target).textContent.trim().replace(/\s+/g, " ")} — PeopleOps`;
  window.scrollTo({ top: 0, behavior: "smooth" });
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
    if (!isHrUser()) return;
    hideFeedback("#leave-feedback");
    const request = app.data.leaveRequests.find((item) => item.id === Number(approve.dataset.approve));
    const result = await approveLeaveRequest(request, approve);
    setFeedback("#leave-feedback", result.message, !result.ok);
    return;
  }
  const reject = event.target.closest("[data-reject]");
  if (reject) {
    if (!isHrUser()) return;
    openRejectDialog(app.data.leaveRequests.find((item) => item.id === Number(reject.dataset.reject)));
    return;
  }
  const edit = event.target.closest("[data-edit-employee]");
  if (edit) {
    if (!isHrUser()) return;
    openEmployeeForm(app.data.employees.find((item) => item.id === Number(edit.dataset.editEmployee)));
    return;
  }
  const toggle = event.target.closest("[data-toggle-employee]");
  if (toggle) {
    if (!isHrUser()) return;
    openDeactivateDialog(app.data.employees.find((item) => item.id === Number(toggle.dataset.toggleEmployee)));
    return;
  }
  const payslip = event.target.closest("[data-payslip]");
  if (payslip) {
    const record = app.data.payrollRecords.find((item) => item.id === Number(payslip.dataset.payslip));
    if (isHrUser() || record?.employee_id === currentEmployee()?.id) openPayslip(record);
    return;
  }
  const editPayrollSalary = event.target.closest("[data-edit-payroll-salary]");
  if (editPayrollSalary) {
    if (!isHrUser()) return;
    const record = app.data.payrollRecords.find((item) => item.id === Number(editPayrollSalary.dataset.editPayrollSalary));
    if (record?.status === "Draft") openBasicSalaryDialog(record);
    return;
  }
  if (event.target.closest("button, a, input, select, textarea, label")) return;

  const payslipRow = event.target.closest("[data-payslip-row]");
  if (payslipRow) {
    const record = app.data.payrollRecords.find((item) => item.id === Number(payslipRow.dataset.payslipRow));
    if (isHrUser() || record?.employee_id === currentEmployee()?.id) openPayslip(record);
    return;
  }

  const leaveRow = event.target.closest("[data-leave-row]");
  if (leaveRow) {
    openLeaveDecisionDialog(app.data.leaveRequests.find((item) => item.id === Number(leaveRow.dataset.leaveRow)));
  }
}

function handleRowKeydown(event) {
  if (!["Enter", " "].includes(event.key)) return;
  const row = event.target.closest("[data-payslip-row], [data-leave-row]");
  if (!row) return;
  event.preventDefault();
  row.click();
}

function bindEvents() {
  if (app.eventsBound) return;
  app.eventsBound = true;
  document.addEventListener("click", handleAction);
  document.addEventListener("keydown", handleRowKeydown);
  $$("[data-view-link]").forEach((link) => link.addEventListener("click", (event) => {
    event.preventDefault();
    navigate(link.dataset.viewLink);
  }));
  $("#nav-toggle")?.addEventListener("click", () => {
    const open = $("#primary-nav").classList.toggle("is-open");
    $("#nav-toggle").setAttribute("aria-expanded", String(open));
  });
  $("#theme-toggle")?.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("peopleops-theme", next);
    $("#theme-toggle span").textContent = next === "light" ? "Dark mode" : "Light mode";
    $("#theme-toggle").setAttribute("aria-label", `Switch to ${next === "light" ? "dark" : "light"} mode`);
  });
  $("#leave-week")?.addEventListener("change", renderWhoIsOut);
  $("#employee-search")?.addEventListener("input", (event) => { app.employeeFilters.query = event.target.value; renderEmployees(); });
  $("#employment-filter")?.addEventListener("change", (event) => { app.employeeFilters.type = event.target.value; renderEmployees(); });
  $("#status-filter")?.addEventListener("change", (event) => { app.employeeFilters.status = event.target.value; renderEmployees(); });
  $("#leave-status-filter")?.addEventListener("change", (event) => { app.leaveFilters.status = event.target.value; renderLeaveDesk(); });
  $("#leave-type-filter")?.addEventListener("change", (event) => { app.leaveFilters.type = event.target.value; renderLeaveDesk(); });
  $("#pay-period")?.addEventListener("change", (event) => {
    app.payrollPeriod = event.target.value;
    renderKpis(); renderPayrollPreview(); renderPayroll();
  });
  $("#payroll-status-filter")?.addEventListener("change", (event) => {
    app.payrollStatusFilter = event.target.value;
    renderPayroll();
  });
  $("#add-employee")?.addEventListener("click", () => isHrUser() && openEmployeeForm());
  $("#request-leave")?.addEventListener("click", openLeaveForm);
  $("#generate-payroll")?.addEventListener("click", async (event) => {
    if (!isHrUser()) return;
    hideFeedback("#payroll-feedback");
    const records = await runAction({
      button: event.currentTarget,
      loadingContent: `${icon("clock")}Generating…`,
      onError: (error) => setFeedback("#payroll-feedback", error.message, true),
      action: async () => {
        const generated = await store.generatePayroll(app.payrollPeriod);
        app.data = await store.load();
        renderAll();
        return generated;
      },
    });
    if (records) {
      setFeedback("#payroll-feedback", `${records.length} draft payslips generated for ${formatPeriod(app.payrollPeriod)}.`);
    }
  });
  $("#refresh-payroll")?.addEventListener("click", async (event) => {
    if (!isHrUser()) return;
    hideFeedback("#payroll-feedback");
    const records = await runAction({
      button: event.currentTarget,
      loadingContent: `${icon("clock")}Refreshing…`,
      onError: (error) => setFeedback("#payroll-feedback", error.message, true),
      action: async () => {
        const refreshed = await store.refreshDraftPayroll(app.payrollPeriod);
        app.data = await store.load();
        renderAll();
        return refreshed;
      },
    });
    if (records) {
      setFeedback("#payroll-feedback", `${records.length} draft payslips refreshed for ${formatPeriod(app.payrollPeriod)}.`);
    }
  });
  $("#finalize-payroll")?.addEventListener("click", async (event) => {
    if (!isHrUser()) return;
    hideFeedback("#payroll-feedback");
    const records = await runAction({
      button: event.currentTarget,
      loadingContent: `${icon("clock")}Finalizing…`,
      onError: (error) => setFeedback("#payroll-feedback", error.message, true),
      action: async () => {
        const finalized = await store.finalizePayroll(app.payrollPeriod);
        app.data = await store.load();
        renderAll();
        return finalized;
      },
    });
    if (records) {
      setFeedback("#payroll-feedback", `${records.length} payslips finalized for ${formatPeriod(app.payrollPeriod)}.`);
    }
  });
  $("[data-demo-action='signout']")?.addEventListener("click", () => {
    sessionStorage.removeItem(SESSION_USER_KEY);
    location.assign(LOGIN_URL);
  });
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
    if (!sessionStorage.getItem(SESSION_USER_KEY)) {
      showLogin();
      return;
    }

    await loadPagePartials();
    app.data = await store.load();
    const sessionEmployee = restoreSession();
    if (!sessionEmployee) {
      showLogin();
      return;
    }

    enterApp(sessionEmployee);
    navigate(location.hash.slice(1) || "overview", false);
  } catch (error) {
    const root = $("#views-root");
    if (root) {
      root.innerHTML = `<div class="error-state">Unable to load the workspace: ${escapeHtml(error.message)} Refresh the page after checking that the backend is running.</div>`;
    }
    $("#app-status").textContent = error.message;
  }
}

init();
