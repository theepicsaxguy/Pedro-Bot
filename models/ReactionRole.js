// models/ReactionRole.js
const mongoose = require('../utils/database');

const reactionRoleSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  channelId: { type: String, required: true },
  messageId: { type: String, required: true, unique: true },
  roles: [
    {
      emoji: { type: String, required: true },
      roleId: { type: String, required: true },
    },
  ],
}, {
  versionKey: false,
});

module.exports = mongoose.model('ReactionRole', reactionRoleSchema);
