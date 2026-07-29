import { openDialog, closeDialog } from "../components/dialog.js";
import { createField, addFormActions, createFormError } from "../ui/forms.js";
import { runAction } from "../ui/async-action.js";
import { icon, nameOf, toast } from "../ui/presentation.js";

export function createEmployeeWorkflows({ app, store, renderAll }) {
  function openEmployeeForm(employee = null) {
    const form = document.createElement("form");
    form.className = "form-grid";
    const departmentManagers = app.data.employees.filter((item) =>
      item.is_active &&
      item.id !== employee?.id &&
      ["Manager", "Admin"].includes(item.system_role));
    const managerOptions = [["", "No manager"], ...departmentManagers.map((item) =>
      [item.id, `${nameOf(item)} — ${item.team_name}`])];
    const teamOptions = app.data.teams.map((team) => [team.id, team.name]);
    [
      createField("First name", "first_name", "text", employee?.first_name),
      createField("Last name", "last_name", "text", employee?.last_name),
      createField("Email", "email", "email", employee?.email),
      createField("Phone number", "phone_number", "tel", employee?.phone_number),
      createField("National ID", "national_id", "text", employee?.national_id),
      createField("KRA PIN", "kra_pin", "text", employee?.kra_pin, null, false),
      createField("Role title", "role_title", "text", employee?.role_title),
      createField(
        "System role",
        "system_role",
        "select",
        employee?.system_role ?? "Employee",
        ["Employee", "Manager", "HR", "Admin"].map((role) => [role, role]),
      ),
      createField("Team", "team_id", "select", employee?.team_id, teamOptions),
      createField("Manager", "manager_id", "select", employee?.manager_id ?? "", managerOptions, false),
      createField("Employment type", "employment_type", "select", employee?.employment_type ?? "Permanent", [["Permanent", "Permanent"], ["Contract", "Contract"], ["Intern", "Intern"]]),
      createField("Monthly salary (KES)", "salary", "number", employee?.salary),
      createField("Start date", "start_date", "date", employee?.start_date),
    ].forEach((field) => form.append(field));

    const teamSelect = form.elements.team_id;
    const managerSelect = form.elements.manager_id;
    const managerForTeam = (teamId) => departmentManagers.find(
      (manager) => Number(manager.team_id) === Number(teamId),
    );
    const syncManagerToTeam = () => {
      const manager = managerForTeam(teamSelect.value);
      managerSelect.value = manager ? String(manager.id) : "";
    };
    const syncTeamToManager = () => {
      const manager = departmentManagers.find(
        (item) => item.id === Number(managerSelect.value),
      );
      if (manager) teamSelect.value = String(manager.team_id);
    };

    teamSelect.addEventListener("change", syncManagerToTeam);
    managerSelect.addEventListener("change", syncTeamToManager);
    syncManagerToTeam();

    const error = createFormError();
    form.append(error);
    addFormActions(form, employee ? "Save changes" : "Add employee", icon);
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const submit = form.querySelector("[type='submit']");
      const saved = await runAction({
        button: submit,
        loadingContent: `${icon("clock")}Saving…`,
        onError: (caught) => { error.textContent = caught.message; },
        action: async () => {
          const values = Object.fromEntries(new FormData(form));
          values.team_id = Number(values.team_id);
          values.manager_id = values.manager_id ? Number(values.manager_id) : null;
          values.salary = Number(values.salary);
          await store.saveEmployee(values, employee?.id);
          app.data = await store.load();
          return true;
        },
      });
      if (saved) {
        renderAll(); closeDialog();
        toast(employee ? "Employee record updated." : "Employee added to the directory.");
      }
    });
    openDialog({ title: employee ? "Edit employee" : "Add employee", eyebrow: "Employee record", content: form });
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
    const error = createFormError();
    const cancel = document.createElement("button");
    cancel.className = "button";
    cancel.type = "button";
    cancel.innerHTML = `${icon("x")}Cancel`;
    cancel.dataset.closeModal = "";
    const confirm = document.createElement("button");
    confirm.className = `button ${employee.is_active ? "button--danger" : "button--primary"}`;
    confirm.type = "button";
    confirm.innerHTML = `${icon(employee.is_active ? "slash" : "check")}${employee.is_active ? "Deactivate" : "Reactivate"}`;
    confirm.addEventListener("click", async () => {
      const nextActiveState = !employee.is_active;
      const saved = await runAction({
        button: confirm,
        loadingContent: `${icon("clock")}Updating…`,
        onError: (caught) => { error.textContent = caught.message; },
        action: async () => {
          await store.setEmployeeActive(employee.id, nextActiveState);
          app.data = await store.load();
          app.employeeFilters.status = "all";
          document.querySelector("#status-filter").value = "all";
          return true;
        },
      });
      if (saved) {
        renderAll(); closeDialog();
        toast(`${nameOf(employee)} is now ${nextActiveState ? "active" : "inactive"}.`);
      }
    });
    actions.append(cancel, confirm);
    wrapper.append(copy, error, actions);
    openDialog({ title: `${employee.is_active ? "Deactivate" : "Reactivate"} employee`, eyebrow: "Employment status", content: wrapper });
  }

  return { openEmployeeForm, openDeactivateDialog };
}
