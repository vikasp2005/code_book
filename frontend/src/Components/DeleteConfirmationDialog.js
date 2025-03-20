import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

// Reusing the LoaderIcon component
const LoaderIcon = () => (
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
    </svg>
);

// Custom Button Component
const CustomButton = ({ children, variant = 'primary', className = '', ...props }) => {
    const baseStyles = "inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 shadow-sm";
    const variants = {
        primary: "bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-indigo-300",
        secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200 active:bg-gray-300",
        danger: "bg-red-500 text-white hover:bg-red-600 active:bg-red-700",
        outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100"
    };

    return (
        <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
};

const DeleteConfirmationDialog = ({ isOpen, onClose, fileName, confirmDelete, isDeleting }) => {
    const [inputFileName, setInputFileName] = useState('');
    const [error, setError] = useState('');
    const [animateOut, setAnimateOut] = useState(false);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                handleClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    const handleDelete = async () => {
        if (inputFileName === fileName) {
            await confirmDelete();
            setInputFileName('');
            setError('');
        } else {
            setError('File name does not match');
            document.getElementById('fileName-input').classList.add('animate-shake');
            setTimeout(() => {
                document.getElementById('fileName-input')?.classList.remove('animate-shake');
            }, 500);
        }
    };

    const handleClose = () => {
        setAnimateOut(true);
        setTimeout(() => {
            setAnimateOut(false);
            setInputFileName('');
            setError('');
            onClose();
        }, 200);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm transition-opacity">
            <div
                className={`bg-white rounded-xl shadow-2xl w-full max-w-md relative border border-gray-100 transform transition-all duration-300 ${animateOut ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={handleClose}
                    className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
                >
                    <X className="h-4 w-4" />
                </button>

                {/* Header */}
                <div className="p-6 pb-2">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 mx-auto">
                        <X className="h-6 w-6 text-red-500" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 text-center">Delete Program</h2>
                    <p className="mt-2 text-sm text-gray-500 text-center">
                        This action cannot be undone. Please type{' '}
                        <span className="font-semibold text-red-500">{fileName}</span> to confirm deletion.
                    </p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <input
                        id="fileName-input"
                        type="text"
                        value={inputFileName}
                        onChange={(e) => {
                            setInputFileName(e.target.value);
                            setError('');
                        }}
                        placeholder="Enter file name to confirm"
                        className={`w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${error ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    />

                    {error && (
                        <p className="text-sm text-red-500 flex items-center gap-1 pl-2">
                            <X className="h-4 w-4" />
                            {error}
                        </p>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 pt-2 border-t border-gray-100">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    >
                        Cancel
                    </button>
                    <CustomButton
                        variant="danger"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className={`transform transition-transform ${isDeleting ? '' : 'hover:scale-105'}`}
                    >
                        {isDeleting ? <LoaderIcon /> : 'Delete Permanently'}
                    </CustomButton>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationDialog;