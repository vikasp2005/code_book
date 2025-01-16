// routes/managecode.routes.js
import express from 'express';
import { save, update, list, getById, deleteProgram } from '../Controllers/Code.Controllers/save.Controller.js';
import { isAuthenticated } from '../utils/isAuthenticated.js';

const router = express.Router();

router.post('/save', isAuthenticated, save);
router.put('/update/:id', isAuthenticated, update);
router.get('/list', isAuthenticated, list);
router.get('/:id', isAuthenticated, getById);
router.delete('/:id', isAuthenticated, deleteProgram);

export default router;