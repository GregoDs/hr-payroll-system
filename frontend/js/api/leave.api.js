import { apiRequest } from "./client.js";

export const leaveApi = {
  list: () => apiRequest("/leaves"),
  create: (payload) => apiRequest("/leaves", { method: "POST", body: JSON.stringify(payload) }),
  decide: (id, decision, managerId, managerComment) => {
    const action = decision === "Approved" ? "approve" : "reject";
    return apiRequest(
      `/leaves/${id}/${action}`,
      { method: "PATCH", body: JSON.stringify({ manager_id: managerId, manager_comment: managerComment }) },
    );
  },
};
