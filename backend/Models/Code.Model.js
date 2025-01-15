import mongoose from 'mongoose';

const CodeSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    fileName: {
        type: String,
        required: true,

    },
    code: {
        type: String,
        required: true,

    },
    language: {
        type: String,
        required: true,
    },
    created_at: {
        type: Date,
        default: Date.now(),
    },
    last_modified_at: {
        type: Date,
        default: Date.now(),
    }
});

export const Code = mongoose.model("Code", CodeSchema);