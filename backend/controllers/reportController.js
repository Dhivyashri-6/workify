const Leave = require('../models/Leave');
const User = require('../models/User');
const Timesheet = require('../models/Timesheet');

const STANDARD_WORKING_HOURS = 8;

const parseDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) {
    return null;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return null;
  }

  return { start, end };
};

const buildCsv = (headers, rows) => {
  const escapedRows = rows.map((row) =>
    row.map((value) => {
      const text = value === null || value === undefined ? '' : String(value);
      return `"${text.replace(/"/g, '""')}"`;
    }).join(',')
  );

  return [headers.join(','), ...escapedRows].join('\n');
};

const getDateOnly = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const calculateOverlapDays = (leave, rangeStart, rangeEnd) => {
  const leaveStart = getDateOnly(leave.startDate);
  const leaveEnd = getDateOnly(leave.endDate);

  const start = leaveStart > rangeStart ? leaveStart : rangeStart;
  const end = leaveEnd < rangeEnd ? leaveEnd : rangeEnd;

  if (start > end) return 0;

  return Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
};

const getAccessibleUsers = async (authUser) => {
  if (authUser.role === 'employee') {
    return User.find({ _id: authUser.id });
  }

  if (authUser.role === 'team_lead') {
    return User.find({
      $or: [{ _id: authUser.id }, { managerId: authUser.id }],
    });
  }

  if (authUser.role === 'hr') {
    return User.find({
      $or: [
        { _id: authUser.id },
        { role: { $in: ['employee', 'team_lead'] } },
      ],
    });
  }

  return User.find({});
};

const filterUsersByQuery = (users, authUser, { employeeId, role }) => {
  let filtered = [...users];

  if (authUser.role !== 'director') {
    filtered = filtered.filter((u) => u._id.toString() === authUser.id);
  }

  if (employeeId) {
    filtered = filtered.filter((u) => u._id.toString() === employeeId);
  }

  if (role && role !== 'all') {
    filtered = filtered.filter((u) => u.role === role);
  }

  return filtered;
};

const calculatePayrollForUser = async (user, range) => {
  const timesheetSummary = await Timesheet.aggregate([
    {
      $match: {
        employeeId: user._id,
        status: 'Approved',
        date: { $gte: range.start, $lte: range.end },
      },
    },
    {
      $group: {
        _id: null,
        totalHours: { $sum: '$totalHours' },
        overtimeHours: { $sum: '$overtimeHours' },
      },
    },
  ]);

  const hours = timesheetSummary[0] || { totalHours: 0, overtimeHours: 0 };
  const regularWorkedHours = Math.max(0, hours.totalHours - hours.overtimeHours);

  const leaves = await Leave.find({
    employeeId: user._id,
    status: 'Approved',
    $or: [
      { startDate: { $lte: range.end, $gte: range.start } },
      { endDate: { $lte: range.end, $gte: range.start } },
      { startDate: { $lte: range.start }, endDate: { $gte: range.end } },
    ],
  });

  let paidLeaveDays = 0;
  let unpaidLeaveDays = 0;

  const rangeStartDate = getDateOnly(range.start);
  const rangeEndDate = getDateOnly(range.end);

  leaves.forEach((leave) => {
    const overlapDays = calculateOverlapDays(leave, rangeStartDate, rangeEndDate);
    if (overlapDays === 0) return;

    if (leave.isPaid) {
      paidLeaveDays += overlapDays;
    } else {
      unpaidLeaveDays += overlapDays;
    }
  });

  const hourlyRate = Number(user.hourlyRate || 25);
  const overtimeMultiplier = Number(user.overtimeMultiplier || 1.5);
  const paidLeaveHours = paidLeaveDays * STANDARD_WORKING_HOURS;
  const unpaidLeaveHours = unpaidLeaveDays * STANDARD_WORKING_HOURS;

  const payableRegularHours = regularWorkedHours + paidLeaveHours;
  const regularPay = payableRegularHours * hourlyRate;
  const overtimePay = hours.overtimeHours * hourlyRate * overtimeMultiplier;
  const grossPay = regularPay + overtimePay;
  const unpaidDeduction = unpaidLeaveHours * hourlyRate;
  const netPay = grossPay - unpaidDeduction;

  return {
    employeeId: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department || 'N/A',
    hourlyRate,
    overtimeMultiplier,
    regularWorkedHours: Number(regularWorkedHours.toFixed(2)),
    overtimeHours: Number(hours.overtimeHours.toFixed(2)),
    paidLeaveDays,
    unpaidLeaveDays,
    payableRegularHours: Number(payableRegularHours.toFixed(2)),
    regularPay: Number(regularPay.toFixed(2)),
    overtimePay: Number(overtimePay.toFixed(2)),
    grossPay: Number(grossPay.toFixed(2)),
    unpaidDeduction: Number(unpaidDeduction.toFixed(2)),
    netPay: Number(netPay.toFixed(2)),
  };
};

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
        approved: leaves.filter((l) => l.status === 'Approved').length,
        rejected: leaves.filter((l) => l.status.startsWith('Rejected')).length,
        pending: leaves.filter((l) => l.status.startsWith('Pending')).length,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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

      const csv = buildCsv(
        ['Employee', 'Email', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Status', 'Reason'],
        leaves.map((leave) => [
          leave.employeeId?.name || 'N/A',
          leave.employeeId?.email || 'N/A',
          leave.leaveType,
          new Date(leave.startDate).toLocaleDateString(),
          new Date(leave.endDate).toLocaleDateString(),
          leave.numberOfDays,
          leave.status,
          leave.reason,
        ])
      );

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="leave-report.csv"');
      return res.send(csv);
    }

    if (type === 'employee') {
      const leaves = await Leave.find({ employeeId: req.user.id }).populate('employeeId', 'name email');

      const csv = buildCsv(
        ['Employee', 'Email', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Status', 'Reason'],
        leaves.map((leave) => [
          leave.employeeId?.name || 'N/A',
          leave.employeeId?.email || 'N/A',
          leave.leaveType,
          new Date(leave.startDate).toLocaleDateString(),
          new Date(leave.endDate).toLocaleDateString(),
          leave.numberOfDays,
          leave.status,
          leave.reason,
        ])
      );

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="my-leaves.csv"');
      return res.send(csv);
    }

    return res.status(400).json({ message: 'Invalid report type' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.downloadLeavesByDateRange = async (req, res) => {
  try {
    const { startDate, endDate, employeeId, role = 'all' } = req.query;
    const range = parseDateRange(startDate, endDate);

    if (!range) {
      return res.status(400).json({ message: 'Please provide a valid startDate and endDate' });
    }

    const users = await getAccessibleUsers(req.user);
    const scopedUsers = filterUsersByQuery(users, req.user, { employeeId, role });

    if (employeeId && scopedUsers.length === 0) {
      return res.status(403).json({ message: 'You do not have access to this employee report' });
    }

    if (scopedUsers.length === 0) {
      return res.status(404).json({ message: 'No users found for the selected filters' });
    }

    const leaves = await Leave.find({
      employeeId: { $in: scopedUsers.map((u) => u._id) },
      $or: [
        { startDate: { $gte: range.start, $lte: range.end } },
        { endDate: { $gte: range.start, $lte: range.end } },
        { startDate: { $lte: range.start }, endDate: { $gte: range.end } },
      ],
    }).populate('employeeId', 'name email role department');

    const rows = leaves.map((leave) => [
      leave.employeeId?.name || 'N/A',
      leave.employeeId?.email || 'N/A',
      leave.employeeId?.role || 'N/A',
      leave.employeeId?.department || 'N/A',
      leave.leaveType,
      leave.isPaid ? 'Paid' : 'Unpaid',
      new Date(leave.startDate).toLocaleDateString(),
      new Date(leave.endDate).toLocaleDateString(),
      leave.numberOfDays,
      leave.status,
      leave.reason || '',
    ]);

    const csv = buildCsv(
      ['Employee', 'Email', 'Role', 'Department', 'Leave Type', 'Paid/Unpaid', 'Start Date', 'End Date', 'Days', 'Status', 'Reason'],
      rows
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="leave-report-range.csv"');
    return res.send(csv);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.downloadTimesheetsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate, employeeId, role = 'all' } = req.query;
    const range = parseDateRange(startDate, endDate);

    if (!range) {
      return res.status(400).json({ message: 'Please provide a valid startDate and endDate' });
    }

    const users = await getAccessibleUsers(req.user);
    const scopedUsers = filterUsersByQuery(users, req.user, { employeeId, role });

    if (employeeId && scopedUsers.length === 0) {
      return res.status(403).json({ message: 'You do not have access to this employee report' });
    }

    if (scopedUsers.length === 0) {
      return res.status(404).json({ message: 'No users found for the selected filters' });
    }

    const timesheets = await Timesheet.find({
      employeeId: { $in: scopedUsers.map((u) => u._id) },
      date: { $gte: range.start, $lte: range.end },
    })
      .populate('employeeId', 'name email role department')
      .sort({ date: 1 });

    const rows = timesheets.map((entry) => [
      entry.employeeId?.name || 'N/A',
      entry.employeeId?.email || 'N/A',
      entry.employeeId?.role || 'N/A',
      entry.employeeId?.department || 'N/A',
      new Date(entry.date).toLocaleDateString(),
      entry.projectName,
      entry.taskName,
      entry.startTime,
      entry.endTime,
      entry.totalHours,
      entry.overtimeHours,
      entry.status,
      entry.managerComments || '',
    ]);

    const csv = buildCsv(
      ['Employee', 'Email', 'Role', 'Department', 'Date', 'Project', 'Task', 'Start Time', 'End Time', 'Total Hours', 'Overtime Hours', 'Status', 'Manager Comments'],
      rows
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="timesheet-report-range.csv"');
    return res.send(csv);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getPayrollReport = async (req, res) => {
  try {
    const { startDate, endDate, employeeId, role = 'all' } = req.query;
    const range = parseDateRange(startDate, endDate);

    if (!range) {
      return res.status(400).json({ message: 'Please provide a valid startDate and endDate' });
    }

    const users = await getAccessibleUsers(req.user);
    const scopedUsers = filterUsersByQuery(users, req.user, { employeeId, role });

    if (employeeId && scopedUsers.length === 0) {
      return res.status(403).json({ message: 'You do not have access to this employee payroll report' });
    }

    if (scopedUsers.length === 0) {
      return res.status(404).json({ message: 'No users found for the selected filters' });
    }

    const payroll = [];
    for (const user of scopedUsers) {
      const row = await calculatePayrollForUser(user, range);
      payroll.push(row);
    }

    const totals = payroll.reduce(
      (acc, row) => {
        acc.regularWorkedHours += row.regularWorkedHours;
        acc.overtimeHours += row.overtimeHours;
        acc.paidLeaveDays += row.paidLeaveDays;
        acc.unpaidLeaveDays += row.unpaidLeaveDays;
        acc.grossPay += row.grossPay;
        acc.unpaidDeduction += row.unpaidDeduction;
        acc.netPay += row.netPay;
        return acc;
      },
      {
        regularWorkedHours: 0,
        overtimeHours: 0,
        paidLeaveDays: 0,
        unpaidLeaveDays: 0,
        grossPay: 0,
        unpaidDeduction: 0,
        netPay: 0,
      }
    );

    return res.json({
      range: { startDate, endDate },
      payroll,
      totals: {
        regularWorkedHours: Number(totals.regularWorkedHours.toFixed(2)),
        overtimeHours: Number(totals.overtimeHours.toFixed(2)),
        paidLeaveDays: totals.paidLeaveDays,
        unpaidLeaveDays: totals.unpaidLeaveDays,
        grossPay: Number(totals.grossPay.toFixed(2)),
        unpaidDeduction: Number(totals.unpaidDeduction.toFixed(2)),
        netPay: Number(totals.netPay.toFixed(2)),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.downloadPayrollByDateRange = async (req, res) => {
  try {
    const { startDate, endDate, employeeId, role = 'all' } = req.query;
    const range = parseDateRange(startDate, endDate);

    if (!range) {
      return res.status(400).json({ message: 'Please provide a valid startDate and endDate' });
    }

    const users = await getAccessibleUsers(req.user);
    const scopedUsers = filterUsersByQuery(users, req.user, { employeeId, role });

    if (employeeId && scopedUsers.length === 0) {
      return res.status(403).json({ message: 'You do not have access to this employee payroll report' });
    }

    if (scopedUsers.length === 0) {
      return res.status(404).json({ message: 'No users found for the selected filters' });
    }

    const payrollRows = [];
    for (const user of scopedUsers) {
      payrollRows.push(await calculatePayrollForUser(user, range));
    }

    const csv = buildCsv(
      [
        'Employee',
        'Email',
        'Role',
        'Department',
        'Hourly Rate',
        'Overtime Multiplier',
        'Regular Worked Hours',
        'Overtime Hours',
        'Paid Leave Days',
        'Unpaid Leave Days',
        'Payable Regular Hours',
        'Regular Pay',
        'Overtime Pay',
        'Gross Pay',
        'Unpaid Leave Deduction',
        'Net Pay',
      ],
      payrollRows.map((row) => [
        row.name,
        row.email,
        row.role,
        row.department,
        row.hourlyRate,
        row.overtimeMultiplier,
        row.regularWorkedHours,
        row.overtimeHours,
        row.paidLeaveDays,
        row.unpaidLeaveDays,
        row.payableRegularHours,
        row.regularPay,
        row.overtimePay,
        row.grossPay,
        row.unpaidDeduction,
        row.netPay,
      ])
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="payroll-report-range.csv"');
    return res.send(csv);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
