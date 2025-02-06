# YAERE - Real-Time Chat Application

YAERE is a full-featured real-time chat application built with React and Firebase.

## Features

- Real-time messaging with typing indicators
- Friend management system
- Custom user tags
- Message reactions
- Message replies
- Secure authentication with email and Google sign-in
- Fully responsive design
- Username search functionality

## Technologies

- React.js
- Firebase (Authentication, Firestore)
- TailwindCSS
- React Icons

## Prerequisites

- Node.js (v16.0.0 or higher)
- npm (v7.0.0 or higher)
- Firebase account

## Firebase Setup

1. Firebase Console:
   - Go to Firebase Console
   - Create new project
   - Enable Google Auth and Email/Password
   - Set up Firestore [security rules](https://github.com/D3TR3/Yaere/blob/main/fireStoreRules.md)

2. Project Configuration:
   - Copy Firebase config from project settings
   - Update .env file with configuration

## Project Structure

```
yaere/
├── src/
│   ├── components/      # React components
│   ├── contexts/        # Context providers
│   ├── firebase/        # Firebase configuration
│   ├── utils/          # Utility functions
│   └── App.js          # Main application
├── public/             # Static assets
└── config/             # Configuration files
```

## Setting up

1. Clone the repository:
```sh
git clone https://github.com/D3TR3/Yaere
cd yaere
```
2. Add your firebase config to .env:
```sh
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
```
```
yaere/
├── .env       #.env should be located in the root folder!
├── public/             
└── config/
```

## Available Scripts

```bash
npm start           # Development server
npm run build       # Production build
npm run rei         # Reinstall dependencies
```

## Troubleshooting

Common issues and solutions:

1. Build Errors:
```bash
npm cache clean --force
npm rei
```

2. Firebase Connection:
- Check .env configuration
- Verify Firebase project settings
- Ensure correct API keys

3. Authentication Issues:
- Enable required auth providers
- Check Firebase security rules
- Verify domain whitelist
