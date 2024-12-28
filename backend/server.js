import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import cors from 'cors';

import { connectDB } from './DB/connectDB.js';
import { ConfigureSession } from './utils/ConfigureSession.js';
import { performCleanup } from './utils/ClearExpired.js';

import AuthRouter from './Routers/Auth.Router.js';


dotenv.config();

const app = express();

app.use(morgan("dev"));
app.use(
    cors({
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));



connectDB();

ConfigureSession(app);



app.get("/", (req, res) => {
    res.end("welcome");

});

app.use('/api/auth', AuthRouter);


const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log(`server is running on the port : ${PORT}`);
})


// Graceful shutdown handling
const gracefulShutdown = async () => {
    console.log('Received shutdown signal. Starting cleanup...');
    try {
        await performCleanup();
        server.close(() => {
            console.log('Server shut down successfully');
            process.exit(0);
        });
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);