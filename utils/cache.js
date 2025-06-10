const { createClient } = require('redis');
const errorHandler = require('./errorHandler');

const client = createClient({ url: process.env.REDIS_URL });

client.on('error', (err) => errorHandler(err, 'Redis Client'));

(async () => {
  try {
    await client.connect();
    console.log('Connected to Redis.');
  } catch (err) {
    errorHandler(err, 'Redis Connection');
  }
})();

module.exports = client;
