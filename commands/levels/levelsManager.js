// commands/levels/levelsManager.js
const userService = require('../../services/userService');
const levelUtils = require('../../utils/levelUtils');
const roleManager = require('../../utils/roleManager');
const settingsService = require('../../services/settingsService');
const { MessageFlags } = require('discord.js');
const errorHandler = require('../../utils/errorHandler');

/**
 * Award XP for a message, check if user levels up, assign any matching role.
 * @param {Message} message - The Discord message object.
 * @param {Number} xpToAdd - The amount of XP to add.
 */
async function incrementXP(message, xpToAdd) {
  try {
    // Skip bot messages
    if (message.author.bot) return;

    // Fetch user document
    let userDoc = await userService.getUser(message.author.id);
    if (!userDoc) {
      userDoc = await userService.setUser(message.author.id, {
        xp: 0,
        level: 0,
        lastMessage: new Date(),
        excludedChannels: [],
      });
    }

    // Check if the channel is excluded
    if (!cachedExcludedChannels) {
      await refreshExcludedChannelsCache();
    }
    if (cachedExcludedChannels.includes(message.channel.id)) return;

    // Cooldown check: skip if last message was less than 15 seconds ago
    if (userDoc.lastMessage && (Date.now() - userDoc.lastMessage.getTime()) < 15000) {
      return;
    }

    // Update XP
    userDoc.xp += xpToAdd;
    userDoc.lastMessage = new Date();

    // Calculate new level
    const oldLevel = userDoc.level;
    const newLevel = levelUtils.calculateLevelFromXP(userDoc.xp);

    if (newLevel > oldLevel) {
      userDoc.level = newLevel;
      await userService.setUser(message.author.id, userDoc);

      // Assign role based on new level
      const member = await message.guild.members.fetch(message.author.id);
      if (member) {
        await roleManager.assignRole(member, newLevel);
      }

      // Notify user about level up
      await message.channel.send({
        content: `<@${message.author.id}> just advanced to **Level ${newLevel}**! Congrats!`,
        flags: MessageFlags.SuppressEmbeds,
      });
    } else {
      // Save user document without level change
      await userService.setUser(message.author.id, userDoc);
    }
  } catch (error) {
    errorHandler(error, 'Levels Manager - incrementXP');
  }
}

module.exports = {
  incrementXP,
};
