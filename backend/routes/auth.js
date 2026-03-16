const express = require('express');
const { register, login, getCurrentUser, changePassword } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, getCurrentUser);
router.put('/change-password', auth, changePassword);

module.exports = router;
