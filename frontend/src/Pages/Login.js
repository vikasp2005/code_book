import React, { useState, useContext, useCallback } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import PasswordValidator from "../Components/PasswordValidator";
import { login } from "../Api";
import { AuthContext } from "../App";

const Login = ({ onLoginSuccess }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { showAlert, setIsLoading } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({ email: false, password: false });
    const [passwordValidation, setPasswordValidation] = useState({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        specialChar: false
    });

    const validateField = (name, value) => {
        switch (name) {
            case 'email':
                if (!value.trim()) return 'Email is required';
                if (!/\S+@\S+\.\S+/.test(value)) return 'Please enter a valid email';
                return '';
            case 'password':
                if (!value) return 'Password is required';
                if (!Object.values(passwordValidation).every(check => check)) {
                    errors.password = 'Password does not meet the requirements';
                }
                return '';
            default:
                return '';
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Validate the field in real-time
        setErrors(prev => ({
            ...prev,
            [name]: validateField(name, value)
        }));
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        setErrors(prev => ({
            ...prev,
            [name]: validateField(name, value)
        }));
    };

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

        setErrors(errors);
        setTouched({ email: true, password: true });
        return Object.keys(errors).length === 0;
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
            const response = await login(formData);
            showAlert('success', 'Login successful!');
            setTimeout(() => {
                onLoginSuccess(); // Refresh authentication state
                const redirectTo = location.state?.from && location.state?.from !== '/' ? location.state?.from : '/'; // Redirect to "from" or "/"
                navigate(redirectTo, { replace: true, state: { showSaveDialog: location.state?.showSaveDialog, ClearEditor: location.state?.ClearEditor } });

            }, 1500);
        } catch (err) {
            if (err === 'Email verification required') {
                showAlert('error', `${err}`);
                setTimeout(() => {
                    onLoginSuccess();
                    navigate('/verify-otp', {
                        state: {
                            email: formData.email,
                            source: 'login'
                        }
                    });
                }, 2000);
            } else {
                showAlert('error', err || 'Login failed. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 p-6">
            <div className="w-full max-w-md">
                <form onSubmit={handleSubmit} className="bg-white/90 p-8 rounded-2xl shadow-2xl space-y-6 transition-all duration-300 hover:scale-[1.02] group">
                    <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-pink-600 text-center">Login</h2>

                    <div className="space-y-4">
                        <div>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                placeholder="Email"
                                className={`w-full px-4 py-3 rounded-lg border ${touched.email && errors.email ? 'border-red-500' : 'border-gray-300'
                                    } focus:border-violet-500 focus:ring-2 focus:ring-violet-200`}
                            />
                        </div>
                        {touched.email && errors.email && (
                            <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                        )}

                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                placeholder="Password"
                                className={`w-full px-4 py-3 rounded-lg border ${touched.password && errors.password ? 'border-red-500' : 'border-gray-300'
                                    } focus:border-violet-500 focus:ring-2 focus:ring-violet-200`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-4 text-gray-500 hover:text-gray-700" // Adjusted top position
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        {touched.password && errors.password && (
                            <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                        )}
                        <PasswordValidator
                            password={formData.password}
                            className="mt-3"
                            onValidation={handlePasswordValidation}
                        />
                    </div>

                    <div className="flex justify-between text-sm">
                        <Link to="/register" className="text-violet-600 hover:text-violet-700">
                            Create account
                        </Link>
                        <Link to="/forgot-password" className="text-violet-600 hover:text-violet-700">
                            Forgot password?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-violet-500 to-pink-500 text-white py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;