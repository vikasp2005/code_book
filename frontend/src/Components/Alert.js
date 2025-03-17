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
                    wrapper: 'bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-500 text-green-700',
                    icon: 'bg-green-100 text-green-500',
                    progress: 'bg-green-500'
                };
            case 'error':
                return {
                    wrapper: 'bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 text-red-700',
                    icon: 'bg-red-100 text-red-500',
                    progress: 'bg-red-500'
                };
            case 'warning':
                return {
                    wrapper: 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-l-4 border-yellow-500 text-yellow-700',
                    icon: 'bg-yellow-100 text-yellow-500',
                    progress: 'bg-yellow-500'
                };
            case 'info':
                return {
                    wrapper: 'bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 text-blue-700',
                    icon: 'bg-blue-100 text-blue-500',
                    progress: 'bg-blue-500'
                };
            default:
                return {
                    wrapper: 'bg-gradient-to-r from-gray-50 to-gray-100 border-l-4 border-gray-500 text-gray-700',
                    icon: 'bg-gray-100 text-gray-500',
                    progress: 'bg-gray-500'
                };
        }
    };

    if (!isVisible) return null;

    const styles = getAlertStyles();

    return (
        <div
            className={`animate-fade-in rounded-lg p-4 shadow-lg relative overflow-hidden ${styles.wrapper} ${className} backdrop-blur-sm`}
            role="alert"
            style={{ transform: 'translateZ(0)' }}
        >
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{message}</p>
                {onClose && (
                    <button
                        onClick={() => {
                            setIsVisible(false);
                            onClose();
                        }}
                        className="ml-4 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/30 text-gray-400 backdrop-blur-sm hover:bg-white/50 hover:text-gray-500 focus:outline-none transition-all"
                        aria-label="Close alert"
                    >
                        <X className="h-3 w-3" />
                    </button>
                )}
            </div>
            {duration && (
                <div className="absolute bottom-0 left-0 h-1 w-full bg-white/30">
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