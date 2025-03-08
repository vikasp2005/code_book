import bcrypt from "bcrypt";
import { body, validationResult } from "express-validator";
import { User } from "../../Models/User.Model.js";
import { transporter } from "../../Middleware/EmailConfiguration.js";

export const Register = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .bail()
        .isEmail().withMessage('Please provide a valid email address'),
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
            const { email, password } = req.body;
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ status: 'warning', message: 'Email already registered' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const otpExpires = new Date(Date.now() + 3600000);

            const user = new User({
                email,
                password: hashedPassword,
                otp,
                otpExpires
            });

            await user.save();

            const verificationEmail = {
                from: process.env.EMAIL,
                to: email,
                subject: 'Verify Your Email',
                html: `Your verification code is: <strong>${otp}</strong><br>This code will expire in 1 hour.`
            };

            await transporter.sendMail(verificationEmail);

            res.status(201).json({ status: 'success', message: 'Registration successful. Please check your email for OTP.' });
        } catch (error) {
            console.log(error);
            res.status(500).json({ status: 'error', message: 'Server error' });
        }
    }
];