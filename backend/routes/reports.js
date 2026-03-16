const express = require('express');
const {
  getLeaveReport,
  getEmployeeLeaveReport,
  downloadReport,
  downloadLeavesByDateRange,
  downloadTimesheetsByDateRange,
  getPayrollReport,
  downloadPayrollByDateRange,
} = require('../controllers/reportController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/leaves', auth, authorize('director'), getLeaveReport);
router.get('/employee/:employeeId', auth, authorize('director'), getEmployeeLeaveReport);
router.get('/download/leaves/range', auth, downloadLeavesByDateRange);
router.get('/download/timesheets/range', auth, downloadTimesheetsByDateRange);
router.get('/payroll', auth, getPayrollReport);
router.get('/download/payroll/range', auth, downloadPayrollByDateRange);
router.get('/download/:type', auth, downloadReport);

module.exports = router;
