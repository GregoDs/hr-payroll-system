import test from "node:test";
import assert from "node:assert/strict";
import { mockStore } from "../js/data/store.js";

test("payroll finalization converts selected-period drafts to finalized", async () => {
  await mockStore.generatePayroll("2026-08");
  const finalized = await mockStore.finalizePayroll("2026-08");
  const snapshot = mockStore.getSnapshot();
  const august = snapshot.payrollRecords.filter((record) => record.pay_period === "2026-08");

  assert.ok(finalized.length > 0);
  assert.equal(august.every((record) => record.status === "Finalized"), true);
  assert.equal(august.every((record) => record.finalized_at), true);
});

test("login resolves role from unique employee email", async () => {
  const employee = await mockStore.login("brian@company.com", "12345");

  assert.equal(employee.employee_code, "EMP-2026-004");
  assert.equal(employee.system_role, "Employee");
});

test("login rejects the wrong demo password", async () => {
  await assert.rejects(
    () => mockStore.login("grace@company.com", "wrong"),
    /demo password 12345/,
  );
});
