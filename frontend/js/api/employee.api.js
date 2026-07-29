import { apiRequest } from "./client.js";

export const employeeApi = {
  list: () => apiRequest("/employees"),
  create: (payload) => apiRequest("/employees", { method: "POST", body: JSON.stringify(payload) }),
  update: (id, payload) => apiRequest(`/employees/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  setActive: (id, isActive) => apiRequest(`/employees/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ is_active: isActive ? 1 : 0 }),
  }),
};
