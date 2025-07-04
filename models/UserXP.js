// models/UserXP.js
const mongoose = require('../utils/database');

const userXPSchema = new mongoose.Schema({
  _id: String,
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 0 },
  lastMessage: { type: Date, default: null },
  excludedChannels: { type: [String], default: [] },
  lastDaily: { type: Date, default: null },
  lastWeekly: { type: Date, default: null },
}, {
  versionKey: false,
});

module.exports = mongoose.model('UserXP', userXPSchema);
