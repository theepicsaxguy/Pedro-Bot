const { createClient } = require('redis');
const errorHandler = require('./errorHandler');

const REDIS_URI = process.env.REDIS_URI;

const client = createClient({ url: REDIS_URI });

client.on('error', err => errorHandler(err, 'Redis'));

client.connect().catch(err => errorHandler(err, 'Redis Connect'));

module.exports = client;
