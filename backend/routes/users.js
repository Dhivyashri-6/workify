const express = require('express');
const {
  getProfile,
  updateProfile,
  getAllUsers,
  getTeamMembers,
  getManagers,
  addUser,
  updateUser,
  assignTeam,
  removeUser,
} = require('../controllers/userController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.get('/team', auth, getTeamMembers);
router.get('/managers', auth, getManagers);
router.post('/assign-team', auth, authorize('director'), assignTeam);
router.get('/', auth, authorize('director'), getAllUsers);
router.post('/', auth, authorize('director'), addUser);
router.put('/:id', auth, authorize('director'), updateUser);
router.delete('/:id', auth, authorize('director'), removeUser);

module.exports = router;
