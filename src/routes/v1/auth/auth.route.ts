import express from 'express';
import { createAccount, forgotPassword, login, refreshToken,  resetPassword,  verifyOtp } from '../../../controllers/client/auth/Auth.controller';

const router = express.Router();

router.route('/').get((req, res) => {
    res.send("Hello world");
});

router.route('/create-account').post(createAccount);
router.route('/login').post(login);
router.route('/refreshToken').post(refreshToken)
router.route('/forgot-password').post(forgotPassword)
router.route('/verify-otp').post(verifyOtp)
router.route('/reset-password').post(resetPassword)

export default router;