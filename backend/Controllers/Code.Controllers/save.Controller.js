import { Code } from "../../Models/Code.Model.js";

export const save = async (req, res) => {
    try {
        const { fileName, code, language } = req.body;

        if (!fileName) {
            return res.status(400).json({ message: 'fileName is required' });
        }

        if (!code) {
            return res.status(400).json({ message: 'Code is required' });
        }

        if (!language) {
            return res.status(400).json({ message: 'language is required' });
        }


        const new_code = new Code({
            author: req.session.userId,
            fileName,
            code,
            language,
            created_at: Date.now(),
            last_modified_at: Date.now(),
        });

        await new_code.save();
        return res.status(201).json({ message: 'Code saved successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server error' });
    }
}