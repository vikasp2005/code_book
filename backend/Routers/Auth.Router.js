import express from 'express';

import { registerValidation } from '../utils/Data_Validators.js';

import { Register } from '../Controllers/Register.Controller.js';
import { Verify_Email } from '../Controllers/Verify_Email.Controller.js';
import { Resend_OTP } from '../Controllers/ResendOTP.Controller.js';
import { Login } from '../Controllers/Login.Controller.js';
import { Forgot_password } from '../Controllers/ForgotPassword.Controller.js';
import { Reset_Password } from '../Controllers/ResetPassword.Controller.js';


const Router = express.Router();

Router.post('/register', registerValidation, Register);

Router.post('/verify-otp', Verify_Email);

Router.post('/resend-otp', Resend_OTP);

Router.post('/login', registerValidation, Login);

Router.post('/forgot-password', Forgot_password);

Router.post('/reset-password/:token', Reset_Password);



export default Router;