const mongoose = require('mongoose');

/**
 * TimesheetApproval Model
 * Stores approval history for timesheet entries
 */
const timesheetApprovalSchema = new mongoose.Schema({
  // Reference to the timesheet entry
  timesheetId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Timesheet',
    required: [true, 'Timesheet ID is required'],
  },
  // Reference to the manager who took action
  managerId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Manager ID is required'],
  },
  // Status of the approval action
  status: {
    type: String,
    enum: ['Approved', 'Rejected'],
    required: [true, 'Status is required'],
  },
  // Comments from the manager
  comments: {
    type: String,
    trim: true,
    maxlength: [500, 'Comments cannot exceed 500 characters'],
  },
  // Date when the action was taken
  actionDate: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Index for efficient querying
timesheetApprovalSchema.index({ timesheetId: 1 });
timesheetApprovalSchema.index({ managerId: 1 });

const TimesheetApproval = mongoose.model('TimesheetApproval', timesheetApprovalSchema);

module.exports = TimesheetApproval;
