import test from "node:test";
import assert from "node:assert/strict";
import {
  leaveBalance,
  minimumNoticeDays,
  requestsOverlap,
  validateLeaveApproval,
} from "../js/domain/leave-rules.js";

test("notice thresholds reflect leave type", () => {
  assert.equal(minimumNoticeDays("Sick"), 0);
  assert.equal(minimumNoticeDays("Annual"), 7);
  assert.equal(minimumNoticeDays("Maternity"), 14);
});

test("touching date ranges overlap", () => {
  assert.equal(requestsOverlap(
    { start_date: "2026-08-01", end_date: "2026-08-05" },
    { start_date: "2026-08-05", end_date: "2026-08-07" },
  ), true);
});

test("annual balance separates used and pending days", () => {
  const requests = [
    { employee_id: 1, leave_type: "Annual", status: "Approved", total_days: 5 },
    { employee_id: 1, leave_type: "Annual", status: "Pending", total_days: 3 },
    { employee_id: 1, leave_type: "Sick", status: "Approved", total_days: 2 },
  ];
  assert.deepEqual(leaveBalance(1, requests), { allowance: 21, used: 5, pending: 3, remaining: 16 });
});

test("approval blocks insufficient balance", () => {
  const request = {
    id: 2,
    employee_id: 1,
    leave_type: "Annual",
    start_date: "2026-09-10",
    end_date: "2026-10-09",
    total_days: 30,
    status: "Pending",
  };
  const result = validateLeaveApproval(request, {
    employees: [{ id: 1, team_id: 1, is_active: 1 }],
    leaveRequests: [request],
    today: "2026-07-28",
  });
  assert.equal(result.valid, false);
  assert.match(result.problems.join(" "), /Insufficient annual leave balance/);
});

test("approval blocks overlapping pending leave in the same team", () => {
  const request = {
    id: 2,
    employee_id: 1,
    leave_type: "Annual",
    start_date: "2026-09-10",
    end_date: "2026-09-14",
    total_days: 5,
    status: "Pending",
  };
  const result = validateLeaveApproval(request, {
    employees: [
      { id: 1, team_id: 1, is_active: 1 },
      { id: 2, team_id: 1, is_active: 1 },
    ],
    leaveRequests: [
      request,
      {
        id: 3,
        employee_id: 2,
        leave_type: "Annual",
        start_date: "2026-09-12",
        end_date: "2026-09-16",
        total_days: 5,
        status: "Pending",
      },
    ],
    today: "2026-07-28",
  });

  assert.equal(result.valid, false);
  assert.match(result.problems.join(" "), /already away during those dates/);
});

test("sick leave bypasses team coverage conflict", () => {
  const request = {
    id: 2,
    employee_id: 1,
    leave_type: "Sick",
    start_date: "2026-09-10",
    end_date: "2026-09-14",
    total_days: 5,
    status: "Pending",
  };
  const result = validateLeaveApproval(request, {
    employees: [
      { id: 1, team_id: 1, is_active: 1 },
      { id: 2, team_id: 1, is_active: 1 },
    ],
    leaveRequests: [
      request,
      {
        id: 3,
        employee_id: 2,
        leave_type: "Annual",
        start_date: "2026-09-12",
        end_date: "2026-09-16",
        total_days: 5,
        status: "Pending",
      },
    ],
    today: "2026-09-10",
  });

  assert.equal(result.valid, true);
  assert.equal(result.concurrentAbsences, 1);
});

test("approved sick leave blocks ordinary leave in the same team", () => {
  const request = {
    id: 2,
    employee_id: 1,
    leave_type: "Annual",
    start_date: "2026-09-10",
    end_date: "2026-09-14",
    total_days: 5,
    status: "Pending",
  };
  const result = validateLeaveApproval(request, {
    employees: [
      { id: 1, team_id: 1, is_active: 1 },
      { id: 2, team_id: 1, is_active: 1 },
    ],
    leaveRequests: [
      request,
      {
        id: 3,
        employee_id: 2,
        leave_type: "Sick",
        start_date: "2026-09-12",
        end_date: "2026-09-16",
        total_days: 5,
        status: "Approved",
      },
    ],
    today: "2026-07-28",
  });

  assert.equal(result.valid, false);
  assert.match(result.problems.join(" "), /already away during those dates/);
});
