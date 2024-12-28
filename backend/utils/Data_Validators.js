import { body } from 'express-validator';


// Validation middleware
export const registerValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
    body('password')
        .isLength({ min: 8, max: 16 })
        .withMessage('Password must be 8-16 characters long')
        .matches(/[A-Z]/)
        .withMessage('Password must contain at least one uppercase letter')
        .matches(/\d/)
        .withMessage('Password must contain at least one number')
        .matches(/[!@#$%^&*(),.?":{}|<>]/)
        .withMessage('Password must contain at least one special character')

];