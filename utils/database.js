// utils/database.js
const mongoose = require('mongoose');
const errorHandler = require('./errorHandler');

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB successfully.');
  })
  .catch(err => {
    errorHandler(err, 'MongoDB Connection');
  });

mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB.');
});

mongoose.connection.on('error', (err) => {
  errorHandler(err, 'Mongoose Connection Error');
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB.');
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('Mongoose connection closed due to app termination.');
  process.exit(0);
});

module.exports = mongoose;
