import { User } from '../../Models/User.Model.js';
import bcrypt from 'bcrypt';
import { body, validationResult } from 'express-validator';

export const Reset_Password = [
  body('password')
    .trim()
    .notEmpty().withMessage('Password is required')
    .bail()
    .isLength({ min: 8, max: 16 }).withMessage('Password must be between 8 and 16 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/\d/).withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character'),
  body('confirmPassword')
    .trim()
    .notEmpty().withMessage('Confirm Password is required')
    .bail()
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords and Confirm Password do not match');
      }
      return true;
    }),

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
      const { password } = req.body;
      const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({ status: 'warning', message: 'Invalid or expired reset token' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      res.json({ status: 'success', message: 'Password reset successful' });
    } catch (error) {
      console.log(error);
      res.status(500).json({ status: 'error', message: 'Server error' });
    }
  }
];