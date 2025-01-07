// commands/admin/reactionRoles.command.js
const { SlashCommandBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const ReactionRole = require('../../models/ReactionRole');
const errorHandler = require('../../utils/errorHandler');
const ButtonManager = require('../../utils/ButtonManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reactionroles')
    .setDescription('Manage reaction role messages')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    // Subcommands
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('Create a new reaction role message')
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('The channel to send the reaction role message in')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('title')
            .setDescription('The title of the embed message')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('description')
            .setDescription('The description of the embed message')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('roles')
            .setDescription('A comma-separated list of emoji:roleId pairs (e.g., 🖥️:roleId1, 🎮:roleId2)')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('delete')
        .setDescription('Delete an existing reaction role message')
        .addStringOption(option =>
          option.setName('message-id')
            .setDescription('The message ID of the reaction role message to delete')
            .setRequired(true))),

  /**
   * Execute the command in response to an interaction.
   * @param {Interaction} interaction - The Discord interaction.
   */
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'create') {
      const channel = interaction.options.getChannel('channel');
      const title = interaction.options.getString('title');
      const description = interaction.options.getString('description');
      const rolesInput = interaction.options.getString('roles');

      if (!channel.isTextBased()) {
        return interaction.reply({
          content: '❌ Please select a text-based channel.',
          ephemeral: true,
        });
      }

      // Parse rolesInput
      const rolesArray = rolesInput.split(',').map(item => item.trim());
      const roles = [];

      for (const item of rolesArray) {
        const [emoji, roleId] = item.split(':').map(part => part.trim());
        if (!emoji || !roleId) {
          return interaction.reply({
            content: `❌ Invalid format for roles. Each role should be in the format emoji:roleId. Problematic entry: "${item}"`,
            ephemeral: true,
          });
        }

        // Validate role existence
        const role = interaction.guild.roles.cache.get(roleId);
        if (!role) {
          return interaction.reply({
            content: `❌ Role ID "${roleId}" does not exist.`,
            ephemeral: true,
          });
        }

        roles.push({ emoji, roleId });
      }

      // Create Embed
      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(0x00AE86);

      // Create Buttons
      const buttonComponents = new ActionRowBuilder();
      roles.forEach((roleObj, index) => {
        const button = new ButtonBuilder()
          .setCustomId(`reactionrole_${index}`)
          .setLabel(roleObj.emoji)
          .setStyle(ButtonStyle.Primary)
          .setEmoji(roleObj.emoji);
        buttonComponents.addComponents(button);
      });

      // Send the message
      try {
        const message = await channel.send({
          embeds: [embed],
          components: [buttonComponents],
        });

        // Save to database
        const reactionRole = new ReactionRole({
          guildId: interaction.guild.id,
          channelId: channel.id,
          messageId: message.id,
          roles: roles, // {emoji, roleId}
        });

        await reactionRole.save();

        await interaction.reply({
          content: '✅ Reaction role message has been created successfully.',
          ephemeral: true,
        });

        console.log(`[✅] Created reaction role message with ID: ${message.id}`);
      } catch (error) {
        errorHandler(error, 'ReactionRoles Command - create');
        await interaction.reply({
          content: '❌ There was an error creating the reaction role message.',
          ephemeral: true,
        });
      }
    }

    if (subcommand === 'delete') {
      const messageId = interaction.options.getString('message-id');

      try {
        const reactionRole = await ReactionRole.findOne({ messageId }).exec();
        if (!reactionRole) {
          return interaction.reply({
            content: `🔴 No reaction role message found with ID "${messageId}".`,
            ephemeral: true,
          });
        }

        // Fetch the message to remove components
        const channel = await interaction.guild.channels.fetch(reactionRole.channelId);
        if (channel && channel.isTextBased()) {
          const message = await channel.messages.fetch(reactionRole.messageId);
          if (message) {
            await message.edit({
              components: [],
            });
          }
        }

        // Remove from database
        await ReactionRole.deleteOne({ messageId }).exec();

        await interaction.reply({
          content: `✅ Reaction role message with ID "${messageId}" has been deleted.`,
          ephemeral: true,
        });

        console.log(`[✅] Deleted reaction role message with ID: ${messageId}`);
      } catch (error) {
        errorHandler(error, 'ReactionRoles Command - delete');
        await interaction.reply({
          content: '❌ There was an error deleting the reaction role message.',
          ephemeral: true,
        });
      }
    }
  },
};
