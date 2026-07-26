const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');
const { validateRegister, validateLogin, validateGuestLogin } = require('../middleware/validate');

router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/google', authController.googleAuth);
router.post('/guest-login', validateGuestLogin, authController.guestLogin);
router.post('/logout', protect, authController.logout);
router.post('/create-employee', protect, authorize('manager', 'admin'), authController.createEmployee);

router.route('/profile')
  .get(protect, authController.getProfile)
  .put(protect, authController.updateProfile);

module.exports = router;
