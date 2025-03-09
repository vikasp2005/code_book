import React, { useState, useEffect } from 'react';
import { LoaderIcon, CustomButton } from '../Pages/CodeEditor';
import { X } from 'lucide-react';

const DeleteConfirmationDialog = ({ isOpen, onClose, fileName, confirmDelete, isDeleting }) => {
    const [inputFileName, setInputFileName] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                handleClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    const handleDelete = () => {
        if (inputFileName === fileName) {

            confirmDelete();
            setInputFileName('');
            setError('');
        } else {
            setError('File name does not match');
        }
    };

    const handleClose = () => {
        setInputFileName('');
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-md relative">
                {/* Close button */}
                <button
                    onClick={handleClose}
                    className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
                >
                    <X className="h-4 w-4" />
                </button>

                {/* Header */}
                <div className="p-6 pb-0">
                    <h2 className="text-lg font-semibold text-gray-900">Delete Program</h2>
                    <p className="mt-2 text-sm text-gray-500">
                        This action cannot be undone. Please type{' '}
                        <span className="font-semibold">{fileName}</span> to confirm deletion.
                    </p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <input
                        type="text"
                        value={inputFileName}
                        onChange={(e) => {
                            setInputFileName(e.target.value);
                            setError('');
                        }}
                        placeholder="Enter file name to confirm"
                        className={`w-full px-3 py-2 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-500' : 'border-gray-300'
                            }`}
                    />

                    {error && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                            <X className="h-4 w-4" />
                            {error}
                        </p>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 p-6 pt-0">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        Cancel
                    </button>
                    <CustomButton
                        variant="danger"
                        onClick={handleDelete}
                        disabled={isDeleting}
                    >
                        {isDeleting ? <LoaderIcon /> : 'Delete'}
                    </CustomButton>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationDialog;