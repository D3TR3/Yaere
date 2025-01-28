export const validateUsername = (username) => {
    // Remove @ if it exists
    const cleanUsername = username.startsWith('@') ? username.slice(1) : username;

    // Check length (excluding @)
    if (cleanUsername.length > 10) {
        return { isValid: false, error: 'Username must be 10 characters or less' };
    }

    // Only allow letters, numbers, hyphen and underscore
    const validRegex = /^[a-zA-Z0-9-_]+$/;
    if (!validRegex.test(cleanUsername)) {
        return { isValid: false, error: 'Username can only contain letters, numbers, hyphens (-) and underscores (_)' };
    }

    return { isValid: true, error: null };
};

// validateImageUrl function removed
