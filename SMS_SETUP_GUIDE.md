# SMS Setup Guide - Enable Real OTP Delivery

Currently, your AI Log Analyzer is in **development mode** and only shows OTPs in the server console. To enable real SMS delivery to mobile phones, you need to configure one of the supported SMS services.

## Current Status
- ✅ OTP generation working
- ✅ Phone number validation working  
- ✅ OTP verification working
- 🟨 SMS delivery: Development mode (console only)
- 🎯 **Goal**: Enable real SMS delivery to phones

## Option 1: Fast2SMS (Recommended for India)

**Best for**: Indian users, affordable, easy setup

### Setup Steps:
1. Go to [Fast2SMS.com](https://www.fast2sms.com/)
2. Create an account and verify your phone number
3. Get API key from your dashboard
4. Add credits to your account (starts from ₹10)

### Configuration:
Create a `.env` file in the `backend` folder with:
```bash
FAST2SMS_API_KEY=your_api_key_here
```

### Pricing:
- ₹0.15 per SMS (approximately)
- No setup fees
- Pay as you use

---

## Option 2: Twilio (Global)

**Best for**: International users, most reliable

### Setup Steps:
1. Go to [Twilio.com](https://www.twilio.com/)
2. Create account and verify your phone number
3. Get a Twilio phone number
4. Get Account SID and Auth Token

### Configuration:
Add to `.env` file in `backend` folder:
```bash
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

### Pricing:
- $0.0075 per SMS (approximately ₹0.60)
- Phone number rental: $1/month
- More expensive but very reliable

---

## Option 3: AWS SNS

**Best for**: If you're already using AWS infrastructure

### Setup Steps:
1. Go to AWS Console → SNS
2. Set up SMS preferences
3. Get your AWS access keys

### Configuration:
Add to `.env` file in `backend` folder:
```bash
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
```

### Pricing:
- $0.00645 per SMS (approximately ₹0.50)
- Pay per use
- Requires AWS account

---

## Quick Setup with Fast2SMS (Recommended)

1. **Sign up**: Go to [Fast2SMS.com](https://www.fast2sms.com/) and create account
2. **Verify**: Verify your phone number
3. **Get API Key**: Go to Developer API → Copy your API key
4. **Add Credits**: Add minimum ₹10 credits
5. **Configure**: Create `backend/.env` file:
   ```bash
   FAST2SMS_API_KEY=your_actual_api_key_here
   ```
6. **Restart**: Restart your server
7. **Test**: Try registration with a real phone number

## Testing

After setting up any SMS service:

1. Restart your backend server
2. Go to registration page
3. Enter real Indian mobile number
4. You should receive actual SMS on your phone
5. Server logs will show: "SMS sent successfully via [Service Name]"

## Troubleshooting

### Still seeing console OTPs?
- Check `.env` file exists in `backend` folder
- Verify API key is correct
- Restart the server completely

### Fast2SMS errors?
- Ensure you have credits in your account
- Check API key is valid
- Verify phone number format (+91XXXXXXXXXX)

### Twilio errors?
- Verify all three environment variables are set
- Check phone number includes country code
- Ensure Twilio phone number is verified

## Development vs Production

- **Development**: OTPs shown in console (current setup)
- **Production**: OTPs sent via SMS to actual phones

The system automatically detects when SMS credentials are configured and switches to production mode.

## Cost Comparison

| Service | Cost per SMS | Setup Fee | Best For |
|---------|--------------|-----------|----------|
| Fast2SMS | ₹0.15 | None | Indian numbers |
| Twilio | ₹0.60 | ₹80/month | Global, reliable |
| AWS SNS | ₹0.50 | None | AWS users |

## Support

If you need help setting up SMS delivery:
1. Check the server console for error messages
2. Verify your API credentials
3. Test with a different phone number
4. Check your SMS service dashboard for delivery logs

---

**Next Steps**: Choose your preferred SMS service, follow the setup steps, and enjoy real OTP delivery to your phone! 🎉
