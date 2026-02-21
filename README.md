# DID/VC Registration System

A comprehensive Decentralized Identifier (DID) and Verifiable Credential (VC) registration system with a Node.js/Express backend and React Native frontend.

## 📹 System Walkthrough

[Screencast from 2026-02-21 21-00-25.webm](https://github.com/user-attachments/assets/2c9a69bf-bc1d-4344-94e5-787fc676868f)

## Overview

This project implements a complete identity management system featuring:
- DID generation following W3C standards
- Verifiable Credential issuance
- JWT-based authentication
- SHA-256 audit logging
- Mobile wallet for credential storage
- QR code badge generation

## Architecture

### Backend (Node.js + Express + TypeScript)
- RESTful API with two main endpoints
- DID generation using Faker.js for realistic identifiers
- VC creation following W3C Verifiable Credentials format
- JWT token generation and verification
- SHA-256 hashing for audit trails

### Frontend (React Native + TypeScript)
- Registration screen with form validation
- Digital wallet displaying DIDs and VCs
- QR code badge generation
- Audit log viewer
- Persistent storage using AsyncStorage

## Prerequisites

- Node.js >= 18.x
- npm >= 8.x
- For React Native development:
  - iOS: Xcode and CocoaPods (macOS only)
  - Android: Android Studio and SDK

## Installation

### Backend Setup

```bash
cd backend
npm install
```

### Frontend Setup

```bash
cd frontend
npm install
```

## Running the Application

### Option 1: Using Docker (Recommended)

#### Development Mode

```bash
# Start all services with hot reload
docker-compose -f docker-compose.dev.yml up

# Run in background
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down
```

Access points:
- Backend API: http://localhost:3001
- Nginx Proxy: http://localhost:8080

#### Production Mode

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```



### Option 2: Manual Setup

#### Start Backend Server

```bash
cd backend
npm run dev
```

The server will start on `http://localhost:3001`

#### Start Frontend (Development)

For React Native, you'll need to run the Metro bundler and then launch on a simulator/device:

```bash
cd frontend
npm start
```

Then in a separate terminal:
- For iOS: `npx react-native run-ios`
- For Android: `npx react-native run-android`

## Running Tests

### Backend Tests

```bash
cd backend
npm test
```

The backend includes:
- Unit tests for all services
- Property-based tests using fast-check
- Integration tests for API endpoints

### Frontend Tests

```bash
cd frontend
npm test
```

The frontend includes:
- Validation utility tests
- Storage persistence tests
- API service tests
- Property-based tests for key functionality

## API Documentation

### POST /api/register

Register a new user and issue credentials.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "passportImage": { "uri": "...", "type": "image/jpeg" },
  "selfieImage": { "uri": "...", "type": "image/jpeg" }
}
```

**Response:**
```json
{
  "did": "did:example:550e8400-e29b-41d4-a716-446655440000",
  "vc": {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    "type": ["VerifiableCredential", "IdentityCredential"],
    "issuer": "did:example:issuer",
    "issuanceDate": "2024-01-01T00:00:00.000Z",
    "credentialSubject": {
      "id": "did:example:550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "john@example.com"
    }
  },
  "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "auditHash": "a3c5f7e9..."
}
```

### POST /api/auth

Authenticate a user and receive a JWT.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   ├── services/        # Business logic services
│   │   ├── types/           # TypeScript type definitions
│   │   ├── middleware/      # Express middleware
│   │   ├── tests/           # Test files
│   │   └── server.ts        # Express server setup
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── src/
    │   ├── screens/         # React Native screens
    │   ├── context/         # React Context for state management
    │   ├── services/        # API service layer
    │   ├── types/           # TypeScript type definitions
    │   ├── utils/           # Utility functions
    │   ├── tests/           # Test files
    │   └── App.tsx          # Main app component
    ├── package.json
    └── tsconfig.json
```

## Features

### Registration Flow
1. User enters name and email
2. User selects passport and selfie images
3. Form validation ensures data integrity
4. API call generates DID, VC, JWT, and audit hash
5. Credentials stored locally
6. Navigation to wallet screen

### Wallet Features
- Display DID in monospace font
- Show VC details (name, email, issuance date, issuer)
- Toggle QR badge display
- QR code encodes full credential data
- Navigate to audit logs

### Audit Logging
- SHA-256 hash for each credential issuance
- Timestamp for each operation
- Immutable audit trail
- Formatted display of logs

### Security Features
- JWT-based authentication
- Secure credential storage
- Input validation (name: alphanumeric + spaces, email: valid format)
- SHA-256 cryptographic hashing
- CORS enabled for cross-origin requests

## Testing Strategy

The project uses property-based testing with fast-check to validate:
- DID uniqueness and format
- VC structure and data integrity
- JWT generation and claims
- SHA-256 hash generation
- Form validation rules
- Storage persistence
- API response completeness

## Troubleshooting

### Backend Issues

**Port already in use:**
```bash
# Change PORT in backend/.env or kill the process
lsof -ti:3000 | xargs kill
```

**TypeScript compilation errors:**
```bash
cd backend
npm run build
```

### Frontend Issues

**Metro bundler cache issues:**
```bash
cd frontend
npx react-native start --reset-cache
```

**iOS build fails:**
```bash
cd ios
pod install
cd ..
npx react-native run-ios
```

**Android build fails:**
- Ensure Android SDK is installed
- Check ANDROID_HOME environment variable
- Clean build: `cd android && ./gradlew clean`

### Test Failures

**Backend tests fail:**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
npm test
```

**Frontend tests fail:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm test
```

## Environment Variables

### Backend

Create a `.env` file in the backend directory:

```env
PORT=3000
JWT_SECRET=your-secret-key-change-in-production
```

### Frontend

Update `API_BASE_URL` in `frontend/src/services/api.ts` for production:

```typescript
const API_BASE_URL = 'https://your-production-api.com';
```

## Deployment

The project can be deployed using Docker or manually on various hosting platforms.

### Docker Deployment

Use the provided Docker Compose files for easy deployment:

```bash
# Development
docker-compose -f docker-compose.dev.yml up -d

# Production
docker-compose up -d
```

### Manual Deployment Options

The application can be deployed to various platforms:

- **Render.com** - Free tier available for Node.js apps
- **Railway** - Simple deployment with free tier
- **Fly.io** - Global deployment with free allowance
- **Heroku** - Classic PaaS option
- **Vercel/Netlify** - For frontend static builds

### Deployment Steps

1. Set up a Node.js hosting environment
2. Configure environment variables (PORT, JWT_SECRET)
3. Deploy backend and frontend separately or together
4. Set up MongoDB and RabbitMQ instances if needed
5. Configure SSL certificates (usually automatic on modern platforms)

## Future Enhancements

- Multi-signature credential verification
- Blockchain integration for DID anchoring
- Revocation registry for credentials
- Advanced QR code scanning
- Credential sharing protocols
- Multi-language support
- WebSocket for real-time updates
- GraphQL API
- Microservices architecture

## License

ISC

## Contributors

Built as a demonstration of DID/VC technology implementation with production-ready enhancements.
