import express from 'express';

import { isAuthenticated } from '../utils/isAuthenticated.js';
import { User } from '../Models/User.Model.js';
import { Register } from '../Controllers/Auth.Controllers/Register.Controller.js';
import { Verify_Email } from '../Controllers/Auth.Controllers/Verify_Email.Controller.js';
import { Resend_OTP } from '../Controllers/Auth.Controllers/ResendOTP.Controller.js';
import { Login } from '../Controllers/Auth.Controllers/Login.Controller.js';
import { Forgot_password } from '../Controllers/Auth.Controllers/ForgotPassword.Controller.js';
import { Reset_Password } from '../Controllers/Auth.Controllers/ResetPassword.Controller.js';
import { Logout } from '../Controllers/Auth.Controllers/Logout.Controller.js';


const Router = express.Router();

Router.post('/register', Register);

Router.post('/verify-otp', Verify_Email);

Router.post('/resend-otp', Resend_OTP);

Router.post('/login', Login);

Router.post('/forgot-password', Forgot_password);

Router.post('/reset-password/:token', Reset_Password);

Router.post('/logout', Logout);

Router.get('/user', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId)
            .select('username email');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


// Protected route example to check authentication
Router.get('/check-auth', isAuthenticated, (req, res) => {
    res.status(200).json({ message: "User is authenticated" });
});



export default Router;