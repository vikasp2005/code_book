import { User } from '../../Models/User.Model.js';
import { body, validationResult } from 'express-validator';

export const Verify_Email = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .bail()
    .isEmail().withMessage('Please provide a valid email address'),
  body('otp')
    .trim()
    .notEmpty().withMessage('OTP is required')
    .bail()
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 characters long'),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const uniqueErrors = errors.array().reduce((acc, error) => {
        if (!acc.some(e => e.path === error.path)) {
          acc.push(error);
        }
        return acc;
      }, []);

      return res.status(400).json({
        status: 'warning',
        errors: uniqueErrors.map(err => ({
          field: err.path,
          message: err.msg
        }))
      });
    }

    try {
      const { email, otp } = req.body;
      const user = await User.findOne({
        email,
        otp,
        otpExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({ status: 'warning', message: 'Invalid or expired OTP' });
      }

      user.verified = true;
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save();

      res.json({ status: 'success', message: 'Email verified successfully' });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Server error' });
    }
  }
];