const express = require('express');
const {
  createTimesheet,
  updateTimesheet,
  deleteTimesheet,
  submitTimesheet,
  submitBatchTimesheets,
  approveTimesheet,
  rejectTimesheet,
  approveBatchTimesheets,
  getMyTimesheets,
  getTeamTimesheets,
  getPendingApprovals,
  getTimesheetById,
  getEmployeeHoursReport,
  getProjectHoursReport,
  getWeeklySummaryReport,
  getDailySummaryReport,
  getEmployeeWeeklySummaryReport,
} = require('../controllers/timesheetController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// =====================================================
// REPORTS ROUTES (must come before parameterized routes)
// =====================================================

// Get total hours by employee report
router.get('/reports/employee-hours', auth, getEmployeeHoursReport);

// Get project-wise hours report
router.get('/reports/project-hours', auth, getProjectHoursReport);

// Get weekly summary report
router.get('/reports/weekly-summary', auth, getWeeklySummaryReport);

// Get employee weekly summary report (with weekly breakdown per employee)
router.get('/reports/employee-weekly-summary', auth, getEmployeeWeeklySummaryReport);

// Get daily summary report
router.get('/reports/daily-summary', auth, getDailySummaryReport);

// =====================================================
// EMPLOYEE ROUTES - Timesheet Entry Management
// =====================================================

// Create a new timesheet entry
router.post('/', auth, createTimesheet);

// Get employee's own timesheets with filters
router.get('/my-timesheets', auth, getMyTimesheets);

// Submit multiple timesheets for approval (batch) - before :id routes
router.put('/submit-batch', auth, submitBatchTimesheets);

// =====================================================
// MANAGER ROUTES - Approval Workflow
// =====================================================

// Get team timesheets (for managers)
router.get('/team-timesheets', auth, authorize('team_lead', 'hr', 'director'), getTeamTimesheets);

// Get pending approvals
router.get('/pending-approvals', auth, authorize('team_lead', 'hr', 'director'), getPendingApprovals);

// Batch approve timesheets - before :id routes
router.put('/approve-batch', auth, authorize('team_lead', 'hr', 'director'), approveBatchTimesheets);

// =====================================================
// PARAMETERIZED ROUTES (must come after static routes)
// =====================================================

// Get a specific timesheet by ID
router.get('/:id', auth, getTimesheetById);

// Update a timesheet entry (Draft only)
router.put('/:id', auth, updateTimesheet);

// Delete a timesheet entry (Draft only)
router.delete('/:id', auth, deleteTimesheet);

// Submit a single timesheet for approval
router.put('/:id/submit', auth, submitTimesheet);

// Approve a timesheet
router.put('/:id/approve', auth, authorize('team_lead', 'hr', 'director'), approveTimesheet);

// Reject a timesheet
router.put('/:id/reject', auth, authorize('team_lead', 'hr', 'director'), rejectTimesheet);

module.exports = router;;

// Get daily summary report
router.get('/reports/daily-summary', auth, getDailySummaryReport);

module.exports = router;
