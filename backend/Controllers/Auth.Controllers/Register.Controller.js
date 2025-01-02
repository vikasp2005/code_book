import bcrypt from "bcrypt";
import { validationResult } from "express-validator";

import { User } from "../../Models/User.Model.js";
import { transporter } from "../../utils/EmailConfiguration.js";


export const Register = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 3600000); // 1 hour validity

        const user = new User({
            email,
            password: hashedPassword,
            otp,
            otpExpires
        });

        await user.save();

        // Send OTP email
        const verificationEmail = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Verify Your Email',
            html: `Your verification code is: <strong>${otp}</strong><br>This code will expire in 1 hour.`
        };

        await transporter.sendMail(verificationEmail);

        res.status(201).json({ message: 'Registration successful. Please check your email for OTP.' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server error' });
    }
};
