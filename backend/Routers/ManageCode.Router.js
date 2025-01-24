// routes/managecode.routes.js
import express from 'express';
import { save, update, list, getById, deleteProgram, checkProgram } from '../Controllers/Code.Controllers/save.Controller.js';
import { isAuthenticated } from '../utils/isAuthenticated.js';

const Router = express.Router();

Router.post('/save', isAuthenticated, save);
Router.put('/update/:id', isAuthenticated, update);
Router.get('/list', isAuthenticated, list);
Router.get('/:id', isAuthenticated, getById);
Router.delete('/:id', isAuthenticated, deleteProgram);

// Check if filename exists for the current user
Router.get('/checkfilename/:fileName', isAuthenticated, checkProgram);

export default Router;