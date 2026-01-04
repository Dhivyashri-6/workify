const Leave = require('../models/Leave');
const User = require('../models/User');

// Get overall leave report
exports.getLeaveReport = async (req, res) => {
  try {
    if (req.user.role !== 'director') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const leaves = await Leave.find()
      .populate('employeeId', 'name email department')
      .sort('-createdAt');

    const report = leaves.reduce((acc, leave) => {
      const employee = leave.employeeId._id.toString();
      if (!acc[employee]) {
        acc[employee] = {
          employeeId: leave.employeeId._id,
          name: leave.employeeId.name,
          email: leave.employeeId.email,
          department: leave.employeeId.department,
          leaves: [],
        };
      }
      acc[employee].leaves.push(leave);
      return acc;
    }, {});

    res.json(Object.values(report));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get employee leave report
exports.getEmployeeLeaveReport = async (req, res) => {
  try {
    const employeeId = req.params.employeeId;

    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const leaves = await Leave.find({ employeeId })
      .populate('employeeId', 'name email department leaveBalance')
      .populate('approvals.userId', 'name email role');

    res.json({
      employee,
      leaves,
      summary: {
        totalApplied: leaves.length,
        approved: leaves.filter(l => l.status === 'director-approved').length,
        rejected: leaves.filter(l => l.status === 'rejected').length,
        pending: leaves.filter(l => ['applied', 'manager-approved', 'hr-approved'].includes(l.status)).length,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Download report
exports.downloadReport = async (req, res) => {
  try {
    if (req.user.role !== 'director') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const type = req.params.type;

    if (type === 'overall') {
      const leaves = await Leave.find()
        .populate('employeeId', 'name email department')
        .sort('-createdAt');

      const csv = generateCSV(leaves);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="leave-report.csv"');
      res.send(csv);
    } else if (type === 'employee') {
      const leaves = await Leave.find({ employeeId: req.user.id })
        .populate('employeeId', 'name email');

      const csv = generateCSV(leaves);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="my-leaves.csv"');
      res.send(csv);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

function generateCSV(leaves) {
  const headers = ['Employee', 'Email', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Status', 'Reason'];
  const rows = leaves.map(leave => [
    leave.employeeId?.name || 'N/A',
    leave.employeeId?.email || 'N/A',
    leave.leaveType,
    new Date(leave.startDate).toLocaleDateString(),
    new Date(leave.endDate).toLocaleDateString(),
    leave.numberOfDays,
    leave.status,
    leave.reason,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
}
