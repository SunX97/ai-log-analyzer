const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDatabase } = require('../config/database');
const { logger } = require('../utils/logger');
const OTPService = require('../services/otpService');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * POST /api/auth/register
 * Register a new user (after OTP verification)
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, phoneNumber, password, confirmPassword } = req.body;

    // Basic validation
    if (!username || !email || !phoneNumber || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required (username, email, phone number, password, confirm password)'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Passwords do not match'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
    }

    const otpService = new OTPService();
    const formattedNumber = otpService.formatIndianMobile(phoneNumber);

    if (!otpService.validateIndianMobile(formattedNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid Indian mobile number'
      });
    }

    const db = getDatabase();

    // Check if user already exists
    const existingUser = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id FROM users WHERE username = ? OR email = ? OR phone_number = ?',
        [username, email, formattedNumber],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this username, email, or phone number already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (username, email, phone_number, password_hash, is_phone_verified) VALUES (?, ?, ?, ?, ?)',
        [username, email, formattedNumber, passwordHash, true],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, username, email, phoneNumber: formattedNumber });
        }
      );
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id, username: newUser.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    logger.info(`New user registered: ${username}`);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          phoneNumber: newUser.phoneNumber
        },
        token
      }
    });

  } catch (error) {
    logger.error('Error registering user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register user'
    });
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    const db = getDatabase();

    // Find user
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE username = ? OR email = ?',
        [username, username],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    logger.info(`User logged in: ${user.username}`);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        },
        token
      }
    });

  } catch (error) {
    logger.error('Error logging in user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to login'
    });
  }
});

/**
 * Middleware to verify JWT token
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    req.user = user;
    next();
  });
};

/**
 * GET /api/auth/profile
 * Get current user profile
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();

    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, username, email, created_at FROM users WHERE id = ?',
        [req.user.userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    logger.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
});

/**
 * POST /api/auth/send-otp
 * Send OTP to mobile number for registration verification
 */
router.post('/send-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }

    const otpService = new OTPService();
    const formattedNumber = otpService.formatIndianMobile(phoneNumber);

    if (!otpService.validateIndianMobile(formattedNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid Indian mobile number'
      });
    }

    const db = getDatabase();

    // Check if phone number is already registered
    const existingUser = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id FROM users WHERE phone_number = ?',
        [formattedNumber],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is already registered'
      });
    }

    // Generate OTP
    const otp = otpService.generateOTP();
    const otpExpiry = otpService.getOTPExpiry();

    // Store OTP temporarily (you might want to use Redis for this in production)
    // For now, we'll use a temporary table or in-memory storage
    global.tempOTPs = global.tempOTPs || new Map();
    global.tempOTPs.set(formattedNumber, {
      otp,
      expires: otpExpiry,
      purpose: 'registration'
    });

    // Send OTP
    await otpService.sendOTP(formattedNumber, otp);

    logger.info(`OTP sent for registration: ${formattedNumber}`);

    res.json({
      success: true,
      message: 'OTP sent to your mobile number'
    });

  } catch (error) {
    logger.error('Error sending OTP:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send OTP: ' + error.message
    });
  }
});

/**
 * POST /api/auth/verify-otp
 * Verify OTP for registration
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and OTP are required'
      });
    }

    const otpService = new OTPService();
    const formattedNumber = otpService.formatIndianMobile(phoneNumber);

    // Check stored OTP
    global.tempOTPs = global.tempOTPs || new Map();
    const storedOTPData = global.tempOTPs.get(formattedNumber);

    if (!storedOTPData) {
      return res.status(400).json({
        success: false,
        error: 'OTP not found or expired. Please request a new OTP.'
      });
    }

    if (otpService.isOTPExpired(storedOTPData.expires)) {
      global.tempOTPs.delete(formattedNumber);
      return res.status(400).json({
        success: false,
        error: 'OTP has expired. Please request a new OTP.'
      });
    }

    if (storedOTPData.otp !== otp) {
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP. Please check and try again.'
      });
    }

    // OTP is valid - remove from temporary storage
    global.tempOTPs.delete(formattedNumber);

    logger.info(`OTP verified successfully for: ${formattedNumber}`);

    res.json({
      success: true,
      message: 'Phone number verified successfully'
    });

  } catch (error) {
    logger.error('Error verifying OTP:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify OTP'
    });
  }
});

/**
 * POST /api/auth/forgot-password
 * Initiate forgot password process with mobile number
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }

    const otpService = new OTPService();
    const formattedNumber = otpService.formatIndianMobile(phoneNumber);

    if (!otpService.validateIndianMobile(formattedNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid Indian mobile number'
      });
    }

    const db = getDatabase();

    // Check if user exists with this phone number
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, username FROM users WHERE phone_number = ?',
        [formattedNumber],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'No account found with this phone number'
      });
    }

    // Generate OTP
    const otp = otpService.generateOTP();
    const otpExpiry = otpService.getOTPExpiry();

    // Store OTP for password reset
    global.tempOTPs = global.tempOTPs || new Map();
    global.tempOTPs.set(formattedNumber, {
      otp,
      expires: otpExpiry,
      purpose: 'forgot-password',
      userId: user.id
    });

    // Send OTP
    await otpService.sendOTP(formattedNumber, otp);

    logger.info(`Password reset OTP sent for: ${formattedNumber}`);

    res.json({
      success: true,
      message: 'OTP sent to your mobile number for password reset'
    });

  } catch (error) {
    logger.error('Error sending forgot password OTP:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send OTP: ' + error.message
    });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password using OTP verification
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { phoneNumber, otp, newPassword, confirmPassword } = req.body;

    if (!phoneNumber || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Passwords do not match'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
    }

    const otpService = new OTPService();
    const formattedNumber = otpService.formatIndianMobile(phoneNumber);

    // Verify OTP
    global.tempOTPs = global.tempOTPs || new Map();
    const storedOTPData = global.tempOTPs.get(formattedNumber);

    if (!storedOTPData || storedOTPData.purpose !== 'forgot-password') {
      return res.status(400).json({
        success: false,
        error: 'OTP not found or expired. Please request a new OTP.'
      });
    }

    if (otpService.isOTPExpired(storedOTPData.expires)) {
      global.tempOTPs.delete(formattedNumber);
      return res.status(400).json({
        success: false,
        error: 'OTP has expired. Please request a new OTP.'
      });
    }

    if (storedOTPData.otp !== otp) {
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP. Please check and try again.'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    const db = getDatabase();

    // Update password
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET password_hash = ? WHERE id = ?',
        [passwordHash, storedOTPData.userId],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Remove OTP from temporary storage
    global.tempOTPs.delete(formattedNumber);

    logger.info(`Password reset successful for user ID: ${storedOTPData.userId}`);

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    logger.error('Error resetting password:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset password'
    });
  }
});

module.exports = router;
module.exports.authenticateToken = authenticateToken;
