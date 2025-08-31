# AI Log Analyzer

An intelligent log analysis system powered by AI that provides comprehensive insights, pattern recognition, and anomaly detection for your application logs.

## 🚀 Features

### AI-Powered Analysis
- **Intelligent Pattern Recognition**: Automatically detects recurring error patterns and issues
- **Anomaly Detection**: Identifies unusual spikes, silence periods, and abnormal behavior
- **Natural Language Processing**: Analyzes log messages for sentiment and categorization
- **Performance Insights**: Extracts response times and performance metrics

### Advanced Visualizations
- **Interactive Timeline Charts**: Visualize log activity over time
- **Error Distribution Analysis**: Pie charts and bar graphs for log level distribution
- **Trend Analysis**: Cross-file pattern and anomaly trending
- **Real-time Dashboard**: Live statistics and recent activity monitoring

### Smart Features
- **Drag & Drop Upload**: Easy file upload with support for multiple log formats
- **Real-time Processing**: Instant analysis results with progress tracking
- **Comparative Analysis**: Compare analysis results across multiple log files
- **Export Capabilities**: Download analysis reports and insights

### Enhanced Authentication & Security
- **Multi-Step Registration**: Username, email, phone number with OTP verification
- **OTP-Based Authentication**: SMS OTP verification for Indian mobile numbers
- **Forgot Password Recovery**: Mobile number-based password reset with OTP
- **Phone Number Validation**: Automatic Indian mobile number formatting (+91XXXXXXXXXX)
- **JWT Authentication**: Secure token-based authentication and session management
- **Multiple SMS Providers**: Fast2SMS, Twilio, and AWS SNS integration
- **File Upload Security**: Type and size validation with secure file handling
- **Rate Limiting**: API protection against abuse
- **Optimized Performance**: Efficient processing of large log files

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js framework
- **SQLite** database for development (easily replaceable with PostgreSQL/MySQL)
- **Natural.js** for NLP and text analysis
- **Winston** for structured logging
- **Multer** for file upload handling
- **JWT** for authentication

### Frontend
- **React 18** with modern hooks and functional components
- **Material-UI (MUI)** for professional UI components
- **Recharts** for interactive data visualizations
- **React Query** for efficient data fetching and caching
- **React Router** for client-side routing

### DevOps & Deployment
- **Docker** containerization with multi-stage builds
- **Docker Compose** for orchestrated deployment
- **Nginx** reverse proxy configuration
- **Health checks** and monitoring

## 📋 Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for containerized deployment)
- Modern web browser with JavaScript enabled

## 🚀 Quick Start

### Option 1: Local Development

1. **Clone and setup the project:**
   ```bash
   git clone <repository-url>
   cd ai-log-analyzer
   npm run install:all
   ```

2. **Set up environment variables:**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the development servers:**
   ```bash
   cd ..
   npm run dev
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

### Option 2: Docker Deployment

1. **Production deployment:**
   ```bash
   docker-compose --profile prod up -d
   ```

2. **Development with Docker:**
   ```bash
   docker-compose --profile dev up -d
   ```

## 📁 Project Structure

```
ai-log-analyzer/
├── backend/                 # Node.js API server
│   ├── config/             # Database and app configuration
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Express middleware
│   ├── models/            # Data models
│   ├── routes/            # API routes
│   ├── services/          # Business logic (AI analysis)
│   ├── utils/             # Utility functions
│   └── uploads/           # Uploaded log files
├── frontend/              # React application
│   ├── public/           # Static assets
│   └── src/
│       ├── components/   # Reusable UI components
│       ├── pages/        # Page components
│       ├── services/     # API communication
│       ├── contexts/     # React contexts
│       └── utils/        # Utility functions
├── shared/               # Shared utilities and types
├── docs/                # Documentation
└── docker-compose.yml   # Container orchestration
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Enhanced user registration with phone number
- `POST /api/auth/login` - User login with username/email
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/send-otp` - Send OTP to mobile number
- `POST /api/auth/verify-otp` - Verify OTP code
- `POST /api/auth/forgot-password` - Initiate password reset with mobile
- `POST /api/auth/reset-password` - Complete password reset with OTP

### Log Management
- `POST /api/logs/upload` - Upload and analyze log file
- `GET /api/logs` - Get list of uploaded files
- `GET /api/logs/:id` - Get specific file analysis
- `DELETE /api/logs/:id` - Delete log file

### Analysis
- `GET /api/analysis/dashboard` - Dashboard statistics
- `GET /api/analysis/trends` - Cross-file trends
- `POST /api/analysis/compare` - Compare multiple files
- `POST /api/analysis/reanalyze/:id` - Re-analyze file

## 🧠 AI Analysis Features

### Pattern Recognition
- Identifies recurring error messages
- Detects time-based patterns and spikes
- Groups similar issues automatically
- Frequency analysis of log events

### Anomaly Detection
- **Error Spikes**: Unusual increases in error rates
- **Silence Periods**: Gaps in logging activity
- **Performance Anomalies**: Response time outliers
- **Message Repetition**: Excessive duplicate messages

### Performance Analysis
- Response time distribution and percentiles
- Throughput analysis
- Slow request identification
- System performance trends

### Smart Insights
- Automated recommendations
- Error rate assessments
- System health scoring
- Actionable suggestions

## 📊 Supported Log Formats

The AI Log Analyzer supports various log formats including:

- **Standard Application Logs**: Timestamp + Level + Message format
- **Web Server Logs**: Apache, Nginx access and error logs
- **System Logs**: Syslog, journald output
- **Custom Application Logs**: JSON, CSV, and custom formats
- **Container Logs**: Docker and Kubernetes log output

## 🔒 Security Features

- **JWT-based Authentication**: Secure token-based auth
- **Input Validation**: Comprehensive input sanitization
- **File Upload Security**: Type and size validation
- **Rate Limiting**: API abuse protection
- **Security Headers**: Helmet.js security middleware
- **SQL Injection Protection**: Parameterized queries

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Docker Deployment
```bash
# Production
docker-compose --profile prod up -d

# Development
docker-compose --profile dev up -d
```

### Environment Variables

#### Backend (.env)
```env
# Server Configuration
PORT=3001
NODE_ENV=production
FRONTEND_URL=http://localhost:3000
DB_PATH=./database.sqlite

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
LOG_LEVEL=info

# SMS Services (Choose one for OTP functionality)
# Option 1: Fast2SMS (Recommended for India - ₹0.15/SMS)
FAST2SMS_API_KEY=your_fast2sms_api_key

# Option 2: Twilio (Global - $0.0075/SMS)
# TWILIO_ACCOUNT_SID=your_twilio_account_sid
# TWILIO_AUTH_TOKEN=your_twilio_auth_token
# TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Option 3: AWS SNS (AWS Infrastructure - $0.00645/SMS)
# AWS_ACCESS_KEY_ID=your_aws_access_key
# AWS_SECRET_ACCESS_KEY=your_aws_secret_key
# AWS_REGION=us-east-1
```

#### Frontend
```env
REACT_APP_API_URL=http://localhost:3001/api
```

## 📱 Enhanced Authentication System

### Multi-Step Registration Process

1. **Step 1: User Details**
   - Username (minimum 3 characters)
   - Email address (validated format)
   - Indian mobile number (+91XXXXXXXXXX)
   - Password (minimum 6 characters)
   - Confirm password

2. **Step 2: OTP Verification**
   - 6-digit OTP sent to mobile number
   - 5-minute expiry time
   - Resend OTP functionality
   - Back navigation support

3. **Step 3: Account Creation**
   - Automatic account creation after OTP verification
   - JWT token generation
   - Redirect to dashboard

### Forgot Password Recovery

1. **Step 1: Mobile Number Entry**
   - Enter registered mobile number
   - Indian number validation
   - Account existence verification

2. **Step 2: OTP Verification**
   - 6-digit OTP sent to mobile
   - OTP validation and expiry check
   - Resend functionality

3. **Step 3: Password Reset**
   - New password entry
   - Password confirmation
   - Account update and success notification

### SMS Integration Options

#### Development Mode
- **Default behavior**: OTPs displayed in server console
- **Perfect for**: Testing and development
- **Cost**: Free
- **Setup**: No configuration needed

#### Production SMS Services

##### Fast2SMS (Recommended for India)
- **Best for**: Indian mobile numbers
- **Cost**: ₹0.15 per SMS (approximately)
- **Setup**: Create account at [Fast2SMS.com](https://www.fast2sms.com/)
- **Configuration**: Add `FAST2SMS_API_KEY` to .env
- **Features**: 
  - No setup fees
  - Pay as you use
  - Easy API integration
  - Indian number optimization

##### Twilio (Global)
- **Best for**: International numbers, enterprise use
- **Cost**: $0.0075 per SMS + $1/month phone rental
- **Setup**: Create account at [Twilio.com](https://www.twilio.com/)
- **Configuration**: Add Twilio credentials to .env
- **Features**:
  - Most reliable delivery
  - Global coverage
  - Advanced features
  - Detailed analytics

##### AWS SNS
- **Best for**: AWS infrastructure users
- **Cost**: $0.00645 per SMS
- **Setup**: Configure in AWS Console
- **Configuration**: Add AWS credentials to .env
- **Features**:
  - AWS integration
  - Scalable infrastructure
  - Pay per use
  - Regional deployment

### Quick SMS Setup Guide

#### For Fast2SMS (Recommended)

1. **Sign Up**: Visit [Fast2SMS.com](https://www.fast2sms.com/)
2. **Verify**: Complete phone number verification
3. **Get API Key**: Navigate to Developer API section
4. **Add Credits**: Minimum ₹10 for testing
5. **Configure**: Add to `backend/.env`:
   ```env
   FAST2SMS_API_KEY=your_actual_api_key_here
   ```
6. **Restart**: Restart your backend server
7. **Test**: Try registration with real mobile number

#### Automatic Mode Detection
- System automatically detects configured SMS service
- Falls back to development mode if no SMS service configured
- Clear logging for troubleshooting
- Error handling for failed SMS delivery

### Phone Number Validation

- **Supported formats**:
  - `+91XXXXXXXXXX` (13 digits with country code)
  - `91XXXXXXXXXX` (12 digits with country code)
  - `XXXXXXXXXX` (10 digits, auto-prefixed with +91)

- **Automatic formatting**: System automatically formats to `+91XXXXXXXXXX`
- **Validation**: Only Indian mobile numbers (starts with 6-9)
- **Sanitization**: Removes spaces, dashes, and special characters

## 🧪 Testing

```bash
# Run all tests
npm test

# Backend tests only
npm run test:backend

# Frontend tests only
npm run test:frontend
```

## 📈 Monitoring and Logging

- **Application Logs**: Winston-based structured logging
- **Health Checks**: Built-in health monitoring endpoints
- **Performance Monitoring**: Request timing and error tracking
- **Docker Health Checks**: Container health monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in the `/docs` folder
- Review the API documentation

## 🔮 Future Enhancements

- **Machine Learning Models**: Advanced anomaly detection with trained models
- **Real-time Log Streaming**: Live log analysis and monitoring
- **Advanced Filtering**: Complex query capabilities
- **Integration APIs**: Webhooks and third-party integrations
- **Mobile App**: React Native mobile application
- **Blockchain Integration**: Immutable log storage and verification

---

**Built with ❤️ for developers and DevOps teams who want intelligent log analysis.**
