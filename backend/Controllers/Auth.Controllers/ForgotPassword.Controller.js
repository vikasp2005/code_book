import crypto from 'crypto';

import { User } from '../../Models/User.Model.js';
import { transporter } from '../../utils/EmailConfiguration.js';


export const Forgot_password = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        const resetEmail = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Password Reset Request',
            html: `Click <a href="http://localhost:3000/reset-password/${resetToken}">here</a> to reset your password.`
        };

        await transporter.sendMail(resetEmail);
        res.json({ message: 'Password reset email sent' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};