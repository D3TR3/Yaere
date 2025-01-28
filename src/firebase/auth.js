// Import necessary Firebase authentication functions
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    sendPasswordResetEmail,
    updateProfile,
    sendEmailVerification,
    applyActionCode
} from "firebase/auth";
import { auth } from "./firebase";
import { createUserDocument } from './firestore';

const RESET_COOLDOWN = 60; // 60 seconds cooldown
const RESET_COOLDOWN_KEY_PREFIX = 'passwordResetCooldown_';

// Add this function to generate random username
const generateRandomUsername = () => {
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '@yaere-';
    for (let i = 0; i < 5; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

// Function to create a new user with email and password
export const doCreateUserWithEmailAndPassword = async (email, password, username) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Send verification email
        await sendEmailVerification(userCredential.user);
        // Create the user document with username and emailVerified status
        await createUserDocument(userCredential.user, username, false);
        return userCredential.user;
    } catch (error) {
        throw error;
    }
}

// Add this new function
export const updateUserProfile = async (data) => {
    try {
        if (!auth.currentUser) throw new Error('No user logged in');
        return await updateProfile(auth.currentUser, data);
    } catch (error) {
        throw error;
    }
}

// Function to verify email
export const verifyEmail = async (actionCode) => {
    try {
        await applyActionCode(auth, actionCode);
        // Update user document to reflect verified status
        if (auth.currentUser) {
            await createUserDocument(auth.currentUser, null, true);
        }
        return true;
    } catch (error) {
        throw error;
    }
}

// Function to resend verification email
export const resendVerificationEmail = async () => {
    try {
        if (!auth.currentUser) throw new Error('No user is signed in');
        await sendEmailVerification(auth.currentUser);
        return true;
    } catch (error) {
        throw error;
    }
}; // Added missing closing brace and semicolon

// Function to sign in existing users with email and password
export const doSignInWithEmailAndPassword = async (email, password) => {
    try {
        return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        throw error;
    }
}

// Function to handle Google sign-in
export const doSignInWithGoogle = async () => {
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);

        // Only create document with random username for new users
        const isNewUser = result._tokenResponse?.isNewUser;

        if (isNewUser) {
            const randomUsername = generateRandomUsername();
            await updateProfile(result.user, {
                displayName: randomUsername,
                photoURL: null // This will ensure Firestore uses the default picture
            });
            await createUserDocument(result.user, randomUsername);
        } else {
            // Just ensure the default picture for existing users
            await updateProfile(result.user, {
                photoURL: null
            });
            await createUserDocument(result.user);
        }

        return result;
    } catch (error) {
        throw error;
    }
}

// Function to sign out users
export const doSignOut = async () => {
    try {
        return await signOut(auth);
    } catch (error) {
        throw error;
    }
}

// Function to send password reset email with cooldown
export const doPasswordReset = async (email) => {
    const cooldownKey = RESET_COOLDOWN_KEY_PREFIX + email.toLowerCase();
    const now = Date.now();
    const lastResetTime = localStorage.getItem(cooldownKey);

    if (lastResetTime) {
        const timeElapsed = Math.floor((now - parseInt(lastResetTime)) / 1000);
        if (timeElapsed < RESET_COOLDOWN) {
            throw new Error(`Please wait ${RESET_COOLDOWN - timeElapsed} seconds before requesting another reset`);
        }
    }

    try {
        await sendPasswordResetEmail(auth, email);
        localStorage.setItem(cooldownKey, now.toString());
        return true;
    } catch (error) {
        throw error;
    }
}

// Function to check remaining cooldown time
export const getResetCooldownTime = (email) => {
    const cooldownKey = RESET_COOLDOWN_KEY_PREFIX + email.toLowerCase();
    const lastResetTime = localStorage.getItem(cooldownKey);

    if (!lastResetTime) return 0;

    const now = Date.now();
    const timeElapsed = Math.floor((now - parseInt(lastResetTime)) / 1000);
    const remainingTime = Math.max(0, RESET_COOLDOWN - timeElapsed);

    if (remainingTime === 0) {
        localStorage.removeItem(cooldownKey);
    }

    return remainingTime;
}

