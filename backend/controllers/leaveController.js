const Leave = require('../models/Leave');
const User = require('../models/User');

// Apply leave
exports.applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, numberOfDays, reason } = req.body;

    // Determine initial status based on user role
    let initialStatus = 'applied';
    if (req.user.role === 'director') {
      // Directors' leaves are auto-approved
      initialStatus = 'director-approved';
    } else if (req.user.role === 'manager' || req.user.role === 'hr') {
      // Manager and HR leaves go directly to director (skip manager and HR approval)
      initialStatus = 'applied'; // Will be shown to director for approval
    }
    // Employees start with 'applied' status (default)

    const leave = await Leave.create({
      employeeId: req.user.id,
      leaveType,
      startDate,
      endDate,
      numberOfDays,
      reason,
      status: initialStatus,
    });

    // If director, auto-approve
    if (req.user.role === 'director') {
      leave.approvals.push({
        role: 'director',
        userId: req.user.id,
        status: 'approved',
        comments: 'Auto-approved for director',
        approvedAt: new Date(),
      });
      await leave.save();
    }

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
      // Manager sees leaves from their employees that are in 'applied' status
      const employees = await User.find({ managerId: req.user.id, role: 'employee' });
      const employeeIds = employees.map(e => e._id);
      query = {
        employeeId: { $in: employeeIds },
        status: 'applied',
      };
    } else if (req.user.role === 'hr') {
      // HR sees employee leaves that are manager-approved
      const employees = await User.find({ role: 'employee' });
      const employeeIds = employees.map(e => e._id);
      query = {
        employeeId: { $in: employeeIds },
        status: 'manager-approved',
      };
    } else if (req.user.role === 'director') {
      // Director sees:
      // 1. Employee leaves that are hr-approved
      // 2. Manager/HR leaves that are in 'applied' status (they skip manager and HR approval)
      const employees = await User.find({ role: 'employee' });
      const employeeIds = employees.map(e => e._id);
      
      const managersAndHR = await User.find({ role: { $in: ['manager', 'hr'] } });
      const managerHRIds = managersAndHR.map(u => u._id);

      query = {
        $or: [
          { employeeId: { $in: employeeIds }, status: 'hr-approved' },
          { employeeId: { $in: managerHRIds }, status: 'applied' },
        ],
      };
    }

    const leaves = await Leave.find(query)
      .populate('employeeId', 'name email department role')
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

    const leave = await Leave.findById(leaveId).populate('employeeId', 'role');
    if (!leave) {
      return res.status(404).json({ message: 'Leave not found' });
    }

    const employeeRole = leave.employeeId?.role;

    let newStatus = '';
    let canApprove = false;

    if (req.user.role === 'manager') {
      // Manager can only approve employee leaves in 'applied' status
      if (employeeRole === 'employee' && leave.status === 'applied') {
        newStatus = 'manager-approved';
        canApprove = true;
      } else {
        return res.status(400).json({ message: 'Invalid leave status for manager approval' });
      }
    } else if (req.user.role === 'hr') {
      // HR can only approve employee leaves that are manager-approved
      if (employeeRole === 'employee' && leave.status === 'manager-approved') {
        newStatus = 'hr-approved';
        canApprove = true;
      } else {
        return res.status(400).json({ message: 'Invalid leave status for HR approval' });
      }
    } else if (req.user.role === 'director') {
      // Director can approve:
      // 1. Employee leaves that are hr-approved
      // 2. Manager/HR leaves that are in 'applied' status
      if (employeeRole === 'employee' && leave.status === 'hr-approved') {
        newStatus = 'director-approved';
        canApprove = true;
      } else if ((employeeRole === 'manager' || employeeRole === 'hr') && leave.status === 'applied') {
        newStatus = 'director-approved';
        canApprove = true;
      } else {
        return res.status(400).json({ message: 'Invalid leave status for director approval' });
      }
    }

    if (!canApprove) {
      return res.status(403).json({ message: 'You do not have permission to approve this leave' });
    }

    leave.approvals.push({
      role: req.user.role,
      userId: req.user.id,
      status: 'approved',
      comments: comments || '',
      approvedAt: new Date(),
    });

    leave.status = newStatus;
    await leave.save();

    // If fully approved, update leave balance
    if (newStatus === 'director-approved') {
      const user = await User.findById(leave.employeeId._id);
      if (user) {
        const balanceKey = `${leave.leaveType}Leave`;
        if (user.leaveBalance[balanceKey] !== undefined) {
          user.leaveBalance[balanceKey] = Math.max(0, user.leaveBalance[balanceKey] - leave.numberOfDays);
          await user.save();
        }
      }
    }

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

    const leave = await Leave.findById(leaveId).populate('employeeId', 'role');
    if (!leave) {
      return res.status(404).json({ message: 'Leave not found' });
    }

    const employeeRole = leave.employeeId?.role;
    let canReject = false;

    // Check if user can reject this leave
    if (req.user.role === 'manager') {
      // Manager can reject employee leaves in 'applied' status
      if (employeeRole === 'employee' && leave.status === 'applied') {
        canReject = true;
      }
    } else if (req.user.role === 'hr') {
      // HR can reject employee leaves that are manager-approved
      if (employeeRole === 'employee' && leave.status === 'manager-approved') {
        canReject = true;
      }
    } else if (req.user.role === 'director') {
      // Director can reject:
      // 1. Employee leaves in 'hr-approved' status
      // 2. Manager/HR leaves in 'applied' status
      if (employeeRole === 'employee' && leave.status === 'hr-approved') {
        canReject = true;
      } else if ((employeeRole === 'manager' || employeeRole === 'hr') && leave.status === 'applied') {
        canReject = true;
      }
    }

    if (!canReject) {
      return res.status(403).json({ message: 'You do not have permission to reject this leave' });
    }

    leave.approvals.push({
      role: req.user.role,
      userId: req.user.id,
      status: 'rejected',
      comments: comments || '',
      approvedAt: new Date(),
    });

    leave.status = 'rejected';
    leave.rejectionReason = comments || '';
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
