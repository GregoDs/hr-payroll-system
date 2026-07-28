const express = require("express");
const router = express.Router();

const {
    getAllLeaveRequests,
    getLeaveRequestById,
    getLeaveRequestsByEmployeeId,
    createLeaveRequest,
    approveLeaveRequest,
    rejectLeaveRequest,
    deleteLeaveRequest
} = require("./leave.controller");

const { validateCreateLeaveRequest, validateLeaveDecision } = require("./leave.validation");


router.get("/", getAllLeaveRequests);
router.post("/", validateCreateLeaveRequest, createLeaveRequest);
router.get("/employee/:employeeId", getLeaveRequestsByEmployeeId);
router.patch("/:leaveId/approve", validateLeaveDecision, approveLeaveRequest);
router.patch("/:leaveId/reject", validateLeaveDecision, rejectLeaveRequest);
router.get("/:leaveId", getLeaveRequestById);
router.delete("/:leaveId", deleteLeaveRequest);


module.exports = router;
