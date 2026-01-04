const express = require('express');
const {
  getLeaveReport,
  getEmployeeLeaveReport,
  downloadReport,
} = require('../controllers/reportController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/leaves', auth, authorize('director'), getLeaveReport);
router.get('/employee/:employeeId', auth, authorize('director'), getEmployeeLeaveReport);
router.get('/download/:type', auth, downloadReport);

module.exports = router;
