// commands/levels/levelsManager.js
const UserXP = require('../../models/UserXP');
const { calculateLevelFromXP } = require('./levelUtils');
const { MessageFlags } = require('discord.js');

/**
 * Example ENV var: LEVEL_ROLE_MAP='{"1":"ROLE_ID_LVL1","2":"ROLE_ID_LVL2"}'
 * We'll parse that once here.
 */
let levelRoleMap = {};
if (process.env.LEVEL_ROLE_MAP) {
  try {
    levelRoleMap = JSON.parse(process.env.LEVEL_ROLE_MAP);
  } catch {
    levelRoleMap = {};
  }
}

/**
 * Award XP for a message, check if user levels up, assign any matching role.
 */
async function incrementXP(message, xpToAdd) {
  // Usually skip bot messages
  if (message.author.bot) return;

  const userId = message.author.id;
  const guild = message.guild;

  // fetch or create doc
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
  //  if (userDoc.lastMessage && (Date.now() - userDoc.lastMessage.getTime()) < 15000) {
  //    return; // user wrote a message less than 15s ago, skip awarding XP
  //  }

  // update XP
  userDoc.xp += xpToAdd;
  userDoc.lastMessage = new Date();

  const oldLevel = userDoc.level;
  const newLevel = calculateLevelFromXP(userDoc.xp);

  if (newLevel > oldLevel) {
    userDoc.level = newLevel;
    await userDoc.save(); // save doc

    // Check if there's a role for that level
    const roleId = levelRoleMap[String(newLevel)];
    if (roleId) {
      const member = await guild.members.fetch(userId);
      if (member) {
        await member.roles.add(roleId);
        // (Optional) remove old level role if you want only one
        // ...

        await message.channel.send({
          content: `<@${userId}> just advanced to **Level ${newLevel}**! Congrats!`,
          flags: MessageFlags.SuppressEmbeds
        });
      }
    } else {
      // No role mapped, just announce
      await message.channel.send(`<@${userId}> just advanced to **Level ${newLevel}**! Congrats!`);
    }
  } else {
    // just save
    await userDoc.save();
  }
}

module.exports = {
  incrementXP,
};
