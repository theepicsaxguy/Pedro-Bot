// models/Settings.js
const mongoose = require('../utils/database');

const settingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
}, {
  versionKey: false,
});

module.exports = mongoose.model('Settings', settingsSchema);
