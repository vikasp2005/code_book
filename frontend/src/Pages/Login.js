import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import PasswordValidator from "../Components/PasswordValidator";
import { login } from "../Api";

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({ email: false, password: false });

    const validateField = (name, value) => {
        switch (name) {
            case 'email':
                if (!value.trim()) return 'Email is required';
                if (!/\S+@\S+\.\S+/.test(value)) return 'Please enter a valid email';
                return '';
            case 'password':
                if (!value) return 'Password is required';
                if (value.length < 6) return 'Password must be at least 6 characters';
                return '';
            default:
                return '';
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (touched[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: validateField(name, value)
            }));
        }
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
        const newErrors = {
            email: validateField('email', formData.email),
            password: validateField('password', formData.password)
        };
        setErrors(newErrors);
        setTouched({ email: true, password: true });
        return !Object.values(newErrors).some(error => error);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await login(formData);
            setMessage({ type: 'success', text: 'Login successful!' });

            setTimeout(() => {
                navigate('/dashboard')
            }, 2000);




        }


        catch (err) {
            if (err === 'Email verification required') {
                setMessage({
                    type: 'error',
                    text: `${err}`
                })
                setTimeout(() => {
                    navigate('/verify-otp', {
                        state: {
                            email: formData.email,
                            source: 'login'
                        }
                    });
                }, 2000);


            }
            setMessage({
                type: 'error',
                text: err || 'Login failed. Please try again.'
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
                            {touched.email && errors.email && (
                                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                            )}
                        </div>

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
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                            {touched.password && errors.password && (
                                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                            )}
                        </div>
                        <PasswordValidator password={formData.password} className="mt-3" />
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
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-violet-500 to-pink-500 text-white py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                    >
                        {isLoading ? 'Loading...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;