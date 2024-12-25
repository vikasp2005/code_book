import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';

import { connectDB } from './DB/connectDB.js';
import { ConfigureSession } from './utils/configureSession.js';

import AuthRouter from './Routers/Auth.Router.js';


dotenv.config();

const app = express();

app.use(morgan("dev"));


connectDB();

ConfigureSession(app);



app.get("/", (req, res) => {
    res.end("welcome");

});

app.use('/api/auth',AuthRouter);


const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log(`server is running on the port : ${PORT}`);
})