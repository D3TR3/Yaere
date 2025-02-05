import { getFirestore, collection, query, where, getDocs, setDoc, doc, getDoc, deleteDoc, writeBatch, updateDoc, serverTimestamp, deleteField, onSnapshot } from 'firebase/firestore';
import { app } from './firebase';
import { rateLimiters } from '../utils/rateLimit';

const db = getFirestore(app);

// Export both db and defaultProfilePic
export { db };

export const defaultProfilePic = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiM0QjU1NjMiLz48cGF0aCBkPSJNMTAwIDEwNUM4My4zMzE1IDEwNSA3MCAxMTguMzMyIDcwIDEzNVYxNDVIODVWMTM1Qzg1IDEyNi43MTYgOTEuNzE1NyAxMjAgMTAwIDEyMEMxMDguMjg0IDEyMCAxMTUgMTI2LjcxNiAxMTUgMTM1VjE0NUgxMzBWMTM1QzEzMCAxMTguMzMyIDExNi42NjkgMTA1IDEwMCAxMDVaTTEwMCA1NUM5MS43MTU3IDU1IDg1IDYxLjcxNTcgODUgNzBDODUgNzguMjg0MyA5MS43MTU3IDg1IDEwMCA4NUMxMDguMjg0IDg1IDExNSA3OC4yODQzIDExNSA3MEMxMTUgNjEuNzE1NyAxMDguMjg0IDU1IDEwMCA1NVoiIGZpbGw9IndoaXRlIi8+PC9zdmc+";

// Create or update user document
export const createUserDocument = async (user, username = null, emailVerified = null) => {
    if (!user) return;

    try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            // Create new document with username and verification status
            await setDoc(userRef, {
                uid: user.uid,
                email: user.email,
                displayName: username || user.displayName || '',
                photoURL: user.photoURL || defaultProfilePic,
                createdAt: new Date().toISOString(),
                emailVerified: user.providerData[0].providerId === 'google.com' ? true : false,
                provider: user.providerData[0].providerId
            });
        } else if (username || emailVerified !== null) {
            // Update document if username or verification status changes
            const updates = {};
            if (username) updates.displayName = username;
            if (emailVerified !== null) updates.emailVerified = emailVerified;
            await updateDoc(userRef, updates);
        }
    } catch (error) {
        console.error("Error creating/updating user document:", error);
        throw error;
    }
};

export const searchUserByUsername = async (username) => {
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("displayName", "==", username));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return null;
        }

        // Get the first user that matches
        const userData = querySnapshot.docs[0].data();
        return {
            ...userData,
            uid: querySnapshot.docs[0].id // Ensure uid is included
        };
    } catch (error) {
        console.error("Error searching for user:", error);
        throw error;
    }
};

// Add this new function
export const isUsernameAvailable = async (username) => {
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("displayName", "==", username));
        const querySnapshot = await getDocs(q);
        return querySnapshot.empty;
    } catch (error) {
        console.error("Error checking username availability:", error);
        throw error;
    }
};

// Add this new function
export const updateUserDocument = async (userId, data) => {
    try {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, data, { merge: true });
    } catch (error) {
        console.error("Error updating user document:", error);
        throw error;
    }
};

// Update addFriend to sendFriendRequest
export const sendFriendRequest = async (userId, friendId) => {
    if (rateLimiters.friendRequest.isRateLimited(userId)) {
        const remainingTime = rateLimiters.friendRequest.getRemainingTime(userId);
        throw new Error(`Friend request rate limit exceeded. Please wait ${Math.ceil(remainingTime / 60)} minutes.`);
    }

    await setDoc(doc(db, `users/${friendId}/friends/${userId}`), {
        added: new Date(),
        status: 'pending'
    });
};

// Update getFriendStatus to check both directions
export const getFriendStatus = async (userId, friendId) => {
    const userRef = doc(db, `users/${userId}/friends/${friendId}`);
    const friendRef = doc(db, `users/${friendId}/friends/${userId}`);

    const [userSnap, friendSnap] = await Promise.all([
        getDoc(userRef),
        getDoc(friendRef)
    ]);

    if (userSnap.exists()) {
        return userSnap.data();
    } else if (friendSnap.exists()) {
        return friendSnap.data();
    }
    return null;
};

export const getFriendsList = async (userId) => {
    const snapshot = await getDocs(collection(db, `users/${userId}/friends`));
    const friends = [];

    for (const docSnapshot of snapshot.docs) {
        const userData = await getDoc(doc(db, 'users', docSnapshot.id));
        if (userData.exists()) {
            friends.push({
                id: docSnapshot.id,
                ...userData.data(),
                status: docSnapshot.data().status
            });
        }
    }

    return friends;
};

// Update getPendingRequests to only show actual pending requests
export const getPendingRequests = async (userId) => {
    const snapshot = await getDocs(collection(db, `users/${userId}/friends`));
    const pendingRequests = [];

    for (const docSnapshot of snapshot.docs) {
        if (docSnapshot.data().status === 'pending') {
            const userData = await getDoc(doc(db, 'users', docSnapshot.id));
            if (userData.exists()) {
                pendingRequests.push({
                    id: docSnapshot.id,
                    ...userData.data(),
                    requestTime: docSnapshot.data().added
                });
            }
        }
    }

    return pendingRequests;
};

// Update the getOutgoingRequests function to check other users' friend collections
export const getOutgoingRequests = async (userId) => {
    // Get all users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const outgoingRequests = [];

    // Check each user's friends collection for pending requests from current user
    for (const userDoc of usersSnapshot.docs) {
        if (userDoc.id === userId) continue; // Skip current user

        const requestRef = doc(db, `users/${userDoc.id}/friends/${userId}`);
        const requestSnap = await getDoc(requestRef);

        if (requestSnap.exists() && requestSnap.data().status === 'pending') {
            outgoingRequests.push({
                id: userDoc.id,
                ...userDoc.data(),
                requestTime: requestSnap.data().added
            });
        }
    }

    return outgoingRequests;
};

// Update acceptFriendRequest to create bidirectional friendship
export const acceptFriendRequest = async (userId, friendId) => {
    const batch = writeBatch(db);
    const now = new Date();

    // Update both users' collections
    const userRef = doc(db, `users/${userId}/friends/${friendId}`);
    const friendRef = doc(db, `users/${friendId}/friends/${userId}`);

    batch.set(userRef, {
        added: now,
        status: 'added'
    });

    batch.set(friendRef, {
        added: now,
        status: 'added'
    });

    await batch.commit();

    // Force immediate update for both users
    const userDoc = await getDoc(doc(db, 'users', userId));
    const friendDoc = await getDoc(doc(db, 'users', friendId));

    return {
        user: { id: userId, ...userDoc.data() },
        friend: { id: friendId, ...friendDoc.data() }
    };
};

// Function to reject a friend request
export const rejectFriendRequest = async (userId, friendId) => {
    const docRef = doc(db, `users/${userId}/friends/${friendId}`);
    await deleteDoc(docRef);
};

// Update the removeFriend function to also delete messages
export const removeFriend = async (userId, friendId) => {
    const batch = writeBatch(db);

    // Get chat ID (always sorted to ensure consistency)
    const chatId = [userId, friendId].sort().join('_');

    try {
        // Delete all messages in the chat
        const messagesRef = collection(db, `chats/${chatId}/messages`);
        const messagesSnapshot = await getDocs(messagesRef);
        messagesSnapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });

        // Delete the chat document itself
        const chatRef = doc(db, 'chats', chatId);
        batch.delete(chatRef);

        // Remove from both users' friends collections
        const userRef = doc(db, `users/${userId}/friends/${friendId}`);
        const friendRef = doc(db, `users/${friendId}/friends/${userId}`);

        batch.delete(userRef);
        batch.delete(friendRef);

        await batch.commit();
    } catch (error) {
        console.error("Error removing friend and messages:", error);
        throw error;
    }
};

// Add new chat-related functions
export const sendMessage = async (senderId, receiverId, message, replyTo = null) => {
    if (rateLimiters.message.isRateLimited(senderId)) {
        const remainingTime = rateLimiters.message.getRemainingTime(senderId);
        throw new Error(`Message rate limit exceeded. Please wait ${remainingTime} seconds.`);
    }

    const chatId = [senderId, receiverId].sort().join('_');

    try {
        await setDoc(doc(db, `chats/${chatId}/messages/${Date.now()}`), {
            senderId,
            text: message,
            timestamp: serverTimestamp(),
            read: false,
            replyTo: replyTo // Add replyTo field
        });
    } catch (error) {
        console.error("Error sending message:", error);
        throw error;
    }
};

export const markMessagesAsRead = async (chatId, userId) => {
    try {
        // Get all messages in the chat
        const messagesRef = collection(db, `chats/${chatId}/messages`);
        const unreadMessages = await getDocs(
            query(
                messagesRef,
                where('read', '==', false)
            )
        );

        if (!unreadMessages.empty) {
            const batch = writeBatch(db);
            unreadMessages.docs.forEach((doc) => {
                // Only mark messages as read if they weren't sent by the current user
                if (doc.data().senderId !== userId) {
                    batch.update(doc.ref, { read: true });
                }
            });
            await batch.commit();
        }
    } catch (error) {
        console.error("Error marking messages as read:", error);
    }
};

export const getMessages = async (userId1, userId2) => {
    const chatId = [userId1, userId2].sort().join('_');
    const messagesRef = collection(db, `chats/${chatId}/messages`);
    const q = query(messagesRef);

    try {
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate()
        })).sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
        console.error("Error getting messages:", error);
        throw error;
    }
};

export const addReaction = async (chatId, messageId, reaction, userId) => {
    try {
        const messageRef = doc(db, `chats/${chatId}/messages/${messageId}`);
        await updateDoc(messageRef, {
            [`reactions.${userId}`]: reaction
        });
    } catch (error) {
        console.error("Error adding reaction:", error);
        throw error;
    }
};

export const removeReaction = async (chatId, messageId, userId) => {
    try {
        const messageRef = doc(db, `chats/${chatId}/messages/${messageId}`);
        await updateDoc(messageRef, {
            [`reactions.${userId}`]: deleteField()
        });
    } catch (error) {
        console.error("Error removing reaction:", error);
        throw error;
    }
};

export const subscribeToFriendsList = (userId, callback) => {
    const friendsRef = collection(db, `users/${userId}/friends`);

    // Get notified of all friendship changes, not just 'added' status
    return onSnapshot(friendsRef, async (snapshot) => {
        const friends = [];
        const changes = [];

        // Track changes for both additions and removals
        snapshot.docChanges().forEach((change) => {
            changes.push({
                type: change.type,
                id: change.doc.id,
                status: change.doc.data().status
            });
        });

        // Process all current friends
        for (const docSnapshot of snapshot.docs) {
            if (docSnapshot.data().status === 'added') {
                const userData = await getDoc(doc(db, 'users', docSnapshot.id));
                if (userData.exists()) {
                    friends.push({
                        id: docSnapshot.id,
                        ...userData.data(),
                        status: docSnapshot.data().status
                    });
                }
            }
        }

        callback(friends, changes);
    });
};

// Add a new tag for a user
export const addUserTag = async (userId, tag) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            const currentTags = userDoc.data().tags || [];
            if (currentTags.length >= 3) { // Limit to 3 tags
                throw new Error("Maximum tags limit reached");
            }
            await updateDoc(userRef, {
                tags: [...currentTags, tag]
            });
        }
    } catch (error) {
        console.error("Error adding tag:", error);
        throw error;
    }
};

// Remove a tag from a user
export const removeUserTag = async (userId, tagId) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            const currentTags = userDoc.data().tags || [];
            await updateDoc(userRef, {
                tags: currentTags.filter(tag => tag.id !== tagId)
            });
        }
    } catch (error) {
        console.error("Error removing tag:", error);
        throw error;
    }
};

// Add these new functions
export const setTypingStatus = async (chatId, userId, isTyping) => {
    try {
        const typingRef = doc(db, `chats/${chatId}/typing/${userId}`);
        if (isTyping) {
            await setDoc(typingRef, {
                timestamp: serverTimestamp(),
            }, { merge: true }); // Add merge option to prevent unnecessary writes
        } else {
            await deleteDoc(typingRef);
        }
    } catch (error) {
        console.error("Error updating typing status:", error);
    }
};

export const subscribeToTypingStatus = (chatId, currentUserId, callback) => {
    const typingRef = collection(db, `chats/${chatId}/typing`);
    // Add where clause to filter by recent timestamps only
    const q = query(typingRef);

    return onSnapshot(q, (snapshot) => {
        const now = Date.now();
        const typingUsers = snapshot.docs
            .filter(doc => {
                const timestamp = doc.data().timestamp?.toMillis() || 0;
                // Consider typing indicator valid only if timestamp is within last 6 seconds
                return doc.id !== currentUserId && (now - timestamp) < 6000;
            })
            .map(doc => doc.id);

        callback(typingUsers.length > 0);
    });
};
