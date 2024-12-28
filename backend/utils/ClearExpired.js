// src/utils/ClearExpired.js
import cron from 'node-cron';
import { User } from '../Models/User.Model.js';
import MongoStore from 'connect-mongo';
import dotenv from 'dotenv';

dotenv.config();

// Function to clean expired OTPs
const cleanupOTP = async () => {
    try {
        const result = await User.updateMany(
            { otpExpires: { $lt: new Date() } },
            { $unset: { otp: "", otpExpires: "" } }
        );
        console.log(`Cleaned up ${result.modifiedCount} expired OTPs`);
    } catch (error) {
        console.error('OTP cleanup error:', error);
    }
};

// Function to clean expired sessions
const cleanupSessions = async () => {
    try {
        const sessionStore = MongoStore.create({
            mongoUrl: process.env.MONGO_URI,
            collectionName: 'sessions'
        });
        await sessionStore.clear();
        console.log('Cleared expired sessions');
    } catch (error) {
        console.error('Session cleanup error:', error);
    }
};

// Main cleanup function that runs all cleanup tasks
const runCleanup = async () => {
    try {
        await Promise.all([
            cleanupOTP(),
            cleanupSessions()
        ]);
        console.log('All cleanup tasks completed successfully');
    } catch (error) {
        console.error('Error during cleanup tasks:', error);
    }
};

// Initialize cleanup schedule
export const initializeCleanupTasks = () => {
    // Run cleanup every hour
    cron.schedule('0 * * * *', async () => {
        console.log('Starting scheduled cleanup tasks');
        await runCleanup();
    });

    // Run initial cleanup on server start
    runCleanup();
};

// Export for use in graceful shutdown
export const performCleanup = runCleanup;