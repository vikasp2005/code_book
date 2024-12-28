import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyEmail, resendOTP } from '../Api';


const VerifyEmail = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [canResend, setCanResend] = useState(false);
    const [timer, setTimer] = useState(60);
    const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

    useEffect(() => {
        if (!location.state?.email) {
            navigate('/register');
            return;
        }

        let interval;
        if (timer > 0 && !canResend) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else if (timer === 0) {
            setCanResend(true);
        }

        return () => clearInterval(interval);
    }, [timer, canResend]);

    const handleOtpChange = (index, value) => {
        if (value.match(/^[0-9]$/)) {
            const newOtp = [...otp];
            newOtp[index] = value;
            setOtp(newOtp);

            if (index < 5 && value !== '') {
                inputRefs[index + 1].current.focus();
            }
        }
        else if (value === '') {
            const newOtp = [...otp];
            newOtp[index] = '';
            setOtp(newOtp);
            if (index > 0) {
                inputRefs[index - 1].current.focus();
            }
        }
    };

    const handleResendOtp = async () => {
        if (!canResend) return;

        setIsLoading(true);
        try {
            const response = await resendOTP({ email: location.state.email });
            setMessage('OTP resent successfully');
            setCanResend(false);
            setTimer(60);
        } catch (error) {
            setMessage(error || 'Failed to resend OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await verifyEmail({
                email: location.state.email,
                otp: otp.join('')
            });
            setMessage('Email verified successfully! Redirecting...');
            setTimeout(() => navigate('/login'), 2000);

        } catch (error) {
            setMessage(error || 'Verification failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 p-6">
            {isLoading && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
                </div>
            )}

            <div className="w-full max-w-md">
                <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-2xl space-y-6">
                    <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-pink-600 text-center mb-8">Verify Email</h2>

                    <p className="text-gray-600 text-center">
                        Enter the verification code sent to<br />
                        <span className="font-medium">{location.state?.email}</span>
                    </p>

                    <div className="flex justify-center gap-4">
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                ref={inputRefs[index]}
                                type="text"
                                maxLength="1"
                                value={digit}
                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                className="w-14 h-14 text-center text-2xl font-bold border-2 rounded-lg focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                            />
                        ))}
                    </div>

                    {message && (
                        <div className={`text-center py-2 font-medium ${message.includes('success') ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-violet-500 to-pink-500 text-white py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Verify Email
                    </button>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={handleResendOtp}
                            className={`text-violet-600 hover:text-violet-700 transition-colors ${!canResend ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                            disabled={!canResend}
                        >
                            {canResend ? 'Resend OTP' : `Resend OTP in ${timer}s`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VerifyEmail;