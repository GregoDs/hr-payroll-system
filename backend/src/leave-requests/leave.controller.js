const leaveService = require("./leave.service");


async function getAllLeaveRequests(req, res, next) {
    try {
        const leaveRequests = await leaveService.getAllLeaveRequests();

        return res.status(200).json({
            success: true,
            data: leaveRequests,
        });
    } catch (error) {
        next(error);
    }
}


async function getLeaveRequestById(req, res, next) {
    try {
        const leaveId = Number(req.params.leaveId);

        if (Number.isNaN(leaveId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid leave request ID.",
            });
        }

        const leaveRequest = await leaveService.getLeaveRequestById(leaveId);

        return res.status(200).json({
            success: true,
            data: leaveRequest,
        });
    } catch (error) {
        next(error);
    }
}


async function getLeaveRequestsByEmployeeId(req, res, next) {
    try {
        const employeeId = Number(req.params.employeeId);

        if (Number.isNaN(employeeId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid employee ID.",
            });
        }

        const leaveRequests = await leaveService.getLeaveRequestsByEmployeeId(employeeId);

        return res.status(200).json({
            success: true,
            data: leaveRequests,
        });
    } catch (error) {
        next(error);
    }
}


async function createLeaveRequest(req, res, next) {
    try {
        const leaveRequest = await leaveService.createLeaveRequest(req.body);

        return res.status(201).json({
            success: true,
            message: "Leave request created successfully.",
            data: leaveRequest,
        });
    } catch (error) {
        next(error);
    }
}


async function approveLeaveRequest(req, res, next) {
    try {
        const leaveId = Number(req.params.leaveId);

        if (Number.isNaN(leaveId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid leave request ID.",
            });
        }

        const leaveRequest = await leaveService.approveLeaveRequest(
            leaveId,
            req.body.manager_id,
            req.body.manager_comment
        );

        return res.status(200).json({
            success: true,
            message: "Leave request approved successfully.",
            data: leaveRequest,
        });
    } catch (error) {
        next(error);
    }
}


async function rejectLeaveRequest(req, res, next) {
    try {
        const leaveId = Number(req.params.leaveId);

        if (Number.isNaN(leaveId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid leave request ID.",
            });
        }

        const leaveRequest = await leaveService.rejectLeaveRequest(
            leaveId,
            req.body.manager_id,
            req.body.manager_comment
        );

        return res.status(200).json({
            success: true,
            message: "Leave request rejected successfully.",
            data: leaveRequest,
        });
    } catch (error) {
        next(error);
    }
}


async function deleteLeaveRequest(req, res, next) {
    try {
        const leaveId = Number(req.params.leaveId);

        if (Number.isNaN(leaveId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid leave request ID.",
            });
        }

        await leaveService.deleteLeaveRequest(leaveId);

        return res.status(200).json({
            success: true,
            message: "Leave request deleted successfully.",
        });
    } catch (error) {
        next(error);
    }
}


module.exports = {
    getAllLeaveRequests,
    getLeaveRequestById,
    getLeaveRequestsByEmployeeId,
    createLeaveRequest,
    approveLeaveRequest,
    rejectLeaveRequest,
    deleteLeaveRequest,
};
