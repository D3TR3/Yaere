import React, { useContext, useEffect, useState } from "react";
import { auth } from "../../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doSignOut } from '../../firebase/auth';
import { createUserDocument } from '../../firebase/firestore';

// Create a context for authentication
const AuthContext = React.createContext();

// Custom hook to use authentication context
export function useAuth() {
    return useContext(AuthContext);
}

// Provider component that wraps your app and makes auth object available to any
// child component that calls useAuth().
export function AuthProvider({children}) {
    // State to hold user information
    const [currentUser, setCurrentUser] = useState(null);
    const [userSignedIn, setUserSignedIn] = useState(false);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        // Subscribe to auth state changes
        const unsubscribe = onAuthStateChanged(auth, initializeUser);
        // Cleanup subscription on unmount
        return unsubscribe;
    }, []);

    // Handle user state changes
    async function initializeUser(user) {
        if (user) {
            // Ensure user document exists with current display name
            await createUserDocument(user, user.displayName);
            setCurrentUser({...user});
            setUserSignedIn(true);
        } else {
            // User is signed out
            setCurrentUser(null);
            setUserSignedIn(false);
        }
        setLoading(false);
    }

    // Handle user sign out
    const handleSignOut = async () => {
        try {
            await doSignOut();
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    // Refresh user data
    const refreshUser = async () => {
        if (auth.currentUser) {
            setCurrentUser({...auth.currentUser});
        }
    };

    // Value object that will be shared
    const value = {
        currentUser,    // The current user object
        userSignedIn,   // Boolean indicating if user is signed in
        loading,        // Loading state
        handleSignOut,  // Function to sign out
        refreshUser     // Function to refresh user data
    }

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    )
}