const Leave = require('../models/Leave');
const User = require('../models/User');

// Apply leave
exports.applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, numberOfDays, reason } = req.body;

    // Determine initial status based on user role
    let initialStatus = 'Pending_TeamLeader';
    
    if (req.user.role === 'team_lead') {
      initialStatus = 'Pending_HR';
    } else if (req.user.role === 'hr') {
      initialStatus = 'Pending_Director';
    } else if (req.user.role === 'director') {
      initialStatus = 'Approved'; 
    }
    // Employees start with 'Pending_TeamLeader' status (default)

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

    if (req.user.role === 'team_lead') {
      const employees = await User.find({ managerId: req.user.id });
      const employeeIds = employees.map(e => e._id);
      
      // If no employees, return empty array immediately to avoid fetching all leaves if query becomes {}
      if (employeeIds.length === 0) {
        return res.json([]);
      }
      
      query = { employeeId: { $in: employeeIds } };
    } else if (req.user.role === 'hr') {
      // HR usually sees everything or specific department? 
      // Keeping it as is for now, but explicit is better.
      query = {};
    } else if (req.user.role === 'director') {
      query = {};
    } else {
      // Regular employees shouldn't access this, but if they do, return nothing
      return res.status(403).json({ message: 'Access denied' });
    }

    const leaves = await Leave.find(query)
      .populate('employeeId', 'name email')
      .populate('approvals.userId', 'name email')
      .sort({ createdAt: -1 });

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

    if (req.user.role === 'team_lead') {
      // Team Lead sees leaves from their employees that are in 'Pending_TeamLeader' status
      const employees = await User.find({ managerId: req.user.id });
      const employeeIds = employees.map(e => e._id);
      
      if (employeeIds.length === 0) {
        return res.json([]);
      }

      query = {
        employeeId: { $in: employeeIds },
        status: 'Pending_TeamLeader',
      };
    } else if (req.user.role === 'hr') {
      // HR Approves:
      // 1. Employee leaves that are Pending_HR
      // 2. Team Lead leaves that are Pending_HR
      
      query = { status: 'Pending_HR' };

    } else if (req.user.role === 'director') {
      // Director Approves:
      // 1. HR leaves that are Pending_Director
      
      query = { 
         status: 'Pending_Director' 
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

    if (req.user.role === 'team_lead') {
      // Team Lead can only approve employee leaves in 'Pending_TeamLeader' status
      if (employeeRole === 'employee' && leave.status === 'Pending_TeamLeader') {
        newStatus = 'Pending_HR';
        canApprove = true;
      } else {
        return res.status(400).json({ message: 'Invalid leave status for Team Lead approval' });
      }
    } else if (req.user.role === 'hr') {
      // HR Approves:
      // 1. Employee leaves (Pending_HR) -> Approved
      // 2. Team Lead leaves (Pending_HR) -> Approved
      
      if (leave.status === 'Pending_HR') {
        newStatus = 'Approved';
        canApprove = true;
      } else {
        return res.status(400).json({ message: 'Invalid leave status for HR approval' });
      }
    } else if (req.user.role === 'director') {
      // Director Approves:
      // 1. HR leaves (Pending_Director) -> Approved

      if (employeeRole === 'hr' && leave.status === 'Pending_Director') {
        newStatus = 'Approved';
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
    if (newStatus === 'Approved') {
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
    let rejectionStatus = '';

    // Check if user can reject this leave
    if (req.user.role === 'team_lead') {
      if (employeeRole === 'employee' && leave.status === 'Pending_TeamLeader') {
        canReject = true;
        rejectionStatus = 'Rejected_By_TeamLeader';
      }
    } else if (req.user.role === 'hr') {
      if (leave.status === 'Pending_HR') {
        canReject = true;
        rejectionStatus = 'Rejected_By_HR';
      }
    } else if (req.user.role === 'director') {
       if (employeeRole === 'hr' && leave.status === 'Pending_Director') {
         canReject = true;
         rejectionStatus = 'Rejected_By_Director';
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

    leave.status = rejectionStatus;
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
