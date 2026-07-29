const db = require("../database/database");

function getAllLeaveRequests() {

    const query = `
        SELECT
            lr.id,
            lr.employee_id,
            e.employee_code,
            e.first_name || ' ' || e.last_name AS employee_name,
            e.role_title,
            e.team_id,
            t.name AS team_name,
            lr.leave_type,
            lr.start_date,
            lr.end_date,
            lr.reason,
            lr.status,
            lr.approved_by,
            a.first_name || ' ' || a.last_name AS approved_by_name,
            lr.approved_at,
            lr.manager_comment,
            lr.total_days,
            lr.submitted_at,
            lr.created_at,
            lr.updated_at
        FROM leave_requests lr
        INNER JOIN employees e
            ON lr.employee_id = e.id
        LEFT JOIN teams t
            ON e.team_id = t.id
        LEFT JOIN employees a
            ON lr.approved_by = a.id
        ORDER BY lr.created_at DESC
    `;

    return new Promise((resolve, reject) => {
        db.all(query, (err, rows) => {
            if (err) {
                return reject(err);
            }

            resolve(rows);
        });
    });
}


function getLeaveRequestById(leaveId) {

    const query = `
        SELECT
            lr.id,
            lr.employee_id,
            e.employee_code,
            e.first_name || ' ' || e.last_name AS employee_name,
            e.role_title,
            e.team_id,
            t.name AS team_name,
            lr.leave_type,
            lr.start_date,
            lr.end_date,
            lr.reason,
            lr.status,
            lr.approved_by,
            a.first_name || ' ' || a.last_name AS approved_by_name,
            lr.approved_at,
            lr.manager_comment,
            lr.total_days,
            lr.submitted_at,
            lr.created_at,
            lr.updated_at
        FROM leave_requests lr
        INNER JOIN employees e
            ON lr.employee_id = e.id
        LEFT JOIN teams t
            ON e.team_id = t.id
        LEFT JOIN employees a
            ON lr.approved_by = a.id
        WHERE lr.id = ?
    `;

    return new Promise((resolve, reject) => {
        db.get(query, [leaveId], (err, row) => {
            if (err) {
                return reject(err);
            }

            resolve(row);
        });
    });
}


function getLeaveRequestsByEmployeeId(employeeId) {

    const query = `
        SELECT
            lr.id,
            lr.employee_id,
            e.employee_code,
            e.first_name || ' ' || e.last_name AS employee_name,
            e.role_title,
            e.team_id,
            t.name AS team_name,
            lr.leave_type,
            lr.start_date,
            lr.end_date,
            lr.reason,
            lr.status,
            lr.approved_by,
            a.first_name || ' ' || a.last_name AS approved_by_name,
            lr.approved_at,
            lr.manager_comment,
            lr.total_days,
            lr.submitted_at,
            lr.created_at,
            lr.updated_at
        FROM leave_requests lr
        INNER JOIN employees e
            ON lr.employee_id = e.id
        LEFT JOIN teams t
            ON e.team_id = t.id
        LEFT JOIN employees a
            ON lr.approved_by = a.id
        WHERE lr.employee_id = ?
        ORDER BY lr.start_date DESC
    `;

    return new Promise((resolve, reject) => {
        db.all(query, [employeeId], (err, rows) => {
            if (err) {
                return reject(err);
            }

            resolve(rows);
        });
    });
}


function createLeaveRequest(leaveRequest) {

    const query = `
        INSERT INTO leave_requests (
            employee_id,
            leave_type,
            start_date,
            end_date,
            reason,
            status,
            total_days
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        leaveRequest.employee_id,
        leaveRequest.leave_type,
        leaveRequest.start_date,
        leaveRequest.end_date,
        leaveRequest.reason,
        leaveRequest.status,
        leaveRequest.total_days
    ];

    return new Promise((resolve, reject) => {
        db.run(query, values, function (err) {
            if (err) {
                return reject(err);
            }

            resolve(this.lastID);
        });
    });
}


function updateLeaveStatus(leaveId, leaveRequest) {

    const query = `
        UPDATE leave_requests
        SET
            status = ?,
            approved_by = ?,
            approved_at = ?,
            manager_comment = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `;

    const values = [
        leaveRequest.status,
        leaveRequest.approved_by,
        leaveRequest.approved_at,
        leaveRequest.manager_comment,
        leaveId
    ];

    return new Promise((resolve, reject) => {
        db.run(query, values, function (err) {
            if (err) {
                return reject(err);
            }

            resolve({
                changes: this.changes
            });
        });
    });
}


function deleteLeaveRequest(leaveId) {

    const query = `
        DELETE FROM leave_requests
        WHERE id = ?
    `;

    return new Promise((resolve, reject) => {
        db.run(query, [leaveId], function (err) {
            if (err) {
                return reject(err);
            }

            resolve({
                changes: this.changes
            });
        });
    });
}


module.exports = {
    getAllLeaveRequests,
    getLeaveRequestById,
    getLeaveRequestsByEmployeeId,
    createLeaveRequest,
    updateLeaveStatus,
    deleteLeaveRequest,
};
