import crypto from 'crypto';
import bcrypt from 'bcrypt';
import {validationResult} from 'express-validator';

import { transporter } from '../utils/EmailConfiguration.js';
import { User } from '../Models/User.Model.js';




export const Register = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Create user
        const user = new User({
            email,
            password: hashedPassword,
            verificationToken
        });

        await user.save();

        // Send verification email
        const verificationEmail = {
            from: 'your-email@gmail.com',
            to: email,
            subject: 'Verify Your Email',
            html: `Click <a href="http://localhost:3000/verify/${verificationToken}">here</a> to verify your email.`
        };

        await transporter.sendMail(verificationEmail);

        res.status(201).json({ message: 'Registration successful. Please check your email to verify your account.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};