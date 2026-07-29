import { apiRequest } from "../api/client.js";
import { employeeApi } from "../api/employee.api.js";
import { leaveApi } from "../api/leave.api.js";
import { payrollApi } from "../api/payroll.api.js";

let snapshot = { employees: [], leaveRequests: [], payrollRecords: [], teams: [] };
let activeUserId = null;

export const liveStore = {
  async load() {
    const [employees, leaveRequests, payrollRecords, teams] = await Promise.all([
      employeeApi.list(),
      leaveApi.list(),
      payrollApi.list(),
      apiRequest("/teams"),
    ]);
    snapshot = { employees, leaveRequests, payrollRecords, teams };
    return structuredClone(snapshot);
  },

  async login(email, password) {
    const employee = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    activeUserId = Number(employee.id);
    return employee;
  },

  setActiveUser(id) {
    activeUserId = Number(id);
  },

  saveEmployee(payload, id = null) {
    if (id) {
      const existing = snapshot.employees.find((employee) => employee.id === Number(id));
      return employeeApi.update(id, { ...existing, ...payload });
    }
    return employeeApi.create(payload);
  },

  setEmployeeActive(id, active) {
    return employeeApi.setActive(id, active);
  },

  createLeave(payload) {
    const { total_days, ...serverPayload } = payload;
    return leaveApi.create(serverPayload);
  },

  decideLeave(id, decision, managerComment = null) {
    if (!activeUserId) throw new Error("Your session has expired. Please sign in again.");
    return leaveApi.decide(id, decision, activeUserId, managerComment);
  },

  generatePayroll(payPeriod) {
    if (!activeUserId) throw new Error("Your session has expired. Please sign in again.");
    return payrollApi.generate(payPeriod, activeUserId);
  },

  async finalizePayroll(payPeriod) {
    if (!activeUserId) throw new Error("Your session has expired. Please sign in again.");
    const drafts = snapshot.payrollRecords.filter(
      (record) => record.pay_period === payPeriod && record.status === "Draft",
    );
    if (!drafts.length) throw new Error(`No draft payroll remains for ${payPeriod}.`);
    return Promise.all(drafts.map((record) => payrollApi.finalize(record.id, activeUserId)));
  },

  updatePayrollBasicSalary(id, basicSalary) {
    if (!activeUserId) throw new Error("Your session has expired. Please sign in again.");
    return payrollApi.updateBasicSalary(id, basicSalary);
  },

  refreshDraftPayroll(payPeriod) {
    if (!activeUserId) throw new Error("Your session has expired. Please sign in again.");
    return payrollApi.refreshDraft(payPeriod);
  },
};
