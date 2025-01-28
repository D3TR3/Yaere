import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    onIdTokenChanged,
    getIdToken
} from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { createUserDocument } from '../firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userSignedIn, setUserSignedIn] = useState(false);
    const [loading, setLoading] = useState(true);

    const signUp = async (email, password) => {
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            await createUserDocument(result.user);
            return result;
        } catch (error) {
            console.error("Error signing up:", error);
            throw error;
        }
    };

    const signIn = async (email, password) => {
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            return result;
        } catch (error) {
            console.error("Error signing in:", error);
            throw error;
        }
    };

    const signInWithGoogle = async () => {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            await createUserDocument(result.user);
            return result;
        } catch (error) {
            console.error("Error signing in with Google:", error);
            throw error;
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out:", error);
            throw error;
        }
    };

    const refreshUser = async () => {
        try {
            const user = auth.currentUser;
            if (user) {
                await user.reload();
                setCurrentUser(auth.currentUser);
            }
        } catch (error) {
            console.error("Error refreshing user:", error);
            throw error;
        }
    };

    useEffect(() => {
        const unsubscribe = onIdTokenChanged(auth, async (user) => {
            if (user) {
                try {
                    const token = await getIdToken(user, true);
                    setCurrentUser({ ...user, token });
                    setUserSignedIn(true);
                } catch (error) {
                    console.error("Token refresh error:", error);
                    handleSignOut();
                }
            } else {
                setCurrentUser(null);
                setUserSignedIn(false);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        userSignedIn,
        signUp,
        signIn,
        signInWithGoogle,
        handleSignOut,
        refreshUser
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
