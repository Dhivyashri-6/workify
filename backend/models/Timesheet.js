const mongoose = require('mongoose');

/**
 * Timesheet Model
 * Stores daily timesheet entries for employees
 */
const timesheetSchema = new mongoose.Schema({
  // Reference to the employee who created this entry
  employeeId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Employee ID is required'],
  },
  // Date of the work entry
  date: {
    type: Date,
    required: [true, 'Date is required'],
  },
  // Project name
  projectName: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxlength: [100, 'Project name cannot exceed 100 characters'],
  },
  // Task name / description
  taskName: {
    type: String,
    required: [true, 'Task name is required'],
    trim: true,
    maxlength: [200, 'Task name cannot exceed 200 characters'],
  },
  // Start time of work
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide valid time in HH:MM format'],
  },
  // End time of work
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide valid time in HH:MM format'],
  },
  // Total hours worked (auto-calculated)
  totalHours: {
    type: Number,
    required: true,
    min: [0, 'Total hours cannot be negative'],
    max: [24, 'Total hours cannot exceed 24'],
  },
  // Notes or description
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
  },
  // Current status of the timesheet entry
  status: {
    type: String,
    enum: ['Draft', 'Submitted', 'Approved', 'Rejected'],
    default: 'Draft',
  },
  // Comments from manager (for approval/rejection)
  managerComments: {
    type: String,
    trim: true,
    maxlength: [500, 'Manager comments cannot exceed 500 characters'],
  },
  // Flag for overtime (hours > standard working hours)
  isOvertime: {
    type: Boolean,
    default: false,
  },
  // Overtime hours if applicable
  overtimeHours: {
    type: Number,
    default: 0,
  },
  // Reference to the manager who approved/rejected
  approvedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  // Date when status was changed to approved/rejected
  actionDate: {
    type: Date,
  },
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
});

// Index for efficient querying
timesheetSchema.index({ employeeId: 1, date: 1 });
timesheetSchema.index({ status: 1 });
timesheetSchema.index({ employeeId: 1, status: 1 });

// Standard working hours per day (8 hours)
const STANDARD_WORKING_HOURS = 8;

/**
 * Pre-save middleware to calculate total hours and overtime
 */
timesheetSchema.pre('save', function(next) {
  if (this.isModified('startTime') || this.isModified('endTime')) {
    // Calculate total hours from start and end time
    const [startHour, startMin] = this.startTime.split(':').map(Number);
    const [endHour, endMin] = this.endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    // Calculate duration in hours
    let durationMinutes = endMinutes - startMinutes;
    if (durationMinutes < 0) {
      durationMinutes += 24 * 60; // Handle overnight work
    }
    
    this.totalHours = Math.round((durationMinutes / 60) * 100) / 100;
    
    // Check for overtime
    if (this.totalHours > STANDARD_WORKING_HOURS) {
      this.isOvertime = true;
      this.overtimeHours = Math.round((this.totalHours - STANDARD_WORKING_HOURS) * 100) / 100;
    } else {
      this.isOvertime = false;
      this.overtimeHours = 0;
    }
  }
  next();
});

/**
 * Static method to get total hours for an employee within a date range
 */
timesheetSchema.statics.getTotalHours = async function(employeeId, startDate, endDate) {
  const result = await this.aggregate([
    {
      $match: {
        employeeId: mongoose.Types.ObjectId(employeeId),
        date: { $gte: new Date(startDate), $lte: new Date(endDate) },
        status: 'Approved',
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
  
  return result.length > 0 ? result[0] : { totalHours: 0, overtimeHours: 0 };
};

/**
 * Static method to get project-wise hours
 */
timesheetSchema.statics.getProjectWiseHours = async function(employeeId, startDate, endDate) {
  return await this.aggregate([
    {
      $match: {
        employeeId: mongoose.Types.ObjectId(employeeId),
        date: { $gte: new Date(startDate), $lte: new Date(endDate) },
        status: 'Approved',
      },
    },
    {
      $group: {
        _id: '$projectName',
        totalHours: { $sum: '$totalHours' },
        entries: { $sum: 1 },
      },
    },
    {
      $sort: { totalHours: -1 },
    },
  ]);
};

const Timesheet = mongoose.model('Timesheet', timesheetSchema);

module.exports = Timesheet;
