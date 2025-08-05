const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;
const redisClient = require('../config/redis');

// Create rate limiter with Redis store
const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  };

  // Only use Redis store if Redis is available
  if (redisClient.isReady()) {
    defaultOptions.store = new RedisStore({
      sendCommand: (...args) => redisClient.getClient().sendCommand(args),
    });
  }

  return rateLimit({ ...defaultOptions, ...options });
};

// Different rate limiters for different endpoints
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs for auth endpoints
  message: {
    error: 'Too many authentication attempts, please try again later.'
  }
});

const generalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

const strictLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs for sensitive operations
});

module.exports = {
  createRateLimiter,
  authLimiter,
  generalLimiter,
  strictLimiter
};