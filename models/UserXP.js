// models/UserXP.js
const mongoose = require('../utils/database');

/**
 * Tracks each user's XP/Level by Discord user ID.
 */
const userXPSchema = new mongoose.Schema({
  _id: String,       // The user's Discord ID
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 0 },
  lastMessage: { type: Date, default: null }, // for optional cooldown logic
}, {
  versionKey: false
});

module.exports = mongoose.model('UserXP', userXPSchema);
