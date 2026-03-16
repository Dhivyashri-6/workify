const mongoose = require('mongoose');

// Define which leave types are paid by default
const PAID_LEAVE_TYPES = ['casual', 'sick', 'earned', 'maternity'];
const UNPAID_LEAVE_TYPES = ['other'];

const leaveSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  leaveType: {
    type: String,
    enum: ['casual', 'sick', 'earned', 'maternity', 'other'],
    required: true,
  },
  isPaid: {
    type: Boolean,
    default: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  numberOfDays: {
    type: Number,
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: [
      'Pending_TeamLeader',
      'Pending_HR', 
      'Pending_Director',
      'Approved',
      'Rejected_By_TeamLeader', 
      'Rejected_By_HR',
      'Rejected_By_Director'
    ],
    default: 'Pending_TeamLeader',
  },
  approvals: [
    {
      role: {
        type: String,
        enum: ['team_lead', 'hr', 'director'],
      },
      userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
      status: {
        type: String,
        enum: ['approved', 'rejected', 'pending'],
        default: 'pending',
      },
      comments: String,
      approvedAt: Date,
    },
  ],
  rejectionReason: String,
  rejectedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save hook to set isPaid based on leave type if not explicitly set
leaveSchema.pre('save', function(next) {
  if (this.isNew && this.isPaid === undefined) {
    // Default: 'other' type is unpaid, all others are paid
    this.isPaid = UNPAID_LEAVE_TYPES.includes(this.leaveType) ? false : true;
  }
  next();
});

const Leave = mongoose.model('Leave', leaveSchema);

// Export the model and the paid/unpaid leave type constants
module.exports = Leave;
module.exports.PAID_LEAVE_TYPES = PAID_LEAVE_TYPES;
module.exports.UNPAID_LEAVE_TYPES = UNPAID_LEAVE_TYPES;
