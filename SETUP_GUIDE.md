# AI Log Analyzer - Setup Guide

## Prerequisites Installation

### 1. Install Node.js
1. Download Node.js 18+ from: https://nodejs.org/
2. Run the installer and follow the setup wizard
3. Restart your terminal/PowerShell
4. Verify installation: `node --version` and `npm --version`

### 2. Install Dependencies

Once Node.js is installed, run these commands in order:

```powershell
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..

# Create necessary directories
mkdir backend\logs

# Copy environment configuration
copy backend\.env.example backend\.env
```

### 3. Start the Application

```powershell
# Start both frontend and backend
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

## First Time Setup

1. **Create an Account**: Navigate to http://localhost:3000 and click "Register"
2. **Upload a Log File**: Use the sample log in `sample-logs/application.log` or upload your own
3. **View Analysis**: Explore the AI-generated insights, patterns, and anomalies
4. **Check Trends**: Upload multiple files to see cross-file trend analysis

## Sample Log File

A sample log file is provided at `sample-logs/application.log` for testing the AI analysis features.

## Troubleshooting

### Common Issues

1. **"npm not recognized"**: Node.js is not installed or not in PATH
2. **Port already in use**: Change ports in package.json scripts
3. **SQLite errors**: Ensure write permissions in the backend directory
4. **CORS errors**: Check that FRONTEND_URL in .env matches your frontend URL

### Getting Help

- Check the main README.md for detailed documentation
- Review the API endpoints in the backend routes
- Enable debug logging by setting LOG_LEVEL=debug in .env

## Development Commands

```powershell
# Start development servers
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Start production server
npm start
```

## Docker Alternative

If you prefer Docker:

```powershell
# Build and run with Docker Compose
docker-compose up -d
```

This will build and start the entire application stack in containers.
