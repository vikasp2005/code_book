import bcrypt from 'bcrypt';
import { User } from '../../Models/User.Model.js';
import { transporter } from '../../Middleware/EmailConfiguration.js';


export const Login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Email id not registered' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'password is incorrect' });
    }

    if (!user.verified) {
      // Generate new OTP for unverified users
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.otp = otp;
      user.otpExpires = new Date(Date.now() + 3600000);
      await user.save();

      // Send new OTP email
      const verificationEmail = {
        from: 'your-email@gmail.com',
        to: email,
        subject: 'Account Verification Required',
        html: `Your verification code is: <strong>${otp}</strong><br>This code will expire in 1 hour.`
      };
      await transporter.sendMail(verificationEmail);

      return res.status(403).json({
        message: 'Email verification required',
        requiresVerification: true
      });
    }

    req.session.userId = user._id;
    req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // 24 hours


    res.json({ message: 'Login successful' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};