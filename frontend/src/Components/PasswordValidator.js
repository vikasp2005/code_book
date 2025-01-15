import React from 'react';
import { Check, X } from 'lucide-react';

const PasswordValidator = ({ password, className = '' }) => {
    const checks = {
        length: password.length >= 8 && password.length <= 16,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const requirements = [
        { key: 'length', label: '8-16 characters' },
        { key: 'uppercase', label: 'One uppercase letter' },
        { key: 'lowercase', label: 'One lowercase letter' },
        { key: 'number', label: 'One number' },
        { key: 'specialChar', label: 'One special character' }
    ];

    return (
        <div className={`space-y-2 ${className}`}>
            {requirements.map(({ key, label }) => (
                <div key={key} className="flex items-center text-sm text-gray-600">
                    {checks[key] ? (
                        <Check className="text-green-500 w-4 h-4 mr-2" />
                    ) : (
                        <X className="text-red-500 w-4 h-4 mr-2" />
                    )}
                    <span>{label}</span>
                </div>
            ))}
        </div>
    );
};

export default PasswordValidator;