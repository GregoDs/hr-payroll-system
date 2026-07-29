import { openDialog, closeDialog } from "../components/dialog.js";
import { formatCurrency, formatPeriod } from "../utils/format.js";
import { createField, addFormActions, createFormError } from "../ui/forms.js";
import { runAction } from "../ui/async-action.js";
import { escapeHtml, icon, setFeedback, toast } from "../ui/presentation.js";

export function createPayrollWorkflows({ app, store, renderAll }) {
  function openPayslip(record) {
    const content = document.createElement("div");
    content.innerHTML = `
      <div class="payslip-head"><p class="eyebrow">${icon("receipt")}${escapeHtml(record.employee_code)} · ${escapeHtml(formatPeriod(record.pay_period))}</p><h3>${escapeHtml(record.employee_name)}</h3><p class="page-intro">${escapeHtml(record.role_title)} · ${escapeHtml(record.team_name)}</p></div>
      <div class="payslip-grid">
        <div class="payslip-line"><span>${icon("banknote")}Basic salary</span><strong>${formatCurrency(record.basic_salary)}</strong></div>
        <div class="payslip-line"><span>${icon("banknote")}Gross pay</span><strong>${formatCurrency(record.gross_pay)}</strong></div>
        <div class="payslip-line"><span>${icon("fileText")}Tax</span><strong>- ${formatCurrency(record.tax_deduction)}</strong></div>
        <div class="payslip-line"><span>${icon("shield")}Social security</span><strong>- ${formatCurrency(record.social_security_deduction)}</strong></div>
        <div class="payslip-line"><span>${icon("calendar")}Unpaid leave · ${record.unpaid_leave_days} days</span><strong>- ${formatCurrency(record.unpaid_leave_deduction)}</strong></div>
        <div class="payslip-line"><span>${icon("check")}Status</span><strong>${escapeHtml(record.status)}</strong></div>
      </div><div class="payslip-net"><span>${icon("banknote")}Net pay</span><strong>${formatCurrency(record.net_pay)}</strong></div>
      ${record.status === "Draft" ? `
        <div class="form-actions">
          <button class="button button--primary" type="button" data-edit-current-payslip-salary>
            ${icon("edit")}Edit basic salary
          </button>
        </div>` : ""}`;
    content.querySelector("[data-edit-current-payslip-salary]")?.addEventListener("click", () => {
      openBasicSalaryDialog(record);
    });
    openDialog({ title: "Payslip detail", eyebrow: `Payroll #${record.id}`, content });
  }

  function openBasicSalaryDialog(record) {
    const form = document.createElement("form");
    form.className = "form-grid";
    const salary = createField("Basic salary (KES)", "basic_salary", "number", record.basic_salary);
    salary.classList.add("field--full");
    form.append(salary);

    const error = createFormError();
    form.append(error);
    addFormActions(form, "Update draft salary", icon);

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      error.textContent = "";
      const submit = form.querySelector("[type='submit']");
      const basicSalary = Number(new FormData(form).get("basic_salary"));
      if (!Number.isFinite(basicSalary) || basicSalary <= 0) {
        error.textContent = "Enter a valid basic salary greater than zero.";
        return;
      }

      const saved = await runAction({
        button: submit,
        loadingContent: `${icon("clock")}Updating…`,
        onError: (caught) => { error.textContent = caught.message; },
        action: async () => {
          await store.updatePayrollBasicSalary(record.id, basicSalary);
          app.data = await store.load();
          return true;
        },
      });

      if (saved) {
        renderAll();
        closeDialog();
        const message = `${record.employee_name}'s draft basic salary was updated to ${formatCurrency(basicSalary)}.`;
        setFeedback("#payroll-feedback", message);
        toast(message);
      }
    });

    openDialog({
      title: "Edit draft basic salary",
      eyebrow: `${record.employee_name} · ${formatPeriod(record.pay_period)}`,
      content: form,
    });
  }

  return { openPayslip, openBasicSalaryDialog };
}
