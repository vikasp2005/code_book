import { User } from '../../Models/User.Model.js';
import { transporter } from '../../Middleware/EmailConfiguration.js';
import { body, validationResult } from 'express-validator';

export const Resend_OTP = [
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
                return res.status(404).json({ status: 'warning', message: 'User not found' });
            }

            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            user.otp = otp;
            user.otpExpires = new Date(Date.now() + 3600000);
            await user.save();

            const verificationEmail = {
                from: process.env.EMAIL,
                to: email,
                subject: 'New Verification Code',
                html: `Your new verification code is: <strong>${otp}</strong><br>This code will expire in 1 hour.`
            };

            await transporter.sendMail(verificationEmail);

            res.json({ status: 'success', message: 'New OTP sent successfully' });
        } catch (error) {
            res.status(500).json({ status: 'error', message: 'Server error' });
        }
    }
];