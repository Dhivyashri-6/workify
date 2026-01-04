const express = require('express');
const {
  getHolidays,
  addHoliday,
  updateHoliday,
  deleteHoliday,
} = require('../controllers/holidayController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, getHolidays);
router.post('/', auth, authorize('director'), addHoliday);
router.put('/:id', auth, authorize('director'), updateHoliday);
router.delete('/:id', auth, authorize('director'), deleteHoliday);

module.exports = router;
