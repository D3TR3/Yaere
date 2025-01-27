// Import required Firebase functions
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCcvi9Tqgr8j_ixl5vVaw3nagrdWPpJBjo",
  authDomain: "yaer-e.firebaseapp.com",
  projectId: "yaer-e",
  storageBucket: "yaer-e.firebasestorage.app",
  messagingSenderId: "1088477867270",
  appId: "1:1088477867270:web:f4215df922eed64a410287",
  measurementId: "G-C3DK866BES"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const analytics = getAnalytics(app);
const auth = getAuth(app);

// Initialize Firestore with persistent cache configuration
const db = initializeFirestore(app, {
  cache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// Export initialized services
export { app, auth, analytics, db };