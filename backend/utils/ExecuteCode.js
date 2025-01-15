import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { LANGUAGE_CONFIGS, getLanguageConfig } from './getLanguageConfig.js';
import { getTempDir, cleanupResources } from './TempDir.js';

export const runningProcesses = new Map();
export const wsClients = new Map();

const ALLOWED_LANGUAGES = Object.keys(LANGUAGE_CONFIGS);



export const executeCode = async (req, res) => {
    const { code, language } = req.body;
    const clientId = req.headers['client-id'];
    const ws = wsClients.get(clientId);

    if (!ws) {
        return res.status(400).json({
            error: 'No WebSocket connection found. Please refresh the page.'
        });
    }

    if (!ALLOWED_LANGUAGES.includes(language)) {
        return res.status(400).json({ error: 'Unsupported language' });
    }

    const tempDir = getTempDir(clientId);
    await fs.mkdir(tempDir, { recursive: true });
    const fileName = `temp_${Date.now()}`;
    let processInstance;

    try {
        const config = getLanguageConfig(language);

        switch (language) {
            case 'python':
                await fs.writeFile(path.join(tempDir, fileName + config.fileExtension), code);
                processInstance = spawn(config.command, [fileName + config.fileExtension], {
                    cwd: tempDir,
                    stdio: ['pipe', 'pipe', 'pipe']
                });
                break;

            case 'javascript':
                processInstance = spawn(config.command, ['-e', code], {
                    cwd: tempDir,
                    stdio: ['pipe', 'pipe', 'pipe']
                });
                break;

            case 'cpp': {
                const sourceFile = path.join(tempDir, fileName + config.fileExtension);
                const outputFile = path.join(tempDir, fileName + config.outputExtension);

                await fs.writeFile(sourceFile, code);

                // Compile C++ code
                await new Promise((resolve, reject) => {
                    const compile = spawn(config.compiler, [sourceFile, '-o', outputFile]);

                    let errorOutput = '';
                    compile.stderr.on('data', (data) => {
                        errorOutput += data.toString();
                    });

                    compile.on('close', (code) => {
                        if (code === 0) resolve();
                        else reject(new Error(errorOutput || 'Compilation failed'));
                    });
                });

                processInstance = spawn(outputFile, [], {
                    cwd: tempDir,
                    stdio: ['pipe', 'pipe', 'pipe']
                });
                break;
            }

            case 'java': {
                const classMatch = code.match(/class\s+(\w+)/);
                if (!classMatch) {
                    throw new Error('No public class found in Java code');
                }

                const className = classMatch[1];
                const javaFile = path.join(tempDir, className + config.fileExtension);

                await fs.writeFile(javaFile, code);

                // Compile Java code
                await new Promise((resolve, reject) => {
                    const compile = spawn(config.compiler, [className + config.fileExtension], {
                        cwd: tempDir
                    });

                    let errorOutput = '';
                    compile.stderr.on('data', (data) => {
                        errorOutput += data.toString();
                    });

                    compile.on('close', (code) => {
                        if (code === 0) resolve();
                        else reject(new Error(errorOutput || 'Compilation failed'));
                    });
                });

                processInstance = spawn(config.runtime, [className], {
                    cwd: tempDir,
                    stdio: ['pipe', 'pipe', 'pipe']
                });
                break;
            }
        }

        runningProcesses.set(clientId, processInstance);

        processInstance.stdout.on('data', (data) => {
            ws.send(JSON.stringify({
                type: 'output',
                data: data.toString()
            }));
        });

        processInstance.stderr.on('data', (data) => {
            ws.send(JSON.stringify({
                type: 'error',
                data: data.toString()
            }));
        });

        processInstance.on('close', async (code) => {
            runningProcesses.delete(clientId);
            await cleanupResources(tempDir);
            ws.send(JSON.stringify({
                type: 'system',
                data: `\nProcess exited with code ${code}\n`
            }));
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Execution error:', error);
        ws.send(JSON.stringify({
            type: 'error',
            data: error.message
        }));
        await cleanupResources(tempDir);
        res.status(500).json({ error: 'Error during code execution' });
    }
};