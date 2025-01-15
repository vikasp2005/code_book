import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const Alert = ({
    message,
    type = 'success',
    duration = 3000,
    onClose,
    className = ''
}) => {
    const [progress, setProgress] = useState(100);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        if (duration) {
            const progressInterval = setInterval(() => {
                setProgress((prev) => {
                    if (prev <= 0) {
                        clearInterval(progressInterval);
                        return 0;
                    }
                    return prev - (100 / (duration / 10));
                });
            }, 10);

            const timeout = setTimeout(() => {
                setIsVisible(false);
                if (onClose) onClose();
            }, duration);

            return () => {
                clearInterval(progressInterval);
                clearTimeout(timeout);
            };
        }
    }, [duration, onClose]);

    const getAlertStyles = () => {
        switch (type) {
            case 'success':
                return {
                    wrapper: 'bg-green-50 border-green-500 text-green-700',
                    progress: 'bg-green-500'
                };
            case 'error':
                return {
                    wrapper: 'bg-red-50 border-red-500 text-red-700',
                    progress: 'bg-red-500'
                };
            case 'warning':
                return {
                    wrapper: 'bg-yellow-50 border-yellow-500 text-yellow-700',
                    progress: 'bg-yellow-500'
                };
            case 'info':
                return {
                    wrapper: 'bg-blue-50 border-blue-500 text-blue-700',
                    progress: 'bg-blue-500'
                };
            default:
                return {
                    wrapper: 'bg-gray-50 border-gray-500 text-gray-700',
                    progress: 'bg-gray-500'
                };
        }
    };

    if (!isVisible) return null;

    const styles = getAlertStyles();

    return (
        <div
            className={`rounded-lg border p-4 shadow-lg transition-all duration-500 ease-in-out relative overflow-hidden ${styles.wrapper} ${className}`}
            role="alert"
        >
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{message}</p>
                {onClose && (
                    <button
                        onClick={() => {
                            setIsVisible(false);
                            onClose();
                        }}
                        className="ml-4 inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
                        aria-label="Close alert"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>
            {duration && (
                <div className="absolute bottom-0 left-0 h-1 w-full bg-gray-200">
                    <div
                        className={`h-full ${styles.progress} transition-all duration-100 ease-linear`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}
        </div>
    );
};

export default Alert;