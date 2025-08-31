const { logger } = require('../utils/logger');

class OTPService {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
  }

  /**
   * Generate a 6-digit OTP
   */
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Validate Indian mobile number format
   */
  validateIndianMobile(phoneNumber) {
    // Remove any spaces, dashes, or special characters
    const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
    
    // Indian mobile number patterns:
    // +91XXXXXXXXXX (13 digits with country code)
    // 91XXXXXXXXXX (12 digits with country code)
    // XXXXXXXXXX (10 digits without country code)
    const indianMobileRegex = /^(\+91|91)?[6-9]\d{9}$/;
    
    return indianMobileRegex.test(cleanNumber);
  }

  /**
   * Format phone number to standard Indian format
   */
  formatIndianMobile(phoneNumber) {
    let cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
    
    // If it starts with +91, keep as is
    if (cleanNumber.startsWith('+91')) {
      return cleanNumber;
    }
    
    // If it starts with 91, add +
    if (cleanNumber.startsWith('91') && cleanNumber.length === 12) {
      return '+' + cleanNumber;
    }
    
    // If it's 10 digits, add +91
    if (cleanNumber.length === 10) {
      return '+91' + cleanNumber;
    }
    
    return cleanNumber;
  }

  /**
   * Send OTP via SMS
   * In development: logs to console
   * In production: integrate with real SMS service (Twilio, AWS SNS, etc.)
   */
  async sendOTP(phoneNumber, otp) {
    try {
      const formattedNumber = this.formatIndianMobile(phoneNumber);
      
      if (!this.validateIndianMobile(formattedNumber)) {
        throw new Error('Invalid Indian mobile number format');
      }

      // Check if SMS service is configured
      if (process.env.FAST2SMS_API_KEY || process.env.TWILIO_AUTH_TOKEN || process.env.AWS_ACCESS_KEY_ID) {
        // Production mode - send actual SMS
        return await this.sendSMSProduction(formattedNumber, otp);
      } else {
        // Development mode - log OTP to console
        logger.info(`[DEV MODE] OTP for ${formattedNumber}: ${otp}`);
        console.log(`\n🔐 OTP for ${formattedNumber}: ${otp}\n`);
        console.log('💡 To enable real SMS, configure an SMS service (see README for instructions)');
        return { success: true, message: 'OTP sent (development mode - check console)' };
      }
    } catch (error) {
      logger.error('Error sending OTP:', error);
      throw error;
    }
  }

  /**
   * Production SMS sending (integrate with your preferred SMS service)
   */
  async sendSMSProduction(phoneNumber, otp) {
    const smsMessage = `Your AI Log Analyzer OTP is: ${otp}. Valid for 5 minutes. Do not share this code.`;
    
    try {
      // Option 1: Fast2SMS (Popular and affordable in India)
      if (process.env.FAST2SMS_API_KEY) {
        return await this.sendViaFast2SMS(phoneNumber, otp);
      }
      
      // Option 2: Twilio (Global, reliable)
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        return await this.sendViaTwilio(phoneNumber, smsMessage);
      }
      
      // Option 3: AWS SNS (If using AWS infrastructure)
      if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
        return await this.sendViaAWSSNS(phoneNumber, smsMessage);
      }
      
      throw new Error('No SMS service configured. Please set up Fast2SMS, Twilio, or AWS SNS.');
    } catch (error) {
      logger.error('Error sending SMS via production service:', error);
      throw error;
    }
  }
  
  /**
   * Send SMS via Fast2SMS (Popular in India)
   */
  async sendViaFast2SMS(phoneNumber, otp) {
    const axios = require('axios');
    
    try {
      const cleanNumber = phoneNumber.replace('+91', '').replace(/\D/g, '');
      
      const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
        authorization: process.env.FAST2SMS_API_KEY,
        route: 'otp',
        variables_values: otp,
        flash: 0,
        numbers: cleanNumber
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.return === true) {
        logger.info(`SMS sent successfully via Fast2SMS to ${phoneNumber}`);
        return { success: true, message: 'OTP sent via Fast2SMS' };
      } else {
        throw new Error(response.data?.message || 'Fast2SMS API error');
      }
    } catch (error) {
      logger.error('Fast2SMS error:', error.response?.data || error.message);
      throw new Error(`Fast2SMS error: ${error.response?.data?.message || error.message}`);
    }
  }
  
  /**
   * Send SMS via Twilio
   */
  async sendViaTwilio(phoneNumber, message) {
    try {
      const twilio = require('twilio');
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      
      const result = await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });
      
      logger.info(`SMS sent successfully via Twilio to ${phoneNumber}, SID: ${result.sid}`);
      return { success: true, message: 'OTP sent via Twilio' };
    } catch (error) {
      logger.error('Twilio error:', error);
      throw new Error(`Twilio error: ${error.message}`);
    }
  }
  
  /**
   * Send SMS via AWS SNS
   */
  async sendViaAWSSNS(phoneNumber, message) {
    try {
      const AWS = require('aws-sdk');
      const sns = new AWS.SNS({ 
        region: process.env.AWS_REGION || 'us-east-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      });
      
      const params = {
        Message: message,
        PhoneNumber: phoneNumber,
        MessageAttributes: {
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: 'Transactional'
          }
        }
      };
      
      const result = await sns.publish(params).promise();
      logger.info(`SMS sent successfully via AWS SNS to ${phoneNumber}, MessageId: ${result.MessageId}`);
      return { success: true, message: 'OTP sent via AWS SNS' };
    } catch (error) {
      logger.error('AWS SNS error:', error);
      throw new Error(`AWS SNS error: ${error.message}`);
    }
  }

  /**
   * Generate OTP expiry time (5 minutes from now)
   */
  getOTPExpiry() {
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 5);
    return expiry.toISOString();
  }

  /**
   * Check if OTP is expired
   */
  isOTPExpired(expiryTime) {
    return new Date() > new Date(expiryTime);
  }
}

module.exports = OTPService;
