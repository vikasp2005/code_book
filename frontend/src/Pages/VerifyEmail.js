import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyEmail, resendOTP } from '../Api';
import { AuthContext } from '../App';

const VerifyEmail = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { showAlert, setIsLoading } = useContext(AuthContext);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [canResend, setCanResend] = useState(false);
    const [timer, setTimer] = useState(60);
    const [formError, setFormError] = useState('');
    const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

    useEffect(() => {
        if (!location.state?.email) {
            navigate(location.state?.source || '/register');
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
        } else if (value === '') {
            const newOtp = [...otp];
            newOtp[index] = '';
            setOtp(newOtp);
        }

        // Clear form error when typing
        if (formError) {
            setFormError('');
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace') {
            if (otp[index] === '' && index > 0) {
                inputRefs[index - 1].current.focus();
                const newOtp = [...otp];
                newOtp[index - 1] = '';
                setOtp(newOtp);
            } else if (otp[index] !== '') {
                const newOtp = [...otp];
                newOtp[index] = '';
                setOtp(newOtp);
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs[index - 1].current.focus();
        } else if (e.key === 'ArrowRight' && index < 5) {
            inputRefs[index + 1].current.focus();
        }
    };

    const validateOtp = () => {
        const isOtpComplete = otp.every(digit => digit !== '');
        if (!isOtpComplete) {
            setFormError('Please fill all the OTP fields');
            return false;
        }
        return true;
    };

    const handleResendOtp = async () => {
        if (!canResend) return;

        setIsLoading(true);
        try {
            const response = await resendOTP({ email: location.state.email });
            showAlert('success', 'OTP resent successfully');
            setCanResend(false);
            setTimer(60);
        } catch (error) {
            showAlert('error', error || 'Failed to resend OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateOtp()) {
            return;
        }

        setIsLoading(true);

        try {
            const response = await verifyEmail({
                email: location.state.email,
                otp: otp.join('')
            });

            showAlert('success', 'Email verified successfully! Redirecting...');

            setTimeout(() => {

                if (location.state?.source === 'login') {
                    navigate('/dashboard');
                } else {
                    navigate('/login');
                }
            }, 2000);

        } catch (error) {
            showAlert('error', error || 'Verification failed');
        } finally {
            setIsLoading(false);
        }
    };

    const displayEmail = (email) => {
        if (!email) return '';
        const [localPart, domain] = email.split('@');
        return `${localPart[0]}****${localPart[localPart.length - 1]}@${domain}`;
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 p-6">
            <div className="w-full max-w-md">
                <form onSubmit={handleSubmit} className="bg-white/90 p-8 rounded-2xl shadow-2xl space-y-6 transition-all duration-300 hover:scale-[1.02] group">
                    <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-pink-600 text-center mb-8">Verify Email</h2>

                    <p className="text-gray-600 text-center">
                        Enter the verification code sent to<br />
                        <span className="font-medium">{displayEmail(location.state?.email)}</span>
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
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                className="w-14 h-14 text-center text-2xl font-bold border-2 rounded-lg focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                            />
                        ))}
                    </div>

                    {formError && (
                        <p className="text-red-500 text-sm text-center mt-2">{formError}</p>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-violet-500 to-pink-500 text-white py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300"
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