const express = require('express');
const {
  applyLeave,
  getMyLeaves,
  getTeamLeaves,
  getAllLeaves,
  getLeaveRequests,
  approveLeave,
  rejectLeave,
  getLeaveHistory,
} = require('../controllers/leaveController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/apply', auth, applyLeave);
router.get('/my-leaves', auth, getMyLeaves);
router.get('/team-leaves', auth, getTeamLeaves);
router.get('/requests', auth, getLeaveRequests);
router.get('/history/:userId', auth, getLeaveHistory);
router.get('/', auth, authorize('director'), getAllLeaves);
router.put('/:id/approve', auth, approveLeave);
router.put('/:id/reject', auth, rejectLeave);

module.exports = router;
