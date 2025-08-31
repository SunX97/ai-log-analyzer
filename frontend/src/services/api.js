import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  login: (username, password) => 
    api.post('/auth/login', { username, password }),
  
  register: (username, email, phoneNumber, password, confirmPassword) => 
    api.post('/auth/register', { username, email, phoneNumber, password, confirmPassword }),
  
  sendOTP: (phoneNumber) => 
    api.post('/auth/send-otp', { phoneNumber }),
  
  verifyOTP: (phoneNumber, otp) => 
    api.post('/auth/verify-otp', { phoneNumber, otp }),
  
  forgotPassword: (phoneNumber) => 
    api.post('/auth/forgot-password', { phoneNumber }),
  
  resetPassword: (phoneNumber, otp, newPassword, confirmPassword) => 
    api.post('/auth/reset-password', { phoneNumber, otp, newPassword, confirmPassword }),
  
  getProfile: () => 
    api.get('/auth/profile'),
};

// Log services
export const logService = {
  uploadFile: (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('logFile', file);
    
    return api.post('/logs/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
  },

  getLogFiles: () => 
    api.get('/logs'),

  getLogFile: (id) => 
    api.get(`/logs/${id}`),

  deleteLogFile: (id) => 
    api.delete(`/logs/${id}`),
};

// Analysis services
export const analysisService = {
  getDashboardData: () => 
    api.get('/analysis/dashboard'),

  getTrends: () => 
    api.get('/analysis/trends'),

  compareFiles: (fileIds) => 
    api.post('/analysis/compare', { fileIds }),

  reanalyzeFile: (id) => 
    api.post(`/analysis/reanalyze/${id}`),
};

// Health check
export const healthService = {
  checkHealth: () => 
    api.get('/health'),
};

export default api;
