import axios from 'axios';

const API = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

export const login = async (data) => {
    try {

        const response = await API.post('/auth/login', data);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error.response?.data?.message || 'An error occurred';
    }
};

export const registerUser = async (data) => {
    try {
        const response = await API.post('/auth/register', data);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error.response?.data?.message || 'An error occurred';
    }
};

export const verifyEmail = async (data) => {
    try {
        const response = await API.post('/auth/verify-otp', data);
        return response.data;
    }
    catch (error) {
        console.log(error);
        throw error.response?.data?.message || 'An error occurred';
    }
}

export const resendOTP = async (data) => {
    try {
        const response = await API.post('/auth/resend-otp', data);
        return response.data;
    }
    catch (error) {
        console.log(error);
        throw error.response?.data?.message || 'An error occurred';
    }
}

export const forgotPassword = async (data) => {
    try {
        const response = await API.post('/auth/forgot-password', data);
        return response.data;
    }
    catch (error) {
        console.log(error);
        throw error.response?.data?.message || 'An error occurred';
    }
}

export const resetPassword = async (data, token) => {
    try {
        const response = await API.post(`/auth/reset-password/${token}`, data);
        return response.data;
    }
    catch (error) {
        console.log(error);
        throw error.response?.data?.message || 'An error occurred';
    }
}

export default API;
