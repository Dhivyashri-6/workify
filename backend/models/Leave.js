const mongoose = require('mongoose');

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

module.exports = mongoose.model('Leave', leaveSchema);
