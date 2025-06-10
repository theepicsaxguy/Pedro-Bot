const { createClient } = require('redis');

const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';
const redis = createClient({ url: REDIS_URL });

redis.on('error', err => {
  console.error('[Redis] Error', err);
});

redis.connect()
  .then(() => console.log('[Redis] Connected'))
  .catch(err => console.error('[Redis] Connection failed', err));

module.exports = redis;
