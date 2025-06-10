const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.post('/register', authController.register);
router.post('/verify-otp', authController.verifyOTP);
router.post('/login', authController.login);
//
//
router.post('/request-reset', authController.requestPasswordReset);
router.get('/validate-reset/:token', authController.validateResetToken);
router.post('/reset-password/:token', authController.resetPassword);



module.exports = router;