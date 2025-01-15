import { User } from '../../Models/User.Model.js';
import { transporter } from '../../Middleware/EmailConfiguration.js';
// New resend OTP route
export const Resend_OTP = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
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

        res.json({ message: 'New OTP sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
}