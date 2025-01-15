import express from 'express';
import { isAuthenticated } from '../utils/isAuthenticated.js';
import { save } from '../Controllers/Code.Controllers/save.Controller.js';

const Router = express.Router();

Router.post('/save', isAuthenticated, save);

export default Router;