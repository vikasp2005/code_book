
// emailConfig.js
import nodemailer from 'nodemailer';

export let transporter = null;

export const initializeEmailConfig = () => {
    try {
        transporter = nodemailer.createTransport({
            service: 'gmail',
            port: 587,
            secure: true,
            secureConnection: true,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.NODEMAILER_PASSKEY,
            }
        });

        // Verify the connection
        transporter.verify((error) => {
            if (error) {
                console.error('Error verifying email configuration:', error);
            } else {
                console.log('Email server is ready to send messages');
            }
        });

        return transporter;
    } catch (error) {
        console.error('Failed to initialize email configuration:', error);
        throw error;
    }
};