// commands/levels/levelsManager.js
const userService = require('../../services/userService');
const levelUtils = require('../../utils/levelUtils');
const roleManager = require('../../utils/roleManager');
const settingsService = require('../../services/settingsService');
const config = require('../../config/constants');
const { MessageFlags } = require('discord.js');
const errorHandler = require('../../utils/errorHandler');

/**
 * Update a user's XP and handle level changes.
 * @param {String} userId - Discord user ID.
 * @param {Guild} guild - Discord guild.
 * @param {Channel} channel - Channel to send level up messages.
 * @param {Number} baseXP - Base XP before multipliers.
 * @param {String} activity - Activity key for multipliers.
 */
async function incrementXP(userId, guild, channel, baseXP, activity = 'MESSAGE') {
  try {
    let userDoc = await userService.getUser(userId);
    if (!userDoc) {
      userDoc = await userService.setUser(userId, {
        xp: 0,
        level: 0,
        lastMessage: null,
        excludedChannels: [],
        lastDaily: null,
        lastWeekly: null,
      });
    }

    const excluded = await settingsService.getSetting('excludedChannels') || [];
    if (channel && excluded.includes(channel.id)) return;

    // XP decay after seven days of inactivity
    if (userDoc.lastMessage) {
      const days = Math.floor((Date.now() - userDoc.lastMessage.getTime()) / 86400000);
      if (days > 7) {
        const decay = Math.floor(userDoc.xp * 0.01 * (days - 7));
        userDoc.xp = Math.max(0, userDoc.xp - decay);
      }
    }

    const multiplier = config.XP_MULTIPLIERS[activity] || 1;
    const totalXP = Math.ceil(baseXP * multiplier);
    userDoc.xp += totalXP;
    userDoc.lastMessage = new Date();

    const oldLevel = userDoc.level;
    const newLevel = levelUtils.calculateLevelFromXP(userDoc.xp);
    userDoc.level = newLevel;
    await userService.setUser(userId, userDoc);

    if (newLevel > oldLevel) {
      const member = await guild.members.fetch(userId);
      if (member) await roleManager.assignRole(member, newLevel);
      if (channel) {
        await channel.send({
          content: `<@${userId}> just advanced to **Level ${newLevel}**! Congrats!`,
          flags: MessageFlags.SuppressEmbeds,
        });
      }
    } else if (newLevel < oldLevel) {
      const member = await guild.members.fetch(userId);
      if (member) await roleManager.removeRole(member, oldLevel);
    }
  } catch (error) {
    errorHandler(error, 'Levels Manager - incrementXP');
  }
}

module.exports = { incrementXP };
