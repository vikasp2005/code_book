// Notebook.Model.js
import mongoose from "mongoose";

const NotebookSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    cells: [{
        id: String,
        type: {
            type: String,
            enum: ['code', 'text'],
            default: 'code'
        },
        code: String,
        content: String, // For text cells
        output: String,
        language: String,
        name: String,
        height: Number,
        index: Number
    }],
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

NotebookSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

export const Notebook = mongoose.model('Notebook', NotebookSchema);