// commands/admin/reactionRoles.command.js
const { SlashCommandBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const ReactionRole = require('../../models/ReactionRole');
const errorHandler = require('../../utils/errorHandler');
const ButtonManager = require('../../utils/ButtonManager');
const { MessageFlags } = require('discord.js');

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
        // Define up to 4 emoji-role pairs
        .addStringOption(option =>
          option.setName('emoji1')
            .setDescription('Emoji for the first role')
            .setRequired(true))
        .addRoleOption(option =>
          option.setName('role1')
            .setDescription('Role for the first emoji')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('emoji2')
            .setDescription('Emoji for the second role')
            .setRequired(false))
        .addRoleOption(option =>
          option.setName('role2')
            .setDescription('Role for the second emoji')
            .setRequired(false))
        .addStringOption(option =>
          option.setName('emoji3')
            .setDescription('Emoji for the third role')
            .setRequired(false))
        .addRoleOption(option =>
          option.setName('role3')
            .setDescription('Role for the third emoji')
            .setRequired(false))
        .addStringOption(option =>
          option.setName('emoji4')
            .setDescription('Emoji for the fourth role')
            .setRequired(false))
        .addRoleOption(option =>
          option.setName('role4')
            .setDescription('Role for the fourth emoji')
            .setRequired(false)))
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

      // Collect up to 4 emoji-role pairs
      const roles = [];
      for (let i = 1; i <= 4; i++) {
        const emoji = interaction.options.getString(`emoji${i}`);
        const role = interaction.options.getRole(`role${i}`);
        if (emoji && role) {
          // Validate emoji
          if (!emoji.match(/^<a?:\w+:\d+>$/) && !emoji.match(/^[\u{1F600}-\u{1F64F}]/u)) {
            // Simple emoji validation: either a custom emoji or a standard emoji
            // You can enhance this regex based on your requirements
            return interaction.reply({
              content: `❌ Invalid emoji format for emoji${i}. Please provide a valid emoji.`,
              flags: MessageFlags.Ephemeral,
            });
          }

          roles.push({ emoji, roleId: role.id });
        }
      }

      if (roles.length === 0) {
        return interaction.reply({
          content: '❌ You must provide at least one emoji-role pair.',
          flags: MessageFlags.Ephemeral,
        });
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
          flags: MessageFlags.Ephemeral,
        });

        console.log(`[✅] Created reaction role message with ID: ${message.id}`);
      } catch (error) {
        errorHandler(error, 'ReactionRoles Command - create');
        await interaction.reply({
          content: '❌ There was an error creating the reaction role message.',
          flags: MessageFlags.Ephemeral,
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
            flags: MessageFlags.Ephemeral,
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
          flags: MessageFlags.Ephemeral,
        });

        console.log(`[✅] Deleted reaction role message with ID: ${messageId}`);
      } catch (error) {
        errorHandler(error, 'ReactionRoles Command - delete');
        await interaction.reply({
          content: '❌ There was an error deleting the reaction role message.',
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },

  /**
   * Execute the command programmatically without an interaction.
   * @param {Object} args - Arguments for the command.
   */
  async executeScheduled(args) {
    // Implement scheduled execution logic here if needed
  },
};
