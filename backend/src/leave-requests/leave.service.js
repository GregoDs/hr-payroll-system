const leaveModel = require("./leave.model");


async function createLeaveRequest(leaveRequestData) {

    const startDate = parseDate(leaveRequestData.start_date, "Start date is invalid.", 400);
    const endDate = parseDate(leaveRequestData.end_date, "End date is invalid.", 400);

    if (startDate > endDate) {
        throw createError("Start date cannot be after end date.", 400);
    }

    const minimumNoticeDays = getMinimumNoticeDays(leaveRequestData.leave_type);
    const noticeDays = calculateNoticeDays(startDate);

    if (noticeDays < minimumNoticeDays) {
        throw createError(`${leaveRequestData.leave_type} leave requires at least ${minimumNoticeDays} days notice.`, 409);
    }

    //does he have leave already check
    const employeeLeaveRequests = await leaveModel.getLeaveRequestsByEmployeeId(leaveRequestData.employee_id);
    const existingSameLeaveRequest = employeeLeaveRequests.find((leaveRequest) => {
        return hasSameLeaveDates(leaveRequest, startDate, endDate);
    });

    if (existingSameLeaveRequest) {
        throw createError("Employee already made this leave request.", 409);
    }

    const overlappingLeave = employeeLeaveRequests.find((leaveRequest) => {
        return hasActiveOverlap(leaveRequest, startDate, endDate);
    });

    if (overlappingLeave) {
        throw createError("Employee already has an overlapping leave request.", 409);
    }

    const totalDays = calculateLeaveDays(startDate, endDate);

    const leaveRequestId = await leaveModel.createLeaveRequest({
        employee_id: leaveRequestData.employee_id,
        leave_type: leaveRequestData.leave_type,
        start_date: leaveRequestData.start_date,
        end_date: leaveRequestData.end_date,
        reason: leaveRequestData.reason,
        status: "Pending",
        total_days: totalDays
    });

    return await leaveModel.getLeaveRequestById(leaveRequestId);
}


//Get all leave requests existing
async function getAllLeaveRequests() {
    return await leaveModel.getAllLeaveRequests();
}


//Get a single leave request by the id requested
async function getLeaveRequestById(leaveId) {

    if (!leaveId) {
        throw createError("Leave request ID is required.", 400);
    }

    const leaveRequest = await leaveModel.getLeaveRequestById(leaveId);

    if (!leaveRequest) {
        throw createError("Leave request not found.", 404);
    }

    return leaveRequest;
}


//Get all leave requests for a particular employee
async function getLeaveRequestsByEmployeeId(employeeId) {

    if (!employeeId) {
        throw createError("Employee id is required.", 400);
    }

    return await leaveModel.getLeaveRequestsByEmployeeId(employeeId);
}


async function approveLeaveRequest(leaveId, managerId, comment) {

    if (!managerId) {
        throw createError("Manager id is required.", 400);
    }

    const leaveRequest = await getLeaveRequestById(leaveId);

    if (leaveRequest.status !== "Pending") {
        throw createError("Only pending leave requests can be approved.", 409);
    }

    await leaveModel.updateLeaveStatus(leaveId, {
        status: "Approved",
        approved_by: managerId,
        approved_at: new Date().toISOString(),
        manager_comment: comment || null
    });

    return await leaveModel.getLeaveRequestById(leaveId);
}


async function rejectLeaveRequest(leaveId, managerId, comment) {

    if (!managerId) {
        throw createError("Manager id is required.", 400);
    }

    const leaveRequest = await getLeaveRequestById(leaveId);

    if (leaveRequest.status !== "Pending") {
        throw createError("Only pending leave requests can be rejected.", 409);
    }

    await leaveModel.updateLeaveStatus(leaveId, {
        status: "Rejected",
        approved_by: managerId,
        approved_at: new Date().toISOString(),
        manager_comment: comment || null
    });

    return await leaveModel.getLeaveRequestById(leaveId);
}


async function deleteLeaveRequest(leaveId) {

    const leaveRequest = await getLeaveRequestById(leaveId);

    if (leaveRequest.status !== "Pending") {
        throw createError("Only pending leave requests can be deleted.", 409);
    }

    return await leaveModel.deleteLeaveRequest(leaveId);
}

//Helper functions

function calculateLeaveDays(startDate, endDate) {

    const millisecondsInDay = 24 * 60 * 60 * 1000;
    const difference = endDate.getTime() - startDate.getTime();

    return Math.floor(difference / millisecondsInDay) + 1;
}


function calculateNoticeDays(startDate) {

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const leaveStartDate = new Date(startDate);
    leaveStartDate.setHours(0, 0, 0, 0);

    const millisecondsInDay = 24 * 60 * 60 * 1000;
    const difference = leaveStartDate.getTime() - today.getTime();

    return Math.floor(difference / millisecondsInDay);
}


function getMinimumNoticeDays(leaveType) {

    if (leaveType === "Sick" || leaveType === "Compassionate") {
        return 0;
    }

    if (leaveType === "Maternity" || leaveType === "Paternity") {
        return 14;
    }

    return 7;
}


function hasActiveOverlap(leaveRequest, startDate, endDate) {

    if (leaveRequest.status === "Rejected" || leaveRequest.status === "Cancelled") {
        return false;
    }

    const existingStartDate = parseDate(leaveRequest.start_date, "Existing leave start date is invalid.", 400);
    const existingEndDate = parseDate(leaveRequest.end_date, "Existing leave end date is invalid.", 400);

    return startDate <= existingEndDate && endDate >= existingStartDate;
}


function hasSameLeaveDates(leaveRequest, startDate, endDate) {

    if (leaveRequest.status === "Rejected" || leaveRequest.status === "Cancelled") {
        return false;
    }

    const existingStartDate = parseDate(leaveRequest.start_date, "Existing leave start date is invalid.", 400);
    const existingEndDate = parseDate(leaveRequest.end_date, "Existing leave end date is invalid.", 400);

    return existingStartDate.getTime() === startDate.getTime() && existingEndDate.getTime() === endDate.getTime();
}


function parseDate(value, errorMessage, statusCode) {

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        throw createError(errorMessage, statusCode);
    }

    return date;
}


//Helper function for errors
function createError(message, statusCode = 500) {

    const error = new Error(message);
    error.statusCode = statusCode;

    return error;
}

module.exports = {
    createLeaveRequest,
    getAllLeaveRequests,
    getLeaveRequestById,
    getLeaveRequestsByEmployeeId,
    approveLeaveRequest,
    rejectLeaveRequest,
    deleteLeaveRequest,
};
