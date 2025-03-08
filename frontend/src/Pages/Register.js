import React, { useState, useContext, useCallback } from 'react';
import { Check, X, Eye, EyeOff } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import PasswordValidator from '../Components/PasswordValidator';
import { registerUser } from '../Api';
import { AuthContext } from '../App';

const Register = () => {
    const navigate = useNavigate();
    const { showAlert, setIsLoading } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [passwordValidation, setPasswordValidation] = useState({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        specialChar: false
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear errors when typing
        setFormErrors(prev => ({
            ...prev,
            [name]: ''
        }));
    };

    // Memoize the handlePasswordValidation function to prevent unnecessary re-renders
    const handlePasswordValidation = useCallback((checks) => {
        setPasswordValidation(checks);
    }, []);

    const validateForm = () => {
        const errors = {};

        if (!formData.email) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Invalid email format';
        }

        if (!formData.password) {
            errors.password = 'Password is required';
        } else if (!Object.values(passwordValidation).every(check => check)) {
            errors.password = 'Password does not meet the requirements';
        }

        if (!formData.confirmPassword) {
            errors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (validateForm()) {
            setIsLoading(true);
            try {
                const response = await registerUser(formData);
                showAlert(response.status || 'success', response.message || 'Registration successful! Redirecting to verification...');
                setTimeout(() => {
                    navigate('/verify-otp', { state: { email: formData.email } });
                }, 2000);
            } catch (error) {
                if (error.response && error.response.data && error.response.data.errors) {
                    error.response.data.errors.forEach(err => {
                        showAlert(error.response?.data?.status || 'error', `${err.message}`);
                    });
                } else {
                    showAlert(error.response?.data?.status || 'error', error.response?.data?.message || 'Registration failed. Please try again');
                }
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 p-6">
            <div className="w-full max-w-md">
                <form onSubmit={handleSubmit} className="bg-white/90 p-8 rounded-2xl shadow-2xl space-y-6 transition-all duration-300 hover:scale-[1.02] group">
                    <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-pink-600 text-center mb-8">Create Account</h2>

                    <div className="space-y-2">
                        <label className="text-gray-700 font-medium block">Email</label>
                        <input
                            type="text"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-3 rounded-lg border ${formErrors.email ? 'border-red-500' : 'border-gray-300'
                                } focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all duration-300`}
                            placeholder="Enter your email"
                        />
                        {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-gray-700 font-medium block">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-3 rounded-lg border ${formErrors.password ? 'border-red-500' : 'border-gray-300'
                                    } focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all duration-300`}
                                placeholder="Create password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        {formErrors.password && <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>}

                        <PasswordValidator
                            password={formData.password}
                            className="mt-3"
                            onValidation={handlePasswordValidation}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-gray-700 font-medium block">Confirm Password</label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-3 rounded-lg border ${formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                                    } focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all duration-300`}
                                placeholder="Confirm password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                            {formData.password && formData.confirmPassword && (
                                <div className="absolute right-12 top-1/2 -translate-y-1/2">
                                    {formData.password === formData.confirmPassword ?
                                        <Check className="text-green-500 w-5 h-5" /> :
                                        <X className="text-red-500 w-5 h-5" />
                                    }
                                </div>
                            )}
                        </div>
                        {formErrors.confirmPassword && <p className="text-red-500 text-sm mt-1">{formErrors.confirmPassword}</p>}
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-violet-500 to-pink-500 text-white py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] mt-6"
                    >
                        Register
                    </button>

                    <div className="text-center text-gray-600">
                        Already have an account?{' '}
                        <Link to="/login" className="text-violet-600 hover:text-pink-600 font-medium">
                            Login here
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;