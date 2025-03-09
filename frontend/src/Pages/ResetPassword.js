import React, { useState, useContext, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Eye, EyeOff, Check, X } from "lucide-react";
import PasswordValidator from "../Components/PasswordValidator";
import { resetPassword } from "../Api";
import { AuthContext } from "../App";

const ResetPassword = () => {
    const navigate = useNavigate();
    const { token } = useParams();
    const { showAlert, setIsLoading } = useContext(AuthContext);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [passwordValidation, setPasswordValidation] = useState({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        specialChar: false
    });

    const validateField = (name, value) => {
        switch (name) {
            case 'password':
                if (!value) return 'Password is required';
                else if (!Object.values(passwordValidation).every(check => check)) {
                    return 'Password does not meet the requirements';
                }
                return '';
            case 'confirmPassword':
                if (!value) return 'Please confirm your password';
                else if (value !== password) return 'Passwords do not match';
                return '';
            default:
                return '';
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'password') {
            setPassword(value);
        } else if (name === 'confirmPassword') {
            setConfirmPassword(value);
        }

        // Clear errors when typing
        setErrors(prev => ({
            ...prev,
            [name]: ''
        }));
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        setErrors(prev => ({
            ...prev,
            [name]: validateField(name, value)
        }));
    };

    const validateForm = () => {
        const newErrors = {
            password: validateField('password', password),
            confirmPassword: validateField('confirmPassword', confirmPassword)
        };
        setErrors(newErrors);
        return !Object.values(newErrors).some(error => error);
    };

    // Memoize the handlePasswordValidation function to prevent unnecessary re-renders
    const handlePasswordValidation = useCallback((checks) => {
        setPasswordValidation(checks);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsLoading(true);

        try {
            const response = await resetPassword({ password, confirmPassword }, token);
            showAlert('success', response.message || 'Password reset successfully!');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            showAlert('error', err || 'Password reset failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 p-6">
            <div className="w-full max-w-md">
                <form onSubmit={handleSubmit} className="bg-white/90 p-8 rounded-2xl shadow-2xl space-y-6 transition-all duration-300 hover:scale-[1.02] group">
                    <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-pink-600 text-center">Reset Password</h2>

                    <div className="space-y-4">
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={password}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                placeholder="New Password"
                                className={`w-full px-4 py-3 rounded-lg border ${errors.password ? 'border-red-500' : 'border-gray-300'
                                    } focus:border-violet-500 focus:ring-2 focus:ring-violet-200`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>

                        </div>
                        {errors.password && (
                            <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                        )}
                        <PasswordValidator
                            password={password}
                            className="mt-3"
                            onValidation={handlePasswordValidation}
                        />

                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                name="confirmPassword"
                                value={confirmPassword}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                placeholder="Confirm New Password"
                                className={`w-full px-4 py-3 rounded-lg border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                                    } focus:border-violet-500 focus:ring-2 focus:ring-violet-200`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                            {password && confirmPassword && (
                                <div className="absolute right-12 top-1/2 -translate-y-1/2">
                                    {password === confirmPassword ?
                                        <Check className="text-green-500 w-5 h-5" /> :
                                        <X className="text-red-500 w-5 h-5" />
                                    }
                                </div>
                            )}

                        </div>
                        {errors.confirmPassword && (
                            <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-violet-500 to-pink-500 text-white py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                        Reset Password
                    </button>
                </form>
            </div >
        </div >
    );
};

export default ResetPassword;