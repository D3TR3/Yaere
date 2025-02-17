```bash
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function isFriendshipParticipant(userId, friendId) {
      return isOwner(userId) || isOwner(friendId);
    }
    
    function isParticipant(chatId) {
      let participants = chatId.split('_');
      return participants.hasAll([request.auth.uid]);
    }

    // User document rules
    match /users/{userId} {
      // Allow reading user documents for username availability check
      allow read: if true; // Modified to allow public read for username checks
      allow create: if request.auth != null;
      allow update: if isAuthenticated() && isOwner(userId);
      allow delete: if isAuthenticated() && isOwner(userId);
      
      match /friends/{friendId} {
        allow create, read: if isAuthenticated() && isFriendshipParticipant(userId, friendId);
        allow update: if isAuthenticated() && isFriendshipParticipant(userId, friendId);
        allow delete: if isAuthenticated() && isFriendshipParticipant(userId, friendId);
      }
    }

    // Chat document rules remain the same
    match /chats/{chatId} {
      allow create, read: if isAuthenticated() && isParticipant(chatId);
      allow delete: if isAuthenticated() && isParticipant(chatId);

      match /messages/{messageId} {
        allow read: if isAuthenticated() && isParticipant(chatId);
        allow create: if isAuthenticated() && 
                     isParticipant(chatId) &&
                     request.resource.data.senderId == request.auth.uid;
        allow update: if isAuthenticated() && 
                     isParticipant(chatId) &&
                     request.resource.data.diff(resource.data).affectedKeys()
                      .hasOnly(['reactions', 'read']);
        allow delete: if isAuthenticated() && isParticipant(chatId);
      }

      match /typing/{userId} {
        allow read, write: if isAuthenticated() && isParticipant(chatId);
      }
    }
  }
}
```
