const UserXP = require('../../models/UserXP');
const { calculateLevelFromXP } = require('./levelUtils');
const { MessageFlags } = require('discord.js');

/**
 * Award XP for a message, check if user levels up, assign any matching role.
 */
async function incrementXP(message, xpToAdd) {
  // Usually skip bot messages
  if (message.author.bot) return;

  // Fetch the global settings (use a static ID for simplicity)
  let globalSettings = await UserXP.findById('globalSettings').exec();
  if (!globalSettings) {
    // If not found, create a default settings document
    globalSettings = new UserXP({
      _id: 'globalSettings',
      excludedChannels: [],
    });
    await globalSettings.save();
  }

  // Skip XP in excluded channels
  if (globalSettings.excludedChannels.includes(message.channel.id)) return;

  const userId = message.author.id;
  const guild = message.guild;

  // Fetch or create document for the user
  let userDoc = await UserXP.findById(userId).exec();
  if (!userDoc) {
    userDoc = new UserXP({
      _id: userId,
      xp: 0,
      level: 0,
      lastMessage: new Date(),
    });
  }

  // (Optional) cooldown check:
  if (userDoc.lastMessage && (Date.now() - userDoc.lastMessage.getTime()) < 15000) {
    return; // User wrote a message less than 15s ago, skip awarding XP
  }

  // Update XP
  userDoc.xp += xpToAdd;
  userDoc.lastMessage = new Date();

  const oldLevel = userDoc.level;
  const newLevel = calculateLevelFromXP(userDoc.xp);

  if (newLevel > oldLevel) {
    userDoc.level = newLevel;
    await userDoc.save(); // Save document

    // Check if there's a role for that level
    const roleId = levelRoleMap[String(newLevel)];
    if (roleId) {
      const member = await guild.members.fetch(userId);
      if (member) {
        await member.roles.add(roleId);

        await message.channel.send({
          content: `<@${userId}> just advanced to **Level ${newLevel}**! Congrats!`,
          flags: MessageFlags.SuppressEmbeds,
        });
      }
    } else {
      // No role mapped, just announce
      await message.channel.send(`<@${userId}> just advanced to **Level ${newLevel}**! Congrats!`);
    }
  } else {
    // Just save
    await userDoc.save();
  }
}

module.exports = {
  incrementXP,
};
