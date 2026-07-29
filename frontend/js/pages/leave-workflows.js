import { openDialog, closeDialog } from "../components/dialog.js";
import {
  calendarDays,
  minimumNoticeDays,
  noticeDays,
  teamAbsencesDuring,
  validateLeaveApproval,
  MAX_TEAM_ABSENCES,
} from "../domain/leave-rules.js";
import { formatDate, pluralize } from "../utils/format.js";
import { createField, addFormActions, createFormError } from "../ui/forms.js";
import { runAction } from "../ui/async-action.js";
import { $, escapeHtml, icon, nameOf, setFeedback, toast } from "../ui/presentation.js";

export function createLeaveWorkflows({ app, store, today, currentEmployee, isHrUser, renderAll, coverageMeta }) {
  function openLeaveForm() {
    const form = document.createElement("form");
    form.className = "form-grid";
    const employee = currentEmployee();
    const leaveEmployeeOptions = isHrUser()
      ? app.data.employees.filter((item) => item.is_active).map((item) => [item.id, nameOf(item)])
      : [[employee.id, nameOf(employee)]];
    [
      createField("Employee", "employee_id", "select", employee.id, leaveEmployeeOptions),
      createField("Leave type", "leave_type", "select", "Annual", ["Annual", "Sick", "Maternity", "Paternity", "Compassionate", "Study", "Unpaid"].map((item) => [item, item])),
      createField("Start date", "start_date", "date", "2026-08-10"),
      createField("End date", "end_date", "date", "2026-08-14"),
      createField("Reason", "reason", "textarea", ""),
    ].forEach((field, index) => {
      if (index === 4) field.classList.add("field--full");
      form.append(field);
    });
    const error = createFormError();
    form.append(error);
    addFormActions(form, "Submit request", icon);
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const submit = form.querySelector("[type='submit']");
      error.textContent = "";
      const values = Object.fromEntries(new FormData(form));
      const days = calendarDays(values.start_date, values.end_date);
      const required = minimumNoticeDays(values.leave_type);
      const notice = noticeDays(values.start_date, today);
      if (days <= 0) { error.textContent = "End date must be on or after the start date."; return; }
      if (notice < required) { error.textContent = `${values.leave_type} leave requires at least ${required} days' notice.`; return; }
      values.employee_id = Number(values.employee_id);
      values.total_days = days;
      const candidate = { ...values, id: -1, status: "Pending" };
      const overlapping = app.data.leaveRequests.some((request) =>
        request.employee_id === values.employee_id && ["Pending", "Approved"].includes(request.status) &&
        request.start_date <= values.end_date && request.end_date >= values.start_date);
      if (overlapping) { error.textContent = "This employee has an overlapping active request."; return; }
      if (values.leave_type !== "Sick" && teamAbsencesDuring(candidate, app.data.leaveRequests, app.data.employees) >= MAX_TEAM_ABSENCES) {
        error.textContent = "Someone from this team is already away during those dates. Choose different dates or arrange cover first."; return;
      }
      const saved = await runAction({
        button: submit,
        loadingContent: `${icon("clock")}Submitting…`,
        onError: (caught) => { error.textContent = caught.message; },
        action: async () => {
          await store.createLeave(values);
          app.data = await store.load();
          return true;
        },
      });
      if (saved) {
        renderAll(); closeDialog();
        toast("Leave request submitted for approval.");
      }
    });
    openDialog({ title: "Request leave", eyebrow: "New leave request", content: form });
  }

  function openRejectDialog(request) {
    const form = document.createElement("form");
    form.className = "form-grid";
    const reason = createField("Reason for rejection (optional)", "reason", "textarea", "", null, false);
    reason.classList.add("field--full");
    form.append(reason);
    const error = createFormError();
    form.append(error);
    addFormActions(form, "Reject request", icon);
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const submit = form.querySelector("[type='submit']");
      const saved = await runAction({
        button: submit,
        loadingContent: `${icon("clock")}Rejecting…`,
        onError: (caught) => { error.textContent = caught.message; },
        action: async () => {
          await store.decideLeave(request.id, "Rejected", new FormData(form).get("reason") || null);
          app.data = await store.load();
          return true;
        },
      });
      if (saved) {
        renderAll(); closeDialog();
        setFeedback("#leave-feedback", `${request.employee_name}'s leave request was rejected.`);
      }
    });
    openDialog({ title: `Reject ${request.employee_name}'s request?`, eyebrow: "Leave decision", content: form });
  }

  async function approveLeaveRequest(request, trigger = null) {
    const validation = validateLeaveApproval(request, { ...app.data, today });
    if (!validation.valid) {
      return { ok: false, message: validation.problems.join(" ") };
    }
    const originalTriggerContent = trigger?.innerHTML;
    if (trigger) {
      trigger.disabled = true;
      trigger.innerHTML = `${icon("clock")}Approving…`;
    }
    try {
      await store.decideLeave(request.id, "Approved", "Approved from workforce dashboard");
      app.data = await store.load();
      renderAll();
      return { ok: true, message: `${request.employee_name}'s leave was approved. Coverage and balance checks passed.` };
    } catch (caught) {
      return { ok: false, message: caught.message };
    } finally {
      if (trigger) {
        trigger.disabled = false;
        trigger.innerHTML = originalTriggerContent;
      }
    }
  }

  function leaveDecisionMarkup(request, validation) {
    const noticeHealthy = validation.notice >= validation.requiredNotice;
    const coverage = coverageMeta(request);
    const balanceHealthy = request.leave_type !== "Annual" || request.total_days <= validation.balance.remaining;
    const statusIcon = request.status === "Approved" ? "check" : request.status === "Rejected" ? "x" : "clock";
    const statusTone = request.status === "Approved" ? "status--approved" : request.status === "Rejected" ? "status--rejected" : "status--pending";

    return `
      <div class="decision-panel">
        <div class="payslip-head">
          <p class="eyebrow">${icon("calendar")}${escapeHtml(request.leave_type)} leave</p>
          <h3>${escapeHtml(request.employee_name)}</h3>
          <p class="page-intro">${escapeHtml(request.role_title)} · ${escapeHtml(request.team_name)}</p>
        </div>

        <div class="payslip-grid">
          <div class="payslip-line"><span>${icon("calendar")}Dates</span><strong>${formatDate(request.start_date)} - ${formatDate(request.end_date)}</strong></div>
          <div class="payslip-line"><span>${icon("clock")}Duration</span><strong>${pluralize(request.total_days, "day")}</strong></div>
          <div class="payslip-line"><span>${icon(noticeHealthy ? "check" : "alert")}Notice</span><strong class="${noticeHealthy ? "text-success" : "text-danger"}">${noticeHealthy ? "Notice met" : "Short notice"} · ${validation.notice} of ${validation.requiredNotice} days</strong></div>
          <div class="payslip-line"><span>${icon(coverage.iconName)}Coverage</span><strong class="${coverage.textClass}">${coverage.label} · ${validation.concurrentAbsences} away</strong></div>
          <div class="payslip-line"><span>${icon(balanceHealthy ? "check" : "alert")}Balance</span><strong class="${balanceHealthy ? "text-success" : "text-danger"}">${validation.balance.remaining} days remaining</strong></div>
          <div class="payslip-line"><span>${icon(statusIcon)}Status</span><strong><span class="status ${statusTone}">${icon(statusIcon)}${escapeHtml(request.status)}</span></strong></div>
        </div>

        <div class="decision-message" id="leave-dialog-message" aria-live="polite">
          ${validation.valid ? `${icon("check")}Ready for approval.` : `${icon("alert")} ${escapeHtml(validation.problems.join(" "))}`}
        </div>
      </div>`;
  }

  function openLeaveDecisionDialog(request) {
    const validation = validateLeaveApproval(request, { ...app.data, today });
    const wrapper = document.createElement("div");
    wrapper.innerHTML = leaveDecisionMarkup(request, validation);

    const actions = document.createElement("div");
    actions.className = "form-actions";

    const close = document.createElement("button");
    close.className = "button";
    close.type = "button";
    close.dataset.closeModal = "";
    close.innerHTML = `${icon("x")}Close`;
    actions.append(close);

    if (request.status === "Pending" && isHrUser()) {
      const reject = document.createElement("button");
      reject.className = "button";
      reject.type = "button";
      reject.innerHTML = `${icon("x")}Reject`;
      reject.addEventListener("click", () => openRejectDialog(request));

      const approve = document.createElement("button");
      approve.className = "button button--primary";
      approve.type = "button";
      approve.innerHTML = `${icon("check")}Approve`;
      approve.addEventListener("click", async () => {
        const result = await approveLeaveRequest(request, approve);
        if (!result.ok) {
          const message = $("#leave-dialog-message", wrapper);
          message.classList.add("is-error");
          message.innerHTML = `${icon("alert")}<span>${escapeHtml(result.message)}</span>`;
          return;
        }
        closeDialog();
        setFeedback("#leave-feedback", result.message);
        toast(result.message);
      });

      actions.append(reject, approve);
    }

    wrapper.append(actions);
    openDialog({ title: "Leave request detail", eyebrow: "Leave desk", content: wrapper });
  }

  return { openLeaveForm, openRejectDialog, approveLeaveRequest, openLeaveDecisionDialog };
}
