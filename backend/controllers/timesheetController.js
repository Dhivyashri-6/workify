const mongoose = require('mongoose');
const Timesheet = require('../models/Timesheet');
const TimesheetApproval = require('../models/TimesheetApproval');
const User = require('../models/User');

const STANDARD_WORKING_HOURS = 8;
const APPROVER_ROLES = ['team_lead', 'hr', 'director'];

const calculateHours = (startTime, endTime) => {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  let durationMinutes = endMinutes - startMinutes;
  if (durationMinutes < 0) {
    durationMinutes += 24 * 60;
  }

  return Math.round((durationMinutes / 60) * 100) / 100;
};

const getApprovalWorkflowForRole = (employeeRole) => {
  if (employeeRole === 'employee') return ['team_lead', 'hr'];
  if (employeeRole === 'team_lead') return ['hr'];
  if (employeeRole === 'hr') return ['director'];
  return [];
};

const buildTimesheetApprovalState = (employeeRole, approvalHistory = []) => {
  const workflow = getApprovalWorkflowForRole(employeeRole);
  const stateByRole = {
    team_lead: 'not_required',
    hr: 'not_required',
    director: 'not_required',
  };

  workflow.forEach((role) => {
    stateByRole[role] = 'pending';
  });

  approvalHistory.forEach((entry) => {
    const role = entry?.managerId?.role;
    if (!role || !workflow.includes(role)) return;

    if (entry.status === 'Approved') {
      stateByRole[role] = 'approved';
    }

    if (entry.status === 'Rejected') {
      stateByRole[role] = 'rejected';
    }
  });

  let finalDecision = 'Pending';
  if (workflow.some((role) => stateByRole[role] === 'rejected')) {
    finalDecision = 'Rejected';
  } else if (workflow.length > 0 && workflow.every((role) => stateByRole[role] === 'approved')) {
    finalDecision = 'Approved';
  }

  const nextApprover = finalDecision === 'Pending'
    ? workflow.find((role) => stateByRole[role] === 'pending') || null
    : null;

  return {
    workflow,
    roles: stateByRole,
    finalDecision,
    nextApprover,
  };
};

const attachApprovalState = async (timesheets) => {
  if (!timesheets || timesheets.length === 0) return [];

  const ids = timesheets.map((ts) => ts._id);
  const approvals = await TimesheetApproval.find({ timesheetId: { $in: ids } })
    .populate('managerId', 'name email role')
    .sort({ actionDate: 1 });

  const historyMap = approvals.reduce((acc, item) => {
    const key = item.timesheetId.toString();
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return timesheets.map((timesheetDoc) => {
    const timesheet = timesheetDoc.toObject ? timesheetDoc.toObject() : timesheetDoc;
    const employeeRole = timesheet.employeeId?.role || 'employee';
    const approvalHistory = historyMap[timesheet._id.toString()] || [];
    const approvalState = buildTimesheetApprovalState(employeeRole, approvalHistory);

    return {
      ...timesheet,
      approvalState,
      approvalHistory,
    };
  });
};

const canTeamLeadAct = (timesheet, actorId) => {
  return timesheet.employeeId?.managerId?.toString() === actorId;
};

const processTimesheetDecision = async ({ timesheet, actor, comments = '', decision }) => {
  if (timesheet.status !== 'Submitted') {
    return { error: 'Only submitted timesheet entries can be reviewed' };
  }

  const approvalHistory = await TimesheetApproval.find({ timesheetId: timesheet._id })
    .populate('managerId', 'name email role')
    .sort({ actionDate: 1 });

  const approvalState = buildTimesheetApprovalState(timesheet.employeeId?.role || 'employee', approvalHistory);

  if (!APPROVER_ROLES.includes(actor.role)) {
    return { error: 'You do not have permission to review timesheets' };
  }

  if (actor.role === 'team_lead' && !canTeamLeadAct(timesheet, actor.id)) {
    return { error: 'You can only review timesheets from your team members' };
  }

  if (approvalState.nextApprover !== actor.role) {
    return {
      error: `This timesheet is currently awaiting ${approvalState.nextApprover || 'finalization'} approval`,
    };
  }

  if (decision === 'Rejected' && !comments.trim()) {
    return { error: 'Please provide a reason for rejection' };
  }

  const actionDate = new Date();

  await TimesheetApproval.create({
    timesheetId: timesheet._id,
    managerId: actor.id,
    status: decision,
    comments: comments || '',
    actionDate,
  });

  const updatedHistory = await TimesheetApproval.find({ timesheetId: timesheet._id })
    .populate('managerId', 'name email role')
    .sort({ actionDate: 1 });

  const updatedState = buildTimesheetApprovalState(timesheet.employeeId?.role || 'employee', updatedHistory);

  timesheet.managerComments = comments || '';

  if (decision === 'Rejected' || updatedState.finalDecision === 'Rejected') {
    timesheet.status = 'Rejected';
    timesheet.approvedBy = actor.id;
    timesheet.actionDate = actionDate;
  } else if (updatedState.finalDecision === 'Approved') {
    timesheet.status = 'Approved';
    timesheet.approvedBy = actor.id;
    timesheet.actionDate = actionDate;
  } else {
    timesheet.status = 'Submitted';
  }

  await timesheet.save();

  return {
    timesheet,
    approvalHistory: updatedHistory,
    approvalState: updatedState,
  };
};

exports.createTimesheet = async (req, res) => {
  try {
    const { date, projectName, taskName, startTime, endTime, notes, status } = req.body;

    if (!date || !projectName || !taskName || !startTime || !endTime) {
      return res.status(400).json({
        message: 'Please provide all required fields: date, projectName, taskName, startTime, endTime',
      });
    }

    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.status(400).json({ message: 'Invalid time format. Use HH:MM format' });
    }

    const totalHours = calculateHours(startTime, endTime);
    if (totalHours <= 0 || totalHours > 24) {
      return res.status(400).json({ message: 'End time must be greater than start time' });
    }

    const existingEntry = await Timesheet.findOne({
      employeeId: req.user.id,
      date: new Date(date),
      $or: [
        { startTime, endTime },
        {
          $and: [
            { startTime: { $lte: startTime } },
            { endTime: { $gte: startTime } },
          ],
        },
        {
          $and: [
            { startTime: { $lte: endTime } },
            { endTime: { $gte: endTime } },
          ],
        },
      ],
    });

    if (existingEntry) {
      return res.status(400).json({ message: 'A timesheet entry already exists for this time period' });
    }

    const isOvertime = totalHours > STANDARD_WORKING_HOURS;
    const overtimeHours = isOvertime ? totalHours - STANDARD_WORKING_HOURS : 0;

    const timesheet = await Timesheet.create({
      employeeId: req.user.id,
      date: new Date(date),
      projectName,
      taskName,
      startTime,
      endTime,
      totalHours,
      notes: notes || '',
      status: status || 'Draft',
      isOvertime,
      overtimeHours,
    });

    res.status(201).json({ message: 'Timesheet entry created successfully', timesheet });
  } catch (error) {
    console.error('Create timesheet error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateTimesheet = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, projectName, taskName, startTime, endTime, notes } = req.body;

    const timesheet = await Timesheet.findById(id);
    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet entry not found' });
    }

    if (timesheet.employeeId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only update your own timesheet entries' });
    }

    if (timesheet.status !== 'Draft') {
      return res.status(400).json({ message: 'Only draft timesheet entries can be updated' });
    }

    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (startTime && !timeRegex.test(startTime)) {
      return res.status(400).json({ message: 'Invalid start time format' });
    }
    if (endTime && !timeRegex.test(endTime)) {
      return res.status(400).json({ message: 'Invalid end time format' });
    }

    const newStartTime = startTime || timesheet.startTime;
    const newEndTime = endTime || timesheet.endTime;
    const totalHours = calculateHours(newStartTime, newEndTime);

    if (totalHours <= 0) {
      return res.status(400).json({ message: 'End time must be greater than start time' });
    }

    timesheet.date = date ? new Date(date) : timesheet.date;
    timesheet.projectName = projectName || timesheet.projectName;
    timesheet.taskName = taskName || timesheet.taskName;
    timesheet.startTime = newStartTime;
    timesheet.endTime = newEndTime;
    timesheet.totalHours = totalHours;
    timesheet.notes = notes !== undefined ? notes : timesheet.notes;
    timesheet.isOvertime = totalHours > STANDARD_WORKING_HOURS;
    timesheet.overtimeHours = timesheet.isOvertime ? totalHours - STANDARD_WORKING_HOURS : 0;

    await timesheet.save();

    res.json({ message: 'Timesheet entry updated successfully', timesheet });
  } catch (error) {
    console.error('Update timesheet error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteTimesheet = async (req, res) => {
  try {
    const { id } = req.params;

    const timesheet = await Timesheet.findById(id);
    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet entry not found' });
    }

    if (timesheet.employeeId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own timesheet entries' });
    }

    if (timesheet.status !== 'Draft') {
      return res.status(400).json({ message: 'Only draft timesheet entries can be deleted' });
    }

    await Timesheet.findByIdAndDelete(id);

    res.json({ message: 'Timesheet entry deleted successfully' });
  } catch (error) {
    console.error('Delete timesheet error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.submitTimesheet = async (req, res) => {
  try {
    const { id } = req.params;

    const timesheet = await Timesheet.findById(id);
    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet entry not found' });
    }

    if (timesheet.employeeId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only submit your own timesheet entries' });
    }

    if (timesheet.status !== 'Draft') {
      return res.status(400).json({ message: 'Only draft timesheet entries can be submitted' });
    }

    timesheet.status = 'Submitted';
    await timesheet.save();

    res.json({ message: 'Timesheet submitted for approval', timesheet });
  } catch (error) {
    console.error('Submit timesheet error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.submitBatchTimesheets = async (req, res) => {
  try {
    const { timesheetIds } = req.body;

    if (!timesheetIds || !Array.isArray(timesheetIds) || timesheetIds.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of timesheet IDs' });
    }

    const result = await Timesheet.updateMany(
      {
        _id: { $in: timesheetIds },
        employeeId: req.user.id,
        status: 'Draft',
      },
      {
        $set: { status: 'Submitted' },
      }
    );

    res.json({
      message: `${result.modifiedCount} timesheet(s) submitted for approval`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error('Batch submit error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.approveTimesheet = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;

    const timesheet = await Timesheet.findById(id).populate('employeeId', 'name email role managerId');
    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet entry not found' });
    }

    const decision = await processTimesheetDecision({
      timesheet,
      actor: req.user,
      comments: comments || '',
      decision: 'Approved',
    });

    if (decision.error) {
      return res.status(403).json({ message: decision.error });
    }

    res.json({
      message: decision.timesheet.status === 'Approved'
        ? 'Timesheet approved successfully'
        : 'Approval recorded. Timesheet moved to the next approver.',
      timesheet: decision.timesheet,
      approvalState: decision.approvalState,
    });
  } catch (error) {
    console.error('Approve timesheet error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.rejectTimesheet = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;

    const timesheet = await Timesheet.findById(id).populate('employeeId', 'name email role managerId');
    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet entry not found' });
    }

    const decision = await processTimesheetDecision({
      timesheet,
      actor: req.user,
      comments: comments || '',
      decision: 'Rejected',
    });

    if (decision.error) {
      const statusCode = decision.error.includes('reason for rejection') ? 400 : 403;
      return res.status(statusCode).json({ message: decision.error });
    }

    res.json({
      message: 'Timesheet rejected',
      timesheet: decision.timesheet,
      approvalState: decision.approvalState,
    });
  } catch (error) {
    console.error('Reject timesheet error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.approveBatchTimesheets = async (req, res) => {
  try {
    const { timesheetIds, comments } = req.body;

    if (!APPROVER_ROLES.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to approve timesheets' });
    }

    if (!timesheetIds || !Array.isArray(timesheetIds) || timesheetIds.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of timesheet IDs' });
    }

    const timesheets = await Timesheet.find({
      _id: { $in: timesheetIds },
      status: 'Submitted',
    }).populate('employeeId', 'name email role managerId');

    let modifiedCount = 0;
    const skipped = [];

    for (const timesheet of timesheets) {
      const result = await processTimesheetDecision({
        timesheet,
        actor: req.user,
        comments: comments || '',
        decision: 'Approved',
      });

      if (result.error) {
        skipped.push({ timesheetId: timesheet._id, reason: result.error });
      } else {
        modifiedCount += 1;
      }
    }

    res.json({
      message: `${modifiedCount} timesheet(s) approved`,
      modifiedCount,
      skipped,
    });
  } catch (error) {
    console.error('Batch approve error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getMyTimesheets = async (req, res) => {
  try {
    const { startDate, endDate, status, page = 1, limit = 50 } = req.query;

    const query = { employeeId: req.user.id };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (startDate) {
      query.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.date = { $lte: new Date(endDate) };
    }

    if (status && ['Draft', 'Submitted', 'Approved', 'Rejected'].includes(status)) {
      query.status = status;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const timesheetDocs = await Timesheet.find(query)
      .populate('employeeId', 'name email role managerId')
      .populate('approvedBy', 'name email')
      .sort({ date: -1, startTime: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    const timesheets = await attachApprovalState(timesheetDocs);
    const total = await Timesheet.countDocuments(query);

    res.json({
      timesheets,
      pagination: {
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    console.error('Get my timesheets error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getTeamTimesheets = async (req, res) => {
  try {
    const { startDate, endDate, status, employeeId, page = 1, limit = 50 } = req.query;

    if (!APPROVER_ROLES.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const query = {};

    if (req.user.role === 'team_lead') {
      const teamMembers = await User.find({ managerId: req.user.id }).select('_id');
      const teamMemberIds = teamMembers.map((m) => m._id);

      if (teamMemberIds.length === 0) {
        return res.json({ timesheets: [], pagination: { total: 0, page: 1, pages: 0 } });
      }

      query.employeeId = { $in: teamMemberIds };
    }

    if (employeeId) {
      query.employeeId = employeeId;
    }

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (startDate) {
      query.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.date = { $lte: new Date(endDate) };
    }

    if (status && ['Draft', 'Submitted', 'Approved', 'Rejected'].includes(status)) {
      query.status = status;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const timesheetDocs = await Timesheet.find(query)
      .populate('employeeId', 'name email department role managerId')
      .populate('approvedBy', 'name email')
      .sort({ date: -1, startTime: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    const timesheets = await attachApprovalState(timesheetDocs);
    const total = await Timesheet.countDocuments(query);

    res.json({
      timesheets,
      pagination: {
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    console.error('Get team timesheets error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getPendingApprovals = async (req, res) => {
  try {
    if (!APPROVER_ROLES.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const query = { status: 'Submitted' };

    if (req.user.role === 'team_lead') {
      const teamMembers = await User.find({ managerId: req.user.id }).select('_id');
      const teamMemberIds = teamMembers.map((m) => m._id);

      if (teamMemberIds.length === 0) {
        return res.json([]);
      }

      query.employeeId = { $in: teamMemberIds };
    }

    const timesheetDocs = await Timesheet.find(query)
      .populate('employeeId', 'name email department role managerId')
      .sort({ date: -1 });

    const enriched = await attachApprovalState(timesheetDocs);
    const pendingForCurrentRole = enriched.filter(
      (item) => item.approvalState?.nextApprover === req.user.role
    );

    res.json(pendingForCurrentRole);
  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getTimesheetById = async (req, res) => {
  try {
    const { id } = req.params;

    const timesheet = await Timesheet.findById(id)
      .populate('employeeId', 'name email department role managerId')
      .populate('approvedBy', 'name email');

    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet entry not found' });
    }

    const isOwner = timesheet.employeeId._id.toString() === req.user.id;
    const isManager = APPROVER_ROLES.includes(req.user.role);

    if (!isOwner && !isManager) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const approvalHistory = await TimesheetApproval.find({ timesheetId: id })
      .populate('managerId', 'name email role')
      .sort({ actionDate: -1 });

    const approvalState = buildTimesheetApprovalState(timesheet.employeeId?.role || 'employee', approvalHistory);

    res.json({ timesheet, approvalHistory, approvalState });
  } catch (error) {
    console.error('Get timesheet by ID error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getEmployeeHoursReport = async (req, res) => {
  try {
    const { startDate, endDate, employeeId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Please provide startDate and endDate' });
    }

    const matchQuery = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
      status: 'Approved',
    };

    if (employeeId) {
      matchQuery.employeeId = new mongoose.Types.ObjectId(employeeId);
    } else if (req.user.role === 'employee') {
      matchQuery.employeeId = new mongoose.Types.ObjectId(req.user.id);
    }

    if (req.user.role === 'team_lead' && !employeeId) {
      const teamMembers = await User.find({ managerId: req.user.id }).select('_id');
      const teamMemberIds = teamMembers.map((m) => m._id);
      teamMemberIds.push(new mongoose.Types.ObjectId(req.user.id));
      matchQuery.employeeId = { $in: teamMemberIds };
    }

    const report = await Timesheet.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$employeeId',
          totalHours: { $sum: '$totalHours' },
          overtimeHours: { $sum: '$overtimeHours' },
          entriesCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'employee',
        },
      },
      { $unwind: '$employee' },
      {
        $project: {
          employeeId: '$_id',
          employeeName: '$employee.name',
          employeeEmail: '$employee.email',
          department: '$employee.department',
          totalHours: 1,
          overtimeHours: 1,
          entriesCount: 1,
        },
      },
      { $sort: { totalHours: -1 } },
    ]);

    res.json(report);
  } catch (error) {
    console.error('Get employee hours report error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getProjectHoursReport = async (req, res) => {
  try {
    const { startDate, endDate, employeeId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Please provide startDate and endDate' });
    }

    const matchQuery = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
      status: 'Approved',
    };

    if (employeeId) {
      matchQuery.employeeId = new mongoose.Types.ObjectId(employeeId);
    } else if (req.user.role === 'employee') {
      matchQuery.employeeId = new mongoose.Types.ObjectId(req.user.id);
    }

    if (req.user.role === 'team_lead' && !employeeId) {
      const teamMembers = await User.find({ managerId: req.user.id }).select('_id');
      const teamMemberIds = teamMembers.map((m) => m._id);
      teamMemberIds.push(new mongoose.Types.ObjectId(req.user.id));
      matchQuery.employeeId = { $in: teamMemberIds };
    }

    const report = await Timesheet.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$projectName',
          totalHours: { $sum: '$totalHours' },
          overtimeHours: { $sum: '$overtimeHours' },
          entriesCount: { $sum: 1 },
          employeeIds: { $addToSet: '$employeeId' },
        },
      },
      {
        $project: {
          projectName: '$_id',
          totalHours: 1,
          overtimeHours: 1,
          entriesCount: 1,
          uniqueEmployees: { $size: '$employeeIds' },
        },
      },
      { $sort: { totalHours: -1 } },
    ]);

    res.json(report);
  } catch (error) {
    console.error('Get project hours report error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getWeeklySummaryReport = async (req, res) => {
  try {
    const { startDate, endDate, employeeId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Please provide startDate and endDate' });
    }

    const matchQuery = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
      status: 'Approved',
    };

    if (employeeId) {
      matchQuery.employeeId = new mongoose.Types.ObjectId(employeeId);
    } else if (req.user.role === 'employee') {
      matchQuery.employeeId = new mongoose.Types.ObjectId(req.user.id);
    }

    if (req.user.role === 'team_lead' && !employeeId) {
      const teamMembers = await User.find({ managerId: req.user.id }).select('_id');
      const teamMemberIds = teamMembers.map((m) => m._id);
      teamMemberIds.push(new mongoose.Types.ObjectId(req.user.id));
      matchQuery.employeeId = { $in: teamMemberIds };
    }

    const report = await Timesheet.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            week: { $week: '$date' },
          },
          totalHours: { $sum: '$totalHours' },
          overtimeHours: { $sum: '$overtimeHours' },
          entriesCount: { $sum: 1 },
          startDate: { $min: '$date' },
          endDate: { $max: '$date' },
        },
      },
      {
        $project: {
          week: '$_id.week',
          year: '$_id.year',
          totalHours: 1,
          overtimeHours: 1,
          entriesCount: 1,
          startDate: 1,
          endDate: 1,
        },
      },
      { $sort: { year: -1, week: -1 } },
    ]);

    res.json(report);
  } catch (error) {
    console.error('Get weekly summary report error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getDailySummaryReport = async (req, res) => {
  try {
    const { date, employeeId } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'Please provide a date' });
    }

    const targetEmployeeId = employeeId || req.user.id;
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const entries = await Timesheet.find({
      employeeId: targetEmployeeId,
      date: { $gte: targetDate, $lt: nextDate },
    }).sort({ startTime: 1 });

    const summary = entries.reduce(
      (acc, entry) => {
        acc.totalHours += entry.totalHours;
        acc.overtimeHours += entry.overtimeHours;
        return acc;
      },
      { totalHours: 0, overtimeHours: 0 }
    );

    res.json({
      date: targetDate,
      entries,
      summary,
      isOvertime: summary.totalHours > STANDARD_WORKING_HOURS,
    });
  } catch (error) {
    console.error('Get daily summary error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getEmployeeWeeklySummaryReport = async (req, res) => {
  try {
    const { startDate, endDate, employeeId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Please provide startDate and endDate' });
    }

    const matchQuery = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
      status: 'Approved',
    };

    if (employeeId) {
      matchQuery.employeeId = new mongoose.Types.ObjectId(employeeId);
    } else if (req.user.role === 'employee') {
      matchQuery.employeeId = new mongoose.Types.ObjectId(req.user.id);
    }

    if (req.user.role === 'team_lead' && !employeeId) {
      const teamMembers = await User.find({ managerId: req.user.id }).select('_id');
      const teamMemberIds = teamMembers.map((m) => m._id);
      teamMemberIds.push(new mongoose.Types.ObjectId(req.user.id));
      matchQuery.employeeId = { $in: teamMemberIds };
    }

    const report = await Timesheet.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            employeeId: '$employeeId',
            year: { $year: '$date' },
            week: { $week: '$date' },
          },
          totalHours: { $sum: '$totalHours' },
          overtimeHours: { $sum: '$overtimeHours' },
          entriesCount: { $sum: 1 },
          weekStartDate: { $min: '$date' },
          weekEndDate: { $max: '$date' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id.employeeId',
          foreignField: '_id',
          as: 'employee',
        },
      },
      { $unwind: '$employee' },
      {
        $group: {
          _id: '$_id.employeeId',
          employeeName: { $first: '$employee.name' },
          employeeEmail: { $first: '$employee.email' },
          department: { $first: '$employee.department' },
          totalHours: { $sum: '$totalHours' },
          overtimeHours: { $sum: '$overtimeHours' },
          entriesCount: { $sum: '$entriesCount' },
          weeklyBreakdown: {
            $push: {
              week: '$_id.week',
              year: '$_id.year',
              totalHours: '$totalHours',
              overtimeHours: '$overtimeHours',
              entriesCount: '$entriesCount',
              weekStartDate: '$weekStartDate',
              weekEndDate: '$weekEndDate',
            },
          },
        },
      },
      {
        $project: {
          employeeId: '$_id',
          employeeName: 1,
          employeeEmail: 1,
          department: 1,
          totalHours: 1,
          overtimeHours: 1,
          entriesCount: 1,
          weeklyBreakdown: 1,
        },
      },
      { $sort: { totalHours: -1 } },
    ]);

    report.forEach((emp) => {
      emp.weeklyBreakdown.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.week - a.week;
      });
    });

    res.json(report);
  } catch (error) {
    console.error('Get employee weekly summary report error:', error);
    res.status(500).json({ message: error.message });
  }
};
