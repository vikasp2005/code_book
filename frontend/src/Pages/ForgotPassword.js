import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPassword } from "../Api";

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [error, setError] = useState('');

    const validateEmail = (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) {
            setError('Email is required');
            return;
        }
        if (!validateEmail(email)) {
            setError('Please enter a valid email');
            return;
        }

        setIsLoading(true);
        setMessage({ type: '', text: '' });
        setError('');

        try {
            const response = await forgotPassword({ email });
            setMessage({ type: 'success', text: `${response.message}` });
            setTimeout(() => {
                navigate('/login')
            }, 2000);


        } catch (err) {
            setMessage({
                type: 'error',
                text: err || 'Failed to send reset email. Please try again.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 p-6">
            <div className="w-full max-w-md">
                {message.text && (
                    <div className={`mb-4 p-4 rounded-lg text-center text-white ${message.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                        }`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-2xl space-y-6">
                    <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-pink-600 text-center">
                        Forgot Password
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <input
                                type="email"
                                value={email}
                                onChange={e => {
                                    setEmail(e.target.value);
                                    setError('');
                                }}
                                placeholder="Enter your email"
                                className={`w-full px-4 py-3 rounded-lg border ${error ? 'border-red-500' : 'border-gray-300'
                                    } focus:border-violet-500 focus:ring-2 focus:ring-violet-200`}
                            />
                            {error && (
                                <p className="mt-1 text-sm text-red-500">{error}</p>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-violet-500 to-pink-500 text-white py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                    >
                        {isLoading ? 'Sending...' : 'Send Reset Link'}
                    </button>

                    <p className="text-center text-sm text-gray-600">
                        Remember your password?{' '}
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="text-violet-600 hover:text-violet-700 font-medium"
                        >
                            Login here
                        </button>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;