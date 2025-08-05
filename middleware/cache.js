const redisClient = require('../config/redis');

// Generic cache middleware
const cache = (duration = 300) => {
  return async (req, res, next) => {
    if (!redisClient.isReady()) {
      return next();
    }

    const key = `cache:${req.originalUrl}`;
    
    try {
      const cachedData = await redisClient.get(key);
      
      if (cachedData) {
        console.log(`Cache hit for: ${key}`);
        return res.json(cachedData);
      }

      // Store original res.json
      const originalJson = res.json;
      
      // Override res.json to cache the response
      res.json = function(data) {
        // Cache the response
        redisClient.set(key, data, duration);
        console.log(`Cached response for: ${key}`);
        
        // Call original res.json
        originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

// Cache invalidation helper
const invalidateCache = (pattern) => {
  return async (req, res, next) => {
    if (!redisClient.isReady()) {
      return next();
    }

    try {
      // Store original methods
      const originalJson = res.json;
      const originalSend = res.send;

      // Override response methods to invalidate cache after successful operations
      const invalidateAfterResponse = function(data) {
        // Only invalidate on successful operations (2xx status codes)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          setTimeout(async () => {
            try {
              const keys = await redisClient.getClient().keys(pattern);
              if (keys.length > 0) {
                await redisClient.getClient().del(keys);
                console.log(`Invalidated cache keys: ${keys.join(', ')}`);
              }
            } catch (error) {
              console.error('Cache invalidation error:', error);
            }
          }, 0);
        }
        return data;
      };

      res.json = function(data) {
        invalidateAfterResponse(data);
        originalJson.call(this, data);
      };

      res.send = function(data) {
        invalidateAfterResponse(data);
        originalSend.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Cache invalidation middleware error:', error);
      next();
    }
  };
};

module.exports = { cache, invalidateCache };