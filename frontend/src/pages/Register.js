import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  Container,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Paper,
  InputAdornment
} from '@mui/material';
import { Analytics, Phone, Sms } from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/api';

const Register = () => {
  const navigate = useNavigate();
  const { register, loading, error, clearError } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [otp, setOtp] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const steps = ['Enter Details', 'Verify Phone', 'Complete Registration'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    if (error) {
      clearError();
    }
  };

  const handleOtpChange = (e) => {
    setOtp(e.target.value);
    if (otpError) {
      setOtpError('');
    }
  };

  const validatePhoneNumber = (phoneNumber) => {
    const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
    const indianMobileRegex = /^(\+91|91)?[6-9]\d{9}$/;
    return indianMobileRegex.test(cleanNumber);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email format is invalid';
    }
    
    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required';
    } else if (!validatePhoneNumber(formData.phoneNumber)) {
      errors.phoneNumber = 'Please enter a valid Indian mobile number';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSendOTP = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setOtpLoading(true);
      setOtpError('');
      
      await authService.sendOTP(formData.phoneNumber);
      setOtpSent(true);
      setActiveStep(1);
    } catch (error) {
      setOtpError(error.response?.data?.error || 'Failed to send OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6) {
      setOtpError('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setOtpLoading(true);
      setOtpError('');
      
      await authService.verifyOTP(formData.phoneNumber, otp);
      setActiveStep(2);
      
      // Automatically proceed with registration
      const result = await register(
        formData.username, 
        formData.email, 
        formData.phoneNumber,
        formData.password, 
        formData.confirmPassword
      );
      
      if (result.success) {
        navigate('/');
      }
    } catch (error) {
      setOtpError(error.response?.data?.error || 'Invalid OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (activeStep === 0) {
      handleSendOTP();
    } else if (activeStep === 1) {
      handleVerifyOTP();
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="80vh"
      >
        <Card sx={{ width: '100%', maxWidth: 400 }}>
          <CardContent sx={{ p: 4 }}>
            <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
              <Analytics sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h4" component="h1" gutterBottom>
                Sign Up
              </Typography>
              <Typography variant="body2" color="textSecondary" textAlign="center">
                Create your account to start analyzing logs
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            <Box component="form" onSubmit={handleSubmit}>
              {activeStep === 0 && (
                <>
                  <TextField
                    fullWidth
                    label="Username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    error={!!formErrors.username}
                    helperText={formErrors.username}
                    margin="normal"
                    autoComplete="username"
                    autoFocus
                  />

                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={!!formErrors.email}
                    helperText={formErrors.email}
                    margin="normal"
                    autoComplete="email"
                  />

                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    error={!!formErrors.phoneNumber}
                    helperText={formErrors.phoneNumber || 'Enter Indian mobile number (e.g., +91XXXXXXXXXX)'}
                    margin="normal"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Phone />
                        </InputAdornment>
                      ),
                    }}
                    placeholder="+91XXXXXXXXXX"
                  />

                  <TextField
                    fullWidth
                    label="Password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    error={!!formErrors.password}
                    helperText={formErrors.password}
                    margin="normal"
                    autoComplete="new-password"
                  />

                  <TextField
                    fullWidth
                    label="Confirm Password"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    error={!!formErrors.confirmPassword}
                    helperText={formErrors.confirmPassword}
                    margin="normal"
                    autoComplete="new-password"
                  />
                </>
              )}

              {activeStep === 1 && (
                <>
                  <Alert severity="info" sx={{ mb: 3 }}>
                    OTP has been sent to {formData.phoneNumber}. Please enter the 6-digit code below.
                  </Alert>
                  
                  {otpError && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                      {otpError}
                    </Alert>
                  )}

                  <TextField
                    fullWidth
                    label="Enter OTP"
                    value={otp}
                    onChange={handleOtpChange}
                    margin="normal"
                    inputProps={{ maxLength: 6 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Sms />
                        </InputAdornment>
                      ),
                    }}
                    placeholder="Enter 6-digit OTP"
                    autoFocus
                  />

                  <Box display="flex" justifyContent="space-between" mt={2}>
                    <Button
                      variant="outlined"
                      onClick={() => setActiveStep(0)}
                      disabled={otpLoading}
                    >
                      Back
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleSendOTP}
                      disabled={otpLoading}
                    >
                      Resend OTP
                    </Button>
                  </Box>
                </>
              )}

              {activeStep === 2 && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  Registration completed successfully! Redirecting to dashboard...
                </Alert>
              )}

              {activeStep < 2 && (
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading || otpLoading}
                  sx={{ mt: 3, mb: 2 }}
                >
                  {(loading || otpLoading) ? (
                    <Box display="flex" alignItems="center" gap={1}>
                      <CircularProgress size={20} />
                      {activeStep === 0 ? 'Sending OTP...' : 'Verifying...'}
                    </Box>
                  ) : (
                    activeStep === 0 ? 'Send OTP' : 'Verify & Register'
                  )}
                </Button>
              )}

              <Box textAlign="center">
                <Typography variant="body2">
                  Already have an account?{' '}
                  <Link component={RouterLink} to="/login" underline="hover">
                    Sign in
                  </Link>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default Register;
