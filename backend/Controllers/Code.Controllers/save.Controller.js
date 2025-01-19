import { Code } from "../../Models/Code.Model.js";

export const save = async (req, res) => {
    try {
        const { fileName, code, language } = req.body;

        if (!fileName || !code || !language) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check for existing file
        const existingProgram = await Code.findOne({
            fileName,
            user: req.session.userId
        });

        if (existingProgram) {
            return res.status(400).json({
                error: 'A file with this name already exists'
            });
        }

        const new_code = new Code({
            author: req.session.userId,
            fileName,
            code,
            language,
            created_at: Date.now(),
            last_modified_at: Date.now(),
        });

        const savedCode = await new_code.save();
        return res.status(201).json({
            message: 'Code saved successfully',
            id: savedCode._id
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const update = async (req, res) => {
    try {
        const { id } = req.params;
        const { code, language } = req.body;

        const updatedCode = await Code.findOneAndUpdate(
            { _id: id, author: req.session.userId },
            {
                code,
                language,
                last_modified_at: Date.now()
            },
            { new: true }
        );

        if (!updatedCode) {
            return res.status(404).json({ message: 'Code not found or unauthorized' });
        }

        return res.status(200).json({ message: 'Code updated successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const list = async (req, res) => {
    try {
        const programs = await Code.find({ author: req.session.userId })
            .select('fileName language created_at last_modified_at')
            .sort({ last_modified_at: -1 });

        return res.status(200).json(programs);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const code = await Code.findOne({ _id: id, author: req.session.userId });

        if (!code) {
            return res.status(404).json({ message: 'Code not found or unauthorized' });
        }

        return res.status(200).json(code);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server error' });
    }
};


export const deleteProgram = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await Code.findOneAndDelete({
            _id: id,
            author: req.session.userId
        });

        if (!result) {
            return res.status(404).json({ message: 'Program not found or unauthorized' });
        }

        return res.status(200).json({ message: 'Program deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const checkProgram = async (req, res) => {
    try {
        const { fileName } = req.params;
        const existingProgram = await Code.findOne({
            fileName: fileName,
            user: req.session.userId
        });

        return res.json({ exists: !!existingProgram });
    } catch (error) {
        console.error('Error checking filename:', error);
        return res.status(500).json({
            error: 'Server error while checking filename'
        });
    }
}