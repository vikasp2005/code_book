import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPassword } from "../Api";
import { AuthContext } from "../App";

const ForgotPassword = () => {
    const navigate = useNavigate();
    const { showAlert, setIsLoading } = useContext(AuthContext);
    const [email, setEmail] = useState('');
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
        setError('');

        try {
            const response = await forgotPassword({ email });
            showAlert('success', response.message || 'Reset link sent successfully!');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            showAlert('error', err || 'Failed to send reset email. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 p-6">
            <div className="w-full max-w-md">
                <form onSubmit={handleSubmit} className="bg-white/90 p-8 rounded-2xl shadow-2xl space-y-6 transition-all duration-300 hover:scale-[1.02] group">
                    <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-pink-600 text-center">
                        Forgot Password
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <input
                                type="text"
                                value={email}
                                onChange={e => {
                                    setEmail(e.target.value);
                                    setError('');
                                }}
                                placeholder="Enter your email"
                                className={`w-full px-4 py-3 rounded-lg border ${error ? 'border-red-500' : 'border-gray-300'
                                    } focus:border-violet-500 focus:ring-2 focus:ring-violet-200`}
                            />

                        </div>
                        {error && (
                            <p className="text-red-500 text-sm mt-1">{error}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-violet-500 to-pink-500 text-white py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                        Send Reset Link
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