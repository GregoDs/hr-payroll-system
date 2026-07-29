export const LEAVE_ALLOWANCE = 21;
export const MAX_TEAM_ABSENCES = 1;
export const ESCALATION_DAYS = 3;

export function minimumNoticeDays(leaveType) {
  if (leaveType === "Sick" || leaveType === "Compassionate") return 0;
  if (leaveType === "Maternity" || leaveType === "Paternity") return 14;
  return 7;
}

export function calendarDays(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  return Math.floor((end - start) / 86400000) + 1;
}

export function noticeDays(startDate, today = "2026-07-28") {
  const start = new Date(`${startDate}T00:00:00Z`);
  const reference = new Date(`${today}T00:00:00Z`);
  return Math.floor((start - reference) / 86400000);
}

export function requestsOverlap(left, right) {
  return left.start_date <= right.end_date && left.end_date >= right.start_date;
}

export function leaveBalance(employeeId, requests, allowance = LEAVE_ALLOWANCE) {
  const annual = requests.filter((request) => request.employee_id === employeeId && request.leave_type === "Annual");
  const used = annual
    .filter((request) => request.status === "Approved")
    .reduce((total, request) => total + Number(request.total_days), 0);
  const pending = annual
    .filter((request) => request.status === "Pending")
    .reduce((total, request) => total + Number(request.total_days), 0);
  return { allowance, used, pending, remaining: Math.max(allowance - used, 0) };
}

export function teamAbsencesDuring(request, allRequests, employees) {
  const employee = employees.find((item) => item.id === request.employee_id);
  if (!employee) return 0;
  return allRequests.filter((item) => {
    const colleague = employees.find((person) => person.id === item.employee_id);
    return item.id !== request.id &&
      ["Pending", "Approved"].includes(item.status) &&
      colleague?.team_id === employee.team_id &&
      requestsOverlap(item, request);
  }).length;
}

export function validateLeaveApproval(request, { employees, leaveRequests, today = "2026-07-28" }) {
  const problems = [];
  const employee = employees.find((item) => item.id === request.employee_id);
  const balance = leaveBalance(request.employee_id, leaveRequests);
  const notice = noticeDays(request.start_date, today);
  const requiredNotice = minimumNoticeDays(request.leave_type);
  const concurrentAbsences = teamAbsencesDuring(request, leaveRequests, employees);

  if (!employee || !employee.is_active) problems.push("Employee is inactive.");
  if (request.status !== "Pending") problems.push("Request has already been processed.");
  if (request.leave_type === "Annual" && request.total_days > balance.remaining) problems.push("Insufficient annual leave balance.");
  if (notice < requiredNotice) problems.push(`Requires ${requiredNotice} days' notice.`);
  if (request.leave_type !== "Sick" && concurrentAbsences >= MAX_TEAM_ABSENCES) {
    problems.push("Someone from this team is already away during those dates. Choose different dates or arrange cover first.");
  }
  const overlap = leaveRequests.some((item) =>
    item.id !== request.id &&
    item.employee_id === request.employee_id &&
    ["Pending", "Approved"].includes(item.status) &&
    requestsOverlap(item, request));
  if (overlap) problems.push("Overlaps another active leave request.");

  return {
    valid: problems.length === 0,
    problems,
    balance,
    notice,
    requiredNotice,
    concurrentAbsences,
  };
}
