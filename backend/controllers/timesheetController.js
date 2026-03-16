const Timesheet = require('../models/Timesheet');
const TimesheetApproval = require('../models/TimesheetApproval');
const User = require('../models/User');

// Standard working hours constant
const STANDARD_WORKING_HOURS = 8;

/**
 * Helper function to calculate hours from time strings
 * @param {string} startTime - Start time in HH:MM format
 * @param {string} endTime - End time in HH:MM format
 * @returns {number} Total hours worked
 */
const calculateHours = (startTime, endTime) => {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  let durationMinutes = endMinutes - startMinutes;
  if (durationMinutes < 0) {
    durationMinutes += 24 * 60; // Handle overnight work
  }
  
  return Math.round((durationMinutes / 60) * 100) / 100;
};

/**
 * Create a new timesheet entry
 * POST /api/timesheets
 */
exports.createTimesheet = async (req, res) => {
  try {
    const { date, projectName, taskName, startTime, endTime, notes, status } = req.body;

    // Validate required fields
    if (!date || !projectName || !taskName || !startTime || !endTime) {
      return res.status(400).json({ 
        message: 'Please provide all required fields: date, projectName, taskName, startTime, endTime' 
      });
    }

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.status(400).json({ message: 'Invalid time format. Use HH:MM format' });
    }

    // Validate that end time is greater than start time
    const totalHours = calculateHours(startTime, endTime);
    if (totalHours <= 0 || totalHours > 24) {
      return res.status(400).json({ message: 'End time must be greater than start time' });
    }

    // Check for duplicate entry (same employee, date, and overlapping time)
    const existingEntry = await Timesheet.findOne({
      employeeId: req.user.id,
      date: new Date(date),
      $or: [
        { startTime: startTime, endTime: endTime },
        {
          $and: [
            { startTime: { $lte: startTime } },
            { endTime: { $gte: startTime } }
          ]
        },
        {
          $and: [
            { startTime: { $lte: endTime } },
            { endTime: { $gte: endTime } }
          ]
        }
      ]
    });

    if (existingEntry) {
      return res.status(400).json({ 
        message: 'A timesheet entry already exists for this time period' 
      });
    }

    // Calculate overtime
    const isOvertime = totalHours > STANDARD_WORKING_HOURS;
    const overtimeHours = isOvertime ? totalHours - STANDARD_WORKING_HOURS : 0;

    // Create the timesheet entry
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

    res.status(201).json({ 
      message: 'Timesheet entry created successfully', 
      timesheet 
    });
  } catch (error) {
    console.error('Create timesheet error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update an existing timesheet entry
 * PUT /api/timesheets/:id
 */
exports.updateTimesheet = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, projectName, taskName, startTime, endTime, notes } = req.body;

    // Find the timesheet
    const timesheet = await Timesheet.findById(id);
    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet entry not found' });
    }

    // Check ownership
    if (timesheet.employeeId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only update your own timesheet entries' });
    }

    // Only Draft entries can be updated
    if (timesheet.status !== 'Draft') {
      return res.status(400).json({ 
        message: 'Only draft timesheet entries can be updated' 
      });
    }

    // Validate time format if provided
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (startTime && !timeRegex.test(startTime)) {
      return res.status(400).json({ message: 'Invalid start time format' });
    }
    if (endTime && !timeRegex.test(endTime)) {
      return res.status(400).json({ message: 'Invalid end time format' });
    }

    // Calculate new total hours if times are updated
    const newStartTime = startTime || timesheet.startTime;
    const newEndTime = endTime || timesheet.endTime;
    const totalHours = calculateHours(newStartTime, newEndTime);

    if (totalHours <= 0) {
      return res.status(400).json({ message: 'End time must be greater than start time' });
    }

    // Update fields
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

/**
 * Delete a timesheet entry
 * DELETE /api/timesheets/:id
 */
exports.deleteTimesheet = async (req, res) => {
  try {
    const { id } = req.params;

    const timesheet = await Timesheet.findById(id);
    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet entry not found' });
    }

    // Check ownership
    if (timesheet.employeeId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own timesheet entries' });
    }

    // Only Draft entries can be deleted
    if (timesheet.status !== 'Draft') {
      return res.status(400).json({ 
        message: 'Only draft timesheet entries can be deleted' 
      });
    }

    await Timesheet.findByIdAndDelete(id);

    res.json({ message: 'Timesheet entry deleted successfully' });
  } catch (error) {
    console.error('Delete timesheet error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Submit a timesheet entry for approval
 * PUT /api/timesheets/:id/submit
 */
exports.submitTimesheet = async (req, res) => {
  try {
    const { id } = req.params;

    const timesheet = await Timesheet.findById(id);
    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet entry not found' });
    }

    // Check ownership
    if (timesheet.employeeId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only submit your own timesheet entries' });
    }

    // Only Draft entries can be submitted
    if (timesheet.status !== 'Draft') {
      return res.status(400).json({ 
        message: 'Only draft timesheet entries can be submitted' 
      });
    }

    timesheet.status = 'Submitted';
    await timesheet.save();

    res.json({ message: 'Timesheet submitted for approval', timesheet });
  } catch (error) {
    console.error('Submit timesheet error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Submit multiple timesheet entries for approval (batch submit)
 * PUT /api/timesheets/submit-batch
 */
exports.submitBatchTimesheets = async (req, res) => {
  try {
    const { timesheetIds } = req.body;

    if (!timesheetIds || !Array.isArray(timesheetIds) || timesheetIds.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of timesheet IDs' });
    }

    // Update all draft timesheets belonging to the user
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

/**
 * Approve a timesheet entry (Manager only)
 * PUT /api/timesheets/:id/approve
 */
exports.approveTimesheet = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;

    // Check if user has approval rights
    if (!['team_lead', 'hr', 'director'].includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to approve timesheets' });
    }

    const timesheet = await Timesheet.findById(id).populate('employeeId', 'name email managerId');
    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet entry not found' });
    }

    // Only Submitted entries can be approved
    if (timesheet.status !== 'Submitted') {
      return res.status(400).json({ 
        message: 'Only submitted timesheet entries can be approved' 
      });
    }

    // Team leads can only approve their team members' timesheets
    if (req.user.role === 'team_lead') {
      if (timesheet.employeeId.managerId?.toString() !== req.user.id) {
        return res.status(403).json({ 
          message: 'You can only approve timesheets from your team members' 
        });
      }
    }

    // Update timesheet status
    timesheet.status = 'Approved';
    timesheet.managerComments = comments || '';
    timesheet.approvedBy = req.user.id;
    timesheet.actionDate = new Date();
    await timesheet.save();

    // Create approval record
    await TimesheetApproval.create({
      timesheetId: id,
      managerId: req.user.id,
      status: 'Approved',
      comments: comments || '',
    });

    res.json({ message: 'Timesheet approved successfully', timesheet });
  } catch (error) {
    console.error('Approve timesheet error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Reject a timesheet entry (Manager only)
 * PUT /api/timesheets/:id/reject
 */
exports.rejectTimesheet = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;

    // Check if user has approval rights
    if (!['team_lead', 'hr', 'director'].includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to reject timesheets' });
    }

    if (!comments || comments.trim() === '') {
      return res.status(400).json({ message: 'Please provide a reason for rejection' });
    }

    const timesheet = await Timesheet.findById(id).populate('employeeId', 'name email managerId');
    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet entry not found' });
    }

    // Only Submitted entries can be rejected
    if (timesheet.status !== 'Submitted') {
      return res.status(400).json({ 
        message: 'Only submitted timesheet entries can be rejected' 
      });
    }

    // Team leads can only reject their team members' timesheets
    if (req.user.role === 'team_lead') {
      if (timesheet.employeeId.managerId?.toString() !== req.user.id) {
        return res.status(403).json({ 
          message: 'You can only reject timesheets from your team members' 
        });
      }
    }

    // Update timesheet status
    timesheet.status = 'Rejected';
    timesheet.managerComments = comments;
    timesheet.approvedBy = req.user.id;
    timesheet.actionDate = new Date();
    await timesheet.save();

    // Create approval record
    await TimesheetApproval.create({
      timesheetId: id,
      managerId: req.user.id,
      status: 'Rejected',
      comments: comments,
    });

    res.json({ message: 'Timesheet rejected', timesheet });
  } catch (error) {
    console.error('Reject timesheet error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Approve multiple timesheet entries (batch approve)
 * PUT /api/timesheets/approve-batch
 */
exports.approveBatchTimesheets = async (req, res) => {
  try {
    const { timesheetIds, comments } = req.body;

    if (!['team_lead', 'hr', 'director'].includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to approve timesheets' });
    }

    if (!timesheetIds || !Array.isArray(timesheetIds) || timesheetIds.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of timesheet IDs' });
    }

    // For team leads, verify they can only approve their team's timesheets
    let query = {
      _id: { $in: timesheetIds },
      status: 'Submitted',
    };

    if (req.user.role === 'team_lead') {
      const teamMembers = await User.find({ managerId: req.user.id }).select('_id');
      const teamMemberIds = teamMembers.map(m => m._id);
      query.employeeId = { $in: teamMemberIds };
    }

    const result = await Timesheet.updateMany(query, {
      $set: {
        status: 'Approved',
        managerComments: comments || '',
        approvedBy: req.user.id,
        actionDate: new Date(),
      },
    });

    // Create approval records
    const timesheets = await Timesheet.find({ _id: { $in: timesheetIds }, status: 'Approved' });
    await Promise.all(timesheets.map(ts => 
      TimesheetApproval.create({
        timesheetId: ts._id,
        managerId: req.user.id,
        status: 'Approved',
        comments: comments || '',
      })
    ));

    res.json({ 
      message: `${result.modifiedCount} timesheet(s) approved`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error('Batch approve error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get timesheets for the logged-in employee
 * GET /api/timesheets/my-timesheets
 */
exports.getMyTimesheets = async (req, res) => {
  try {
    const { startDate, endDate, status, page = 1, limit = 50 } = req.query;

    let query = { employeeId: req.user.id };

    // Filter by date range
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

    // Filter by status
    if (status && ['Draft', 'Submitted', 'Approved', 'Rejected'].includes(status)) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const timesheets = await Timesheet.find(query)
      .populate('employeeId', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ date: -1, startTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Timesheet.countDocuments(query);

    res.json({
      timesheets,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get my timesheets error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get timesheets for manager approval (team timesheets)
 * GET /api/timesheets/team-timesheets
 */
exports.getTeamTimesheets = async (req, res) => {
  try {
    const { startDate, endDate, status, employeeId, page = 1, limit = 50 } = req.query;

    // Check if user has approval rights
    if (!['team_lead', 'hr', 'director'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    let query = {};

    // Team leads can only see their team members' timesheets
    if (req.user.role === 'team_lead') {
      const teamMembers = await User.find({ managerId: req.user.id }).select('_id');
      const teamMemberIds = teamMembers.map(m => m._id);
      
      if (teamMemberIds.length === 0) {
        return res.json({ timesheets: [], pagination: { total: 0, page: 1, pages: 0 } });
      }
      
      query.employeeId = { $in: teamMemberIds };
    }

    // Filter by specific employee (for managers)
    if (employeeId) {
      query.employeeId = employeeId;
    }

    // Filter by date range
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

    // Filter by status
    if (status && ['Draft', 'Submitted', 'Approved', 'Rejected'].includes(status)) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const timesheets = await Timesheet.find(query)
      .populate('employeeId', 'name email department')
      .populate('approvedBy', 'name email')
      .sort({ date: -1, startTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Timesheet.countDocuments(query);

    res.json({
      timesheets,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get team timesheets error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get pending timesheets for approval
 * GET /api/timesheets/pending-approvals
 */
exports.getPendingApprovals = async (req, res) => {
  try {
    // Check if user has approval rights
    if (!['team_lead', 'hr', 'director'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    let query = { status: 'Submitted' };

    // Team leads can only see their team members' timesheets
    if (req.user.role === 'team_lead') {
      const teamMembers = await User.find({ managerId: req.user.id }).select('_id');
      const teamMemberIds = teamMembers.map(m => m._id);
      
      if (teamMemberIds.length === 0) {
        return res.json([]);
      }
      
      query.employeeId = { $in: teamMemberIds };
    }

    const timesheets = await Timesheet.find(query)
      .populate('employeeId', 'name email department')
      .sort({ date: -1 });

    res.json(timesheets);
  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get timesheet by ID
 * GET /api/timesheets/:id
 */
exports.getTimesheetById = async (req, res) => {
  try {
    const { id } = req.params;

    const timesheet = await Timesheet.findById(id)
      .populate('employeeId', 'name email department')
      .populate('approvedBy', 'name email');

    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet entry not found' });
    }

    // Check access rights
    const isOwner = timesheet.employeeId._id.toString() === req.user.id;
    const isManager = ['team_lead', 'hr', 'director'].includes(req.user.role);

    if (!isOwner && !isManager) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get approval history
    const approvalHistory = await TimesheetApproval.find({ timesheetId: id })
      .populate('managerId', 'name email')
      .sort({ actionDate: -1 });

    res.json({ timesheet, approvalHistory });
  } catch (error) {
    console.error('Get timesheet by ID error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get timesheet reports - Total hours by employee
 * GET /api/timesheets/reports/employee-hours
 */
exports.getEmployeeHoursReport = async (req, res) => {
  try {
    const { startDate, endDate, employeeId } = req.query;

    // Validate date range
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Please provide startDate and endDate' });
    }

    let matchQuery = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
      status: 'Approved',
    };

    // Filter by employee for managers or self for employees
    if (employeeId) {
      matchQuery.employeeId = new mongoose.Types.ObjectId(employeeId);
    } else if (req.user.role === 'employee') {
      matchQuery.employeeId = new mongoose.Types.ObjectId(req.user.id);
    }

    // Team leads can only see their team's reports
    if (req.user.role === 'team_lead' && !employeeId) {
      const teamMembers = await User.find({ managerId: req.user.id }).select('_id');
      const teamMemberIds = teamMembers.map(m => m._id);
      teamMemberIds.push(new mongoose.Types.ObjectId(req.user.id)); // Include self
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

/**
 * Get timesheet reports - Project-wise hours
 * GET /api/timesheets/reports/project-hours
 */
exports.getProjectHoursReport = async (req, res) => {
  try {
    const { startDate, endDate, employeeId } = req.query;

    // Validate date range
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Please provide startDate and endDate' });
    }

    let matchQuery = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
      status: 'Approved',
    };

    // Apply employee filter for employees or specific requests
    if (employeeId) {
      matchQuery.employeeId = new mongoose.Types.ObjectId(employeeId);
    } else if (req.user.role === 'employee') {
      matchQuery.employeeId = new mongoose.Types.ObjectId(req.user.id);
    }

    // Team leads can only see their team's project reports
    if (req.user.role === 'team_lead' && !employeeId) {
      const teamMembers = await User.find({ managerId: req.user.id }).select('_id');
      const teamMemberIds = teamMembers.map(m => m._id);
      teamMemberIds.push(new mongoose.Types.ObjectId(req.user.id)); // Include self
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

/**
 * Get weekly summary report
 * GET /api/timesheets/reports/weekly-summary
 */
exports.getWeeklySummaryReport = async (req, res) => {
  try {
    const { startDate, endDate, employeeId } = req.query;

    // Validate date range
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Please provide startDate and endDate' });
    }

    let matchQuery = {
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

    // Team leads can only see their team's weekly summary
    if (req.user.role === 'team_lead' && !employeeId) {
      const teamMembers = await User.find({ managerId: req.user.id }).select('_id');
      const teamMemberIds = teamMembers.map(m => m._id);
      teamMemberIds.push(new mongoose.Types.ObjectId(req.user.id)); // Include self
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

/**
 * Get daily summary for an employee
 * GET /api/timesheets/reports/daily-summary
 */
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

/**
 * Get employee weekly summary report - Breakdown by employee with weekly hours
 * GET /api/timesheets/reports/employee-weekly-summary
 */
exports.getEmployeeWeeklySummaryReport = async (req, res) => {
  try {
    const { startDate, endDate, employeeId } = req.query;

    // Validate date range
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Please provide startDate and endDate' });
    }

    let matchQuery = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
      status: 'Approved',
    };

    // Filter by specific employee if provided
    if (employeeId) {
      matchQuery.employeeId = new mongoose.Types.ObjectId(employeeId);
    } else if (req.user.role === 'employee') {
      matchQuery.employeeId = new mongoose.Types.ObjectId(req.user.id);
    }

    // Team leads can only see their team's reports
    if (req.user.role === 'team_lead' && !employeeId) {
      const teamMembers = await User.find({ managerId: req.user.id }).select('_id');
      const teamMemberIds = teamMembers.map(m => m._id);
      teamMemberIds.push(new mongoose.Types.ObjectId(req.user.id)); // Include self
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

    // Sort weekly breakdown within each employee
    report.forEach(emp => {
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

// Import mongoose for ObjectId conversion in aggregations
const mongoose = require('mongoose');
