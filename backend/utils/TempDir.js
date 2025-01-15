import path from 'path';
import fs from 'fs/promises';


// Helper function to create temp directory path
export const getTempDir = (clientId) => {
    return path.join(process.cwd(), 'temp', clientId.replace(/[^a-zA-Z0-9]/g, ''));
};

// Helper function to clean up resources
export const cleanupResources = async (tempDir) => {
    try {
        await fs.rm(tempDir, { recursive: true, force: true });
    } catch (err) {
        console.error('Error during cleanup:', err);
    }
};