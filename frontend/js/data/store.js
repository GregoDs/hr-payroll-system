import { employees as seedEmployees, leaveRequests as seedLeave, payrollRecords as seedPayroll, teams } from "../../data/dummy-data.js";
import { calculatePayroll } from "../domain/payroll.js";

const copy = (value) => structuredClone(value);

const state = {
  employees: copy(seedEmployees),
  leaveRequests: copy(seedLeave),
  payrollRecords: copy(seedPayroll),
  teams: copy(teams),
};

function enrichEmployee(employee) {
  const team = state.teams.find((item) => item.id === Number(employee.team_id));
  const manager = state.employees.find((item) => item.id === Number(employee.manager_id));
  return {
    ...employee,
    team_name: team?.name ?? employee.team_name ?? "Unassigned",
    manager_name: manager ? `${manager.first_name} ${manager.last_name}` : null,
  };
}

export const mockStore = {
  async load() {
    await Promise.resolve();
    return copy(state);
  },

  getSnapshot() {
    return copy(state);
  },

  async login(email, password) {
    await Promise.resolve();
    if (password !== "12345") throw new Error("Use the demo password 12345.");
    const employee = state.employees.find((item) => item.email.toLowerCase() === String(email).trim().toLowerCase());
    if (!employee) throw new Error("No employee exists for that email.");
    if (!employee.is_active) throw new Error("This employee account is inactive.");
    return copy(employee);
  },

  async decideLeave(id, decision, managerComment = null) {
    const request = state.leaveRequests.find((item) => item.id === Number(id));
    if (!request) throw new Error("Leave request was not found.");
    if (request.status !== "Pending") throw new Error("Only pending requests can be processed.");
    request.status = decision;
    request.approved_by = 1;
    request.approved_by_name = "Grace Mwangi";
    request.approved_at = "2026-07-28 12:00:00";
    request.manager_comment = managerComment;
    request.updated_at = "2026-07-28 12:00:00";
    return copy(request);
  },

  async createLeave(payload) {
    const employee = state.employees.find((item) => item.id === Number(payload.employee_id));
    const request = {
      id: Math.max(0, ...state.leaveRequests.map((item) => item.id)) + 1,
      employee_id: Number(payload.employee_id),
      employee_code: employee.employee_code,
      employee_name: `${employee.first_name} ${employee.last_name}`,
      role_title: employee.role_title,
      team_name: employee.team_name,
      leave_type: payload.leave_type,
      start_date: payload.start_date,
      end_date: payload.end_date,
      reason: payload.reason,
      status: "Pending",
      approved_by: null,
      approved_by_name: null,
      approved_at: null,
      manager_comment: null,
      total_days: Number(payload.total_days),
      submitted_at: "2026-07-28 12:00:00",
      created_at: "2026-07-28 12:00:00",
      updated_at: "2026-07-28 12:00:00",
    };
    state.leaveRequests.unshift(request);
    return copy(request);
  },

  async saveEmployee(payload, id = null) {
    if (id) {
      const index = state.employees.findIndex((item) => item.id === Number(id));
      if (index < 0) throw new Error("Employee was not found.");
      state.employees[index] = enrichEmployee({ ...state.employees[index], ...payload, id: Number(id) });
      return copy(state.employees[index]);
    }
    const nextId = Math.max(0, ...state.employees.map((item) => item.id)) + 1;
    const employee = enrichEmployee({
      ...payload,
      id: nextId,
      employee_code: `EMP-2026-${String(nextId).padStart(3, "0")}`,
      is_active: 1,
      end_date: null,
      created_at: "2026-07-28 12:00:00",
      updated_at: "2026-07-28 12:00:00",
    });
    state.employees.push(employee);
    return copy(employee);
  },

  async setEmployeeActive(id, active) {
    const employee = state.employees.find((item) => item.id === Number(id));
    if (!employee) throw new Error("Employee was not found.");
    employee.is_active = active ? 1 : 0;
    employee.end_date = active ? null : "2026-07-28";
    employee.updated_at = "2026-07-28 12:00:00";
    return copy(employee);
  },

  async generatePayroll(payPeriod) {
    if (state.payrollRecords.some((item) => item.pay_period === payPeriod)) {
      throw new Error(`Payroll already exists for ${payPeriod}.`);
    }
    const eligible = state.employees.filter((employee) =>
      employee.is_active && employee.start_date <= `${payPeriod}-31`);
    const generatedAt = "2026-07-28 12:00:00";
    const records = eligible.map((employee, index) => ({
      id: Math.max(0, ...state.payrollRecords.map((item) => item.id)) + index + 1,
      employee_id: employee.id,
      employee_code: employee.employee_code,
      employee_name: `${employee.first_name} ${employee.last_name}`,
      role_title: employee.role_title,
      team_name: employee.team_name,
      pay_period: payPeriod,
      ...calculatePayroll(employee, payPeriod, state.leaveRequests),
      status: "Draft",
      generated_by: 1,
      generated_by_name: "Grace Mwangi",
      generated_at: generatedAt,
      created_at: generatedAt,
      updated_at: generatedAt,
    }));
    state.payrollRecords.unshift(...records);
    return copy(records);
  },

  async finalizePayroll(payPeriod) {
    const records = state.payrollRecords.filter((item) => item.pay_period === payPeriod);
    if (!records.length) throw new Error(`No payroll exists for ${payPeriod}.`);
    const drafts = records.filter((item) => item.status === "Draft");
    if (!drafts.length) throw new Error(`No draft payroll remains for ${payPeriod}.`);
    drafts.forEach((record) => {
      record.status = "Finalized";
      record.finalized_by = 1;
      record.finalized_by_name = "Grace Mwangi";
      record.finalized_at = "2026-07-29 12:00:00";
      record.updated_at = "2026-07-29 12:00:00";
    });
    return copy(drafts);
  },
};
