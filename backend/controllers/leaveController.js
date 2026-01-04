const Leave = require('../models/Leave');
const User = require('../models/User');

// Apply leave
exports.applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, numberOfDays, reason } = req.body;

    const leave = await Leave.create({
      employeeId: req.user.id,
      leaveType,
      startDate,
      endDate,
      numberOfDays,
      reason,
    });

    res.status(201).json({ message: 'Leave applied successfully', leave });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get my leaves
exports.getMyLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ employeeId: req.user.id })
      .populate('employeeId', 'name email')
      .populate('approvals.userId', 'name email');

    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get team leaves
exports.getTeamLeaves = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'manager') {
      const employees = await User.find({ managerId: req.user.id });
      const employeeIds = employees.map(e => e._id);
      query = { employeeId: { $in: employeeIds } };
    } else if (req.user.role === 'hr') {
      query = {};
    } else if (req.user.role === 'director') {
      query = {};
    }

    const leaves = await Leave.find(query)
      .populate('employeeId', 'name email')
      .populate('approvals.userId', 'name email');

    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all leaves
exports.getAllLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find()
      .populate('employeeId', 'name email')
      .populate('approvals.userId', 'name email');

    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get leave requests for approval
exports.getLeaveRequests = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'manager') {
      const employees = await User.find({ managerId: req.user.id });
      const employeeIds = employees.map(e => e._id);
      query = {
        employeeId: { $in: employeeIds },
        status: { $in: ['applied', 'manager-approved'] },
      };
    } else if (req.user.role === 'hr') {
      query = { status: { $in: ['manager-approved', 'hr-approved'] } };
    } else if (req.user.role === 'director') {
      query = { status: { $in: ['hr-approved'] } };
    }

    const leaves = await Leave.find(query)
      .populate('employeeId', 'name email department')
      .populate('approvals.userId', 'name email role');

    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve leave
exports.approveLeave = async (req, res) => {
  try {
    const { comments } = req.body;
    const leaveId = req.params.id;

    const leave = await Leave.findById(leaveId);
    if (!leave) {
      return res.status(404).json({ message: 'Leave not found' });
    }

    let newStatus = '';
    if (req.user.role === 'manager') {
      if (leave.status !== 'applied') {
        return res.status(400).json({ message: 'Invalid leave status for manager approval' });
      }
      newStatus = 'manager-approved';
    } else if (req.user.role === 'hr') {
      if (leave.status !== 'manager-approved') {
        return res.status(400).json({ message: 'Invalid leave status for HR approval' });
      }
      newStatus = 'hr-approved';
    } else if (req.user.role === 'director') {
      if (leave.status !== 'hr-approved') {
        return res.status(400).json({ message: 'Invalid leave status for director approval' });
      }
      newStatus = 'director-approved';
    }

    leave.approvals.push({
      role: req.user.role,
      userId: req.user.id,
      status: 'approved',
      comments,
      approvedAt: new Date(),
    });

    leave.status = newStatus;
    await leave.save();

    res.json({ message: 'Leave approved successfully', leave });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reject leave
exports.rejectLeave = async (req, res) => {
  try {
    const { comments } = req.body;
    const leaveId = req.params.id;

    const leave = await Leave.findById(leaveId);
    if (!leave) {
      return res.status(404).json({ message: 'Leave not found' });
    }

    leave.approvals.push({
      role: req.user.role,
      userId: req.user.id,
      status: 'rejected',
      comments,
      approvedAt: new Date(),
    });

    leave.status = 'rejected';
    leave.rejectionReason = comments;
    leave.rejectedBy = req.user.id;
    await leave.save();

    res.json({ message: 'Leave rejected successfully', leave });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get leave history for employee
exports.getLeaveHistory = async (req, res) => {
  try {
    const employeeId = req.params.userId;

    const leaves = await Leave.find({ employeeId })
      .populate('employeeId', 'name email')
      .populate('approvals.userId', 'name email role');

    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
