// Notebook.Router.js
import express from 'express'
import { Notebook } from "../Models/NoteBook.Model.js";
import { isAuthenticated } from '../utils/isAuthenticated.js';

const Router = express.Router();

// Save notebook
Router.post('/save', isAuthenticated, async (req, res) => {
    try {
        const { name, cells } = req.body;

        // Validate cells
        const validatedCells = cells.map(cell => ({
            ...cell,
            type: cell.type || 'code',
            content: cell.type === 'text' ? cell.content : undefined
        }));

        const notebook = new Notebook({
            name,
            cells: validatedCells,
            userId: req.session.userId
        });

        await notebook.save();
        res.json(notebook);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update notebook
Router.put('/update/:id', isAuthenticated, async (req, res) => {
    try {
        const { name, cells } = req.body;

        // Validate cells
        const validatedCells = cells.map(cell => ({
            ...cell,
            type: cell.type || 'code',
            content: cell.type === 'text' ? cell.content : undefined
        }));

        const notebook = await Notebook.findOneAndUpdate(
            { _id: req.params.id, userId: req.session.userId },
            {
                name,
                cells: validatedCells,
                updatedAt: Date.now()
            },
            { new: true }
        );

        if (!notebook) {
            return res.status(404).json({ error: 'Notebook not found' });
        }

        res.json(notebook);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all notebooks with lazy loading
Router.get('/list', isAuthenticated, async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        const notebooks = await Notebook.find({ userId: req.session.userId })
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const total = await Notebook.countDocuments({ userId: req.session.userId });

        res.json({
            notebooks,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single notebook
Router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const notebook = await Notebook.findOne({
            _id: req.params.id,
            userId: req.session.userId
        }).lean();

        if (!notebook) {
            return res.status(404).json({ error: 'Notebook not found' });
        }

        res.json(notebook);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete notebook
Router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const notebook = await Notebook.findOneAndDelete({
            _id: req.params.id,
            userId: req.session.userId
        });

        if (!notebook) {
            return res.status(404).json({ error: 'Notebook not found' });
        }

        res.json({ message: 'Notebook deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Check filename
Router.get('/checkfilename/:fileName', isAuthenticated, async (req, res) => {
    try {
        const { fileName } = req.params;
        const existingNotebook = await Notebook.findOne({
            name: fileName,
            userId: req.session.userId
        });

        return res.json({ exists: !!existingNotebook });
    } catch (error) {
        console.error('Error checking filename:', error);
        return res.status(500).json({
            error: 'Server error while checking filename'
        });
    }
});

export default Router;