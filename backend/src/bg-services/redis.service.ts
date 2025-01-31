import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    connectTimeout: 10000, // 10s timeout
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.log('Redis connection failed, running without cache');
        return false; // Stop reconnecting after 10 retries
      }
      return Math.min(retries * 100, 3000); // Increase delay between retries
    }
  }
});

redisClient.on('error', (err) => {
  console.warn('Redis connection error:', err);
});

redisClient.on('connect', () => {
  console.log('Redis connected successfully');
});

// Connect without blocking app startup
redisClient.connect().catch((err) => {
  console.warn('Redis initial connection failed:', err);
});

export default redisClient;