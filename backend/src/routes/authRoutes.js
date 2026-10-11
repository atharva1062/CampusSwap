const express = require('express');
const router = express.Router();
const {
  register,
  login,
  verifyStudent,
  activateStudent,
  changePassword,
  resetPassword,
  getMe,
  getUserById,
  updateProfile,
  sendOtp,
  verifyOtp,
} = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/verify-student', verifyStudent);
router.post('/activate-student', activateStudent);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/change-password', authenticate, changePassword);
router.post('/reset-password', resetPassword);
router.get('/me', authenticate, getMe);
router.get('/user/:id', authenticate, getUserById);
router.put('/profile', authenticate, updateProfile);

module.exports = router;
