const Leave = require('../models/Leave');
const User = require('../models/User');

// Helper function to check if date ranges overlap
const datesOverlap = (start1, end1, start2, end2) => {
  return start1 <= end2 && start2 <= end1;
};

// Apply leave
exports.applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, numberOfDays, reason, isPaid } = req.body;

    const requestStart = new Date(startDate);
    const requestEnd = new Date(endDate);

    // Check for overlapping approved or pending leaves
    const existingLeaves = await Leave.find({
      employeeId: req.user.id,
      status: { $in: ['Approved', 'Pending_TeamLeader', 'Pending_HR', 'Pending_Director'] },
    });

    for (const leave of existingLeaves) {
      const leaveStart = new Date(leave.startDate);
      const leaveEnd = new Date(leave.endDate);
      
      if (datesOverlap(requestStart, requestEnd, leaveStart, leaveEnd)) {
        const statusLabel = leave.status === 'Approved' ? 'approved' : 'pending';
        return res.status(400).json({
          message: `You already have a ${statusLabel} leave request for some of these dates (${new Date(leave.startDate).toLocaleDateString()} - ${new Date(leave.endDate).toLocaleDateString()}). Please select different dates.`,
          conflictingLeave: leave,
        });
      }
    }

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

    // Determine if leave is paid - default based on leave type
    // 'other' type is unpaid by default, but can be overridden
    let isLeavePaid = isPaid !== undefined ? isPaid : (leaveType !== 'other');

    const leave = await Leave.create({
      employeeId: req.user.id,
      leaveType,
      startDate,
      endDate,
      numberOfDays,
      reason,
      status: initialStatus,
      isPaid: isLeavePaid,
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

// Get leave balance stats - calculates used leaves per type from approved leaves
exports.getLeaveBalanceStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's leave balance from User model
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get all approved leaves for this user to calculate used leaves
    const approvedLeaves = await Leave.find({ 
      employeeId: userId, 
      status: 'Approved' 
    });

    // Calculate used leaves by type
    const usedLeaves = {
      casualLeave: 0,
      sickLeave: 0,
      earnedLeave: 0,
      maternityLeave: 0,
      otherLeave: 0,
      unpaidLeave: 0,
    };

    approvedLeaves.forEach(leave => {
      const days = leave.numberOfDays || 0;
      
      // Track unpaid leaves separately
      if (!leave.isPaid) {
        usedLeaves.unpaidLeave += days;
      }
      
      // Track by leave type
      switch (leave.leaveType) {
        case 'casual':
          usedLeaves.casualLeave += days;
          break;
        case 'sick':
          usedLeaves.sickLeave += days;
          break;
        case 'earned':
          usedLeaves.earnedLeave += days;
          break;
        case 'maternity':
          usedLeaves.maternityLeave += days;
          break;
        case 'other':
          usedLeaves.otherLeave += days;
          break;
      }
    });

    // Calculate total paid leaves used (excluding unpaid ones)
    const paidLeavesUsed = approvedLeaves
      .filter(leave => leave.isPaid)
      .reduce((sum, leave) => sum + (leave.numberOfDays || 0), 0);

    // Calculate remaining balance
    const totalBalance = user.leaveBalance || {};
    const remainingBalance = {
      casualLeave: (totalBalance.casualLeave || 12) - usedLeaves.casualLeave,
      sickLeave: (totalBalance.sickLeave || 10) - usedLeaves.sickLeave,
      earnedLeave: (totalBalance.earnedLeave || 20) - usedLeaves.earnedLeave,
      maternityLeave: (totalBalance.maternityLeave || 180) - usedLeaves.maternityLeave,
    };

    // Total paid leaves available (from user's allocated balance)
    const totalPaidLeavesAllocated = 
      (totalBalance.casualLeave || 12) + 
      (totalBalance.sickLeave || 10) + 
      (totalBalance.earnedLeave || 20);

    res.json({
      allocated: {
        casualLeave: totalBalance.casualLeave || 12,
        sickLeave: totalBalance.sickLeave || 10,
        earnedLeave: totalBalance.earnedLeave || 20,
        maternityLeave: totalBalance.maternityLeave || 180,
      },
      used: usedLeaves,
      remaining: remainingBalance,
      summary: {
        totalPaidLeavesAllocated,
        paidLeavesUsed,
        unpaidLeavesUsed: usedLeaves.unpaidLeave,
        totalLeavesUsed: paidLeavesUsed + usedLeaves.unpaidLeave,
        remainingPaidLeaves: totalPaidLeavesAllocated - paidLeavesUsed,
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get blocked dates (dates that already have approved or pending leaves)
// Helper function to format date as YYYY-MM-DD in local timezone
const formatDateLocal = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

exports.getBlockedDates = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all approved and pending leaves for this user
    const leaves = await Leave.find({
      employeeId: userId,
      status: { $in: ['Approved', 'Pending_TeamLeader', 'Pending_HR', 'Pending_Director'] },
    }).select('startDate endDate status leaveType');

    // Generate list of all blocked dates
    const blockedDates = [];
    const blockedDateDetails = [];

    leaves.forEach(leave => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      
      // Iterate through each day in the leave period using local dates
      const current = new Date(start);
      while (current <= end) {
        // Use local date format to avoid timezone shifts
        const dateStr = formatDateLocal(current);
        if (!blockedDates.includes(dateStr)) {
          blockedDates.push(dateStr);
          blockedDateDetails.push({
            date: dateStr,
            status: leave.status,
            leaveType: leave.leaveType,
          });
        }
        current.setDate(current.getDate() + 1);
      }
    });

    res.json({
      blockedDates,
      blockedDateDetails,
      totalBlockedDays: blockedDates.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
