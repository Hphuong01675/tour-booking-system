// Path: backend/src/config/redis.js

// Simple in-memory fallback cache
class InMemoryCache {
  constructor() {
    this.store = new Map();
  }

  async get(key) {
    const record = this.store.get(key);
    if (!record) return null;
    if (Date.now() > record.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return record.value;
  }

  async set(key, value) {
    this.store.set(key, { value, expiresAt: Infinity });
    return 'OK';
  }

  async setEx(key, seconds, value) {
    const expiresAt = Date.now() + seconds * 1000;
    this.store.set(key, { value, expiresAt });
    return 'OK';
  }

  async del(key) {
    return this.store.delete(key) ? 1 : 0;
  }
}

let redisClient;

try {
  // Fallback to memory as default to prevent runtime crashes if Redis server is down/not installed
  redisClient = new InMemoryCache();
  console.log('Redis Cache initialized (In-Memory Fallback).');
} catch (error) {
  redisClient = new InMemoryCache();
  console.log('Redis Cache fallback initialized (In-Memory).');
}

export default redisClient;
