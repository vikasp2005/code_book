import nodemailer from 'nodemailer';

// Email configuration
export const transporter = nodemailer.createTransport({
    service: 'gmail',
    port: 465,
    secure: true,
    secureConnection: true,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.NODEMAILER_PASSKEY
    }
});