// models/LobbyHistory.js
const mongoose = require('../utils/database');

const lobbyHistorySchema = new mongoose.Schema({
  lobbyId: String,
  gameCode: String,
  creator: String,
  tags: String,
  joinedUsers: [String],
  totalSlots: Number,
  description: String,
  matchTime: Date,
  endedAt: Date,
}, {
  versionKey: false,
});

module.exports = mongoose.model('LobbyHistory', lobbyHistorySchema);
