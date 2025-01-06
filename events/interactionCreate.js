// events/interactionCreate.js
const { InteractionType, MessageFlags } = require('discord.js');
const joinButton = require('../buttons/join');
const leaveButton = require('../buttons/leave');
const errorHandler = require('../utils/errorHandler');
const config = require('../config/constants');

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
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            content: '❌ There was an error executing that command.',
            ephemeral: true,
          });
        }
      }
    } else if (interaction.isButton()) {
      try {
        if (interaction.customId === config.BUTTON_IDS.JOIN) {
          await joinButton.execute(interaction);
        } else if (interaction.customId === config.BUTTON_IDS.LEAVE) {
          await leaveButton.execute(interaction);
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
