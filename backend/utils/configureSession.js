import session from "express-session";
import MongoStore from "connect-mongo";


export const ConfigureSession = (app) => {
    // Configure session with MongoDB store
    // Set up session management
    // Configure session middleware
    app.use(session({
        secret: process.env.SESSION_SECRET || 'your-secure-secret', // Replace with a strong secret
        resave: false, // Avoid saving unchanged sessions
        saveUninitialized: false, // Don't create a session until it's modified
        store: MongoStore.create({
            mongoUrl: process.env.MONGO_URI, // MongoDB connection string
            collectionName: 'sessions', // Name of the collection
        }),
        cookie: {
            httpOnly: true, // Prevent access to cookies via JavaScript
            secure: process.env.NODE_ENV === 'production', // Secure cookies in production
            maxAge: 24 * 60 * 60 * 1000, // 24-hour expiration
        },
    }));
    



    console.log("Session management configured successfully.");
}