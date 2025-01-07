// events/interactionCreate.js
const { InteractionType, MessageFlags } = require('discord.js');
const joinButton = require('../buttons/join');
const leaveButton = require('../buttons/leave');
const errorHandler = require('../utils/errorHandler');
const config = require('../config/constants');
const ReactionRole = require('../models/ReactionRole');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (interaction.isCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) {
        console.log(`[❌] Unknown command: ${interaction.commandName}`);
        return;
      }

      try {
        await command.execute(interaction);
        console.log(`[✅] Command executed: ${interaction.commandName}`);
      } catch (error) {
        errorHandler(error, `Command: ${interaction.commandName}`);
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: '❌ There was an error executing that command.',
            flags: MessageFlags.Ephemeral,
          });
        } else {
          await interaction.reply({
            content: '❌ There was an error executing that command.',
            flags: MessageFlags.Ephemeral,
          });
        }
      }
    } else if (interaction.isButton()) {
      try {
        if (interaction.customId === config.BUTTON_IDS.JOIN) {
          await joinButton.execute(interaction);
        } else if (interaction.customId === config.BUTTON_IDS.LEAVE) {
          await leaveButton.execute(interaction);
        } else if (interaction.customId.startsWith('reactionrole_')) {
          // Handle Reaction Role button interactions
          await handleReactionRoleButton(interaction, client);
        } else {
          await interaction.reply({
            content: '❌ Unknown interaction.',
            flags: MessageFlags.Ephemeral,
            allowedMentions: { parse: ['roles'] },
          });
        }
      } catch (error) {
        errorHandler(error, `Button: ${interaction.customId}`);
        await interaction.reply({
          content: '❌ There was an error processing that interaction.',
          flags: MessageFlags.Ephemeral,
          allowedMentions: { parse: ['roles'] },
        });
      }
    }
  },
};

/**
 * Handles Reaction Role button interactions.
 * @param {ButtonInteraction} interaction - The button interaction.
 * @param {Client} client - The Discord client instance.
 */
async function handleReactionRoleButton(interaction, client) {
  const { guildId, messageId, customId, user } = interaction;

  // Fetch the ReactionRole configuration
  const reactionRole = await ReactionRole.findOne({ guildId, messageId }).exec();
  if (!reactionRole) {
    console.warn(`[⚠️] No ReactionRole configuration found for message ID: ${messageId}`);
    return interaction.reply({
      content: '❌ Reaction role configuration not found.',
      ephemeral: true,
    });
  }

  // Extract the index from customId, e.g., 'reactionrole_0'
  const parts = customId.split('_');
  if (parts.length < 2) {
    return interaction.reply({
      content: '❌ Invalid reaction role button.',
      ephemeral: true,
    });
  }

  const index = parseInt(parts[1], 10);
  if (isNaN(index) || index < 0 || index >= reactionRole.roles.length) {
    return interaction.reply({
      content: '❌ Invalid reaction role button.',
      ephemeral: true,
    });
  }

  const roleObj = reactionRole.roles[index];
  const role = interaction.guild.roles.cache.get(roleObj.roleId);
  if (!role) {
    return interaction.reply({
      content: `❌ The role associated with this button no longer exists.`,
      ephemeral: true,
    });
  }

  const member = await interaction.guild.members.fetch(user.id);

  if (member.roles.cache.has(role.id)) {
    // Remove the role
    await member.roles.remove(role);
    await interaction.reply({
      content: `✅ The role <@&${role.id}> has been removed from you.`,
      ephemeral: true,
    });
    console.log(`[✅] Removed role <@&${role.id}> from user ${user.tag}`);
  } else {
    // Add the role
    await member.roles.add(role);
    await interaction.reply({
      content: `✅ The role <@&${role.id}> has been added to you.`,
      ephemeral: true,
    });
    console.log(`[✅] Added role <@&${role.id}> to user ${user.tag}`);
  }
}
