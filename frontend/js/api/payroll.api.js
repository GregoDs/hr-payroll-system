import { apiRequest } from "./client.js";

export const payrollApi = {
  list: () => apiRequest("/payroll"),
  generate: (payPeriod, generatedBy) => apiRequest("/payroll/generate", {
    method: "POST",
    body: JSON.stringify({ pay_period: payPeriod, generated_by: generatedBy }),
  }),
  finalize: (id, managerId) => apiRequest(`/payroll/${id}/finalize`, {
    method: "PATCH",
    body: JSON.stringify({ manager_id: managerId }),
  }),
  updateBasicSalary: (id, basicSalary) => apiRequest(`/payroll/${id}/basic-salary`, {
    method: "PATCH",
    body: JSON.stringify({ basic_salary: basicSalary }),
  }),
  refreshDraft: (payPeriod) => apiRequest("/payroll/refresh-draft", {
    method: "PATCH",
    body: JSON.stringify({ pay_period: payPeriod }),
  }),
};
