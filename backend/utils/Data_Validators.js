import {body} from 'express-validator';


// Validation middleware
export const registerValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/\d/)
        .withMessage('Password must contain a number')
];