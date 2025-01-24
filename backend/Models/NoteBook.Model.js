import mongoose from "mongoose";
const NotebookSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    cells: [{
        id: String,
        code: String,
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

export const Notebook = mongoose.model('Notebook', NotebookSchema);