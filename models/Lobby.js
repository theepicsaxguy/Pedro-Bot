// models/Lobby.js
const mongoose = require('../utils/database');

const lobbySchema = new mongoose.Schema({
  _id: String, // We'll store the "message ID" as the primary key
  gameCode: String,
  creator: String,
  unixTime: Number,
  tags: String,
  joinedUsers: [String],
  joinedUserIds: [String],
  totalSlots: Number,
  description: String,
  started: Boolean,
  matchTime: Date,
  embed: Object,
  threadId: String,
}, {
  versionKey: false
});

module.exports = mongoose.model('Lobby', lobbySchema);
