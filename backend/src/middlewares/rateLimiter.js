// Path: backend/src/middlewares/rateLimiter.js
import redisClient from '../config/redis';

const rateLimiter = async (req, res, next) => {
  const ip = req.ip;
  const key = `rate:${ip}`;

  try {
    const current = await redisClient.get(key);
    
    // Limit to maximum 10 requests per minute
    if (current && parseInt(current) >= 10) {
      return res.status(429).json({ error: 'Bạn đã thao tác quá nhanh. Vui lòng thử lại sau 1 phút.' });
    }

    if (!current) {
      await redisClient.setEx(key, 60, '1');
    } else {
      const val = parseInt(current) + 1;
      await redisClient.setEx(key, 60, val.toString());
    }
  } catch (err) {
    console.warn('Rate limiter error:', err.message);
  }

  next();
};

export default rateLimiter;
