// utils/database.js
const mongoose = require('mongoose');
const config = require('../config/constants');
const errorHandler = require('./errorHandler');

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('Connected to MongoDB successfully.');
  })
  .catch(err => {
    errorHandler(err, 'MongoDB Connection');
  });

// Handle Mongoose Events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB.');
});

mongoose.connection.on('error', (err) => {
  errorHandler(err, 'Mongoose Connection Error');
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB.');
});

// Optional: Handle process termination
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('Mongoose connection closed due to app termination.');
  process.exit(0);
});

module.exports = mongoose;
