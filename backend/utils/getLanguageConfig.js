import { platform } from 'os';


// Language command configurations for different OS
const OS_TYPE = platform();



export const LANGUAGE_CONFIGS = {
    python: {
        windows: {
            command: 'python',
            fileExtension: '.py'
        },
        darwin: {
            command: 'python3',
            fileExtension: '.py'
        },
        linux: {
            command: 'python3',
            fileExtension: '.py'
        }
    },
    javascript: {
        windows: {
            command: 'node',
            fileExtension: '.js'
        },
        darwin: {
            command: 'node',
            fileExtension: '.js'
        },
        linux: {
            command: 'node',
            fileExtension: '.js'
        }
    },
    cpp: {
        windows: {
            compiler: 'g++',
            fileExtension: '.cpp',
            outputExtension: '.exe'
        },
        darwin: {
            compiler: 'g++',
            fileExtension: '.cpp',
            outputExtension: ''
        },
        linux: {
            compiler: 'g++',
            fileExtension: '.cpp',
            outputExtension: ''
        }
    },
    java: {
        windows: {
            compiler: 'javac',
            runtime: 'java',
            fileExtension: '.java'
        },
        darwin: {
            compiler: 'javac',
            runtime: 'java',
            fileExtension: '.java'
        },
        linux: {
            compiler: 'javac',
            runtime: 'java',
            fileExtension: '.java'
        }
    }
};

// Helper function to get OS-specific configuration
export const getLanguageConfig = (language) => {
    const osType = OS_TYPE.toLowerCase();
    const osConfig = LANGUAGE_CONFIGS[language][
        osType === 'windows' ? 'windows' :
            osType === 'darwin' ? 'darwin' : 'linux'
    ];

    if (!osConfig) {
        throw new Error(`Unsupported language ${language} for OS ${osType}`);
    }
    return osConfig;
};