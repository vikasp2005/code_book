import bcrypt from 'bcrypt';
import { User } from '../../Models/User.Model.js';
import { transporter } from '../../Middleware/EmailConfiguration.js';
import { body, validationResult } from 'express-validator';

export const Login = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .bail()
    .isEmail().withMessage('Please provide a valid email address'),
  body('password')
    .trim()
    .notEmpty().withMessage('Password is required')
    .bail()
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),

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
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ status: 'warning', message: 'Email id not registered' });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(400).json({ status: 'warning', message: 'password is incorrect' });
      }

      if (!user.verified) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpires = new Date(Date.now() + 3600000);
        await user.save();

        const verificationEmail = {
          from: 'your-email@gmail.com',
          to: email,
          subject: 'Account Verification Required',
          html: `Your verification code is: <strong>${otp}</strong><br>This code will expire in 1 hour.`
        };
        await transporter.sendMail(verificationEmail);
        req.session.userId = user._id;
        req.session.cookie.maxAge = 24 * 60 * 60 * 1000;
        return res.status(403).json({
          status: 'info',
          message: 'Email verification required',
          requiresVerification: true
        });
      }

      req.session.userId = user._id;
      req.session.cookie.maxAge = 24 * 60 * 60 * 1000;

      res.json({ status: 'success', message: 'Login successful' });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Server error' });
    }
  }
];