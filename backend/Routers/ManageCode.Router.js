// routes/managecode.routes.js
import express from 'express';
import { save, update, list, getById, deleteProgram, checkProgram } from '../Controllers/Code.Controllers/save.Controller.js';
import { isAuthenticated } from '../utils/isAuthenticated.js';

const router = express.Router();

router.post('/save', isAuthenticated, save);
router.put('/update/:id', isAuthenticated, update);
router.get('/list', isAuthenticated, list);
router.get('/:id', isAuthenticated, getById);
router.delete('/:id', isAuthenticated, deleteProgram);

// Check if filename exists for the current user
router.get('/checkfilename/:fileName', isAuthenticated, checkProgram);

export default router;