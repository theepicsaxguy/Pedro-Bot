const mongoose = require('../utils/database');

const lobbyHistorySchema = new mongoose.Schema({
  gameCode: String,
  creator: String,
  matchTime: Date,
  joinedUsers: [String],
  description: String,
  createdAt: { type: Date, default: Date.now },
}, {
  versionKey: false,
});

module.exports = mongoose.model('LobbyHistory', lobbyHistorySchema);
