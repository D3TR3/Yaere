// RateLimiter class implementation
class RateLimiter {
    constructor(timeWindow = 60000, maxRequests = 10) {
        this.timeWindow = timeWindow;
        this.maxRequests = maxRequests;
        this.requests = new Map();
    }

    isRateLimited(key) {
        const now = Date.now();
        const userRequests = this.requests.get(key) || [];

        // Remove old requests outside the time window
        const recentRequests = userRequests.filter(time => time > now - this.timeWindow);

        // Update requests
        this.requests.set(key, recentRequests);

        // Check if rate limited
        if (recentRequests.length >= this.maxRequests) {
            return true;
        }

        // Add new request
        recentRequests.push(now);
        this.requests.set(key, recentRequests);
        return false;
    }

    getRemainingTime(key) {
        const now = Date.now();
        const userRequests = this.requests.get(key) || [];
        const recentRequests = userRequests.filter(time => time > now - this.timeWindow);

        if (recentRequests.length === 0) return 0;

        const oldestRequest = Math.min(...recentRequests);
        const remainingTime = Math.ceil((oldestRequest + this.timeWindow - now) / 1000);

        return Math.max(0, remainingTime);
    }

    clear(key) {
        this.requests.delete(key);
    }
}

// Create and export instances
export const rateLimiters = {
    message: new RateLimiter(60000, 30),    // 30 messages per minute
    friendRequest: new RateLimiter(3600000, 20), // 20 requests per hour
    search: new RateLimiter(60000, 10)      // 10 searches per minute
};
