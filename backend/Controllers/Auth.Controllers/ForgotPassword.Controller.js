import crypto from 'crypto';
import { User } from '../../Models/User.Model.js';
import { transporter } from '../../Middleware/EmailConfiguration.js';
import { body, validationResult } from 'express-validator';

export const Forgot_password = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .bail()
        .isEmail().withMessage('Please provide a valid email address'),

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
            const { email } = req.body;
            const user = await User.findOne({ email });

            if (!user) {
                return res.status(400).json({ status: 'warning', message: 'User not found' });
            }

            const resetToken = crypto.randomBytes(32).toString('hex');
            user.resetPasswordToken = resetToken;
            user.resetPasswordExpires = Date.now() + 3600000;
            await user.save();

            const resetEmail = {
                from: process.env.EMAIL,
                to: email,
                subject: 'Password Reset Request',
                html: `Click <a href="http://localhost:3000/reset-password/${resetToken}">here</a> to reset your password.`
            };

            await transporter.sendMail(resetEmail);
            res.json({ status: 'success', message: 'Password reset email sent' });
        } catch (error) {
            res.status(500).json({ status: 'error', message: 'Server error' });
        }
    }
];