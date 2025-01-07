
// utils/ButtonManager.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config/constants');

class ButtonManager {
  constructor() {
    this.buttons = new Map();
    this.createDefaultButtons();
  }

  createDefaultButtons() {
    const joinButton = new ButtonBuilder()
      .setCustomId(config.BUTTON_IDS.JOIN)
      .setLabel('Join')
      .setStyle(ButtonStyle.Success);

    const leaveButton = new ButtonBuilder()
      .setCustomId(config.BUTTON_IDS.LEAVE)
      .setLabel('Leave')
      .setStyle(ButtonStyle.Danger);

    this.buttons.set(config.BUTTON_IDS.JOIN, joinButton);
    this.buttons.set(config.BUTTON_IDS.LEAVE, leaveButton);
  }

  getButton(buttonName) {
    return this.buttons.get(buttonName);
  }

  createButtonRow(buttonNames) {
    const row = new ActionRowBuilder();
    buttonNames.forEach(buttonName => {
      const button = this.getButton(buttonName);
      if (button) row.addComponents(ButtonBuilder.from(button));
    });
    return row;
  }
}

module.exports = new ButtonManager();


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


// commands/admin/settings.command.js
const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const settingsService = require('../../services/settingsService');
const config = require('../../config/constants');
const errorHandler = require('../../utils/errorHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('settings')
    .setDescription('Manage bot settings')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('set-role')
        .setDescription('Set a Discord role for a specific user level')
        .addIntegerOption(option =>
          option.setName('level')
            .setDescription('The user level')
            .setRequired(true))
        .addRoleOption(option =>
          option.setName('role')
            .setDescription('The Discord role to assign')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove-role')
        .setDescription('Remove the Discord role for a specific user level')
        .addIntegerOption(option =>
          option.setName('level')
            .setDescription('The user level')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('get-roles')
        .setDescription('Get all role mappings for user levels')),

  /**
   * Execute the command in response to an interaction.
   * @param {Interaction} interaction - The Discord interaction.
   */
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'set-role') {
      const level = interaction.options.getInteger('level');
      const role = interaction.options.getRole('role');

      if (level < 1) {
        return interaction.reply({
          content: '❌ Level must be at least 1.',
          ephemeral: true,
        });
      }

      await settingsService.setRoleForLevel(level, role.id);
      return interaction.reply({
        content: `✅ Role <@&${role.id}> has been set for Level ${level}.`,
        ephemeral: true,
      });
    }

    if (subcommand === 'remove-role') {
      const level = interaction.options.getInteger('level');

      if (level < 1) {
        return interaction.reply({
          content: '❌ Level must be at least 1.',
          ephemeral: true,
        });
      }

      await settingsService.setRoleForLevel(level, null);
      return interaction.reply({
        content: `✅ Role for Level ${level} has been removed.`,
        ephemeral: true,
      });
    }

    if (subcommand === 'get-roles') {
      const roleMap = await settingsService.getAllRoleMappings();
      if (Object.keys(roleMap).length === 0) {
        return interaction.reply({
          content: '📋 No role mappings have been set.',
          ephemeral: true,
        });
      }

      let response = '📋 **Role Mappings:**\n';
      for (const [level, roleId] of Object.entries(roleMap)) {
        response += `**Level ${level}:** <@&${roleId}>\n`;
      }

      return interaction.reply({
        content: response,
        ephemeral: true,
      });
    }
  },

  /**
   * Execute the command programmatically without an interaction.
   * @param {Object} args - Arguments for the command.
   */
  async executeScheduled(args) {
    try {
      const { subcommand, level, roleId } = args;

      if (subcommand === 'set-role') {
        if (!level || !roleId) throw new Error('Missing "level" or "roleId" arguments.');

        if (level < 1) {
          console.warn(`Scheduled Execution: Level must be at least 1.`);
          return;
        }

        await settingsService.setRoleForLevel(level, roleId);
        console.log(`Scheduled Execution: Role <@&${roleId}> has been set for Level ${level}.`);
      }

      if (subcommand === 'remove-role') {
        if (!level) throw new Error('Missing "level" argument.');

        if (level < 1) {
          console.warn(`Scheduled Execution: Level must be at least 1.`);
          return;
        }

        await settingsService.setRoleForLevel(level, null);
        console.log(`Scheduled Execution: Role for Level ${level} has been removed.`);
      }

      if (subcommand === 'get-roles') {
        const roleMap = await settingsService.getAllRoleMappings();
        if (Object.keys(roleMap).length === 0) {
          console.log('Scheduled Execution: No role mappings have been set.');
          return;
        }

        let response = '📋 **Role Mappings:**\n';
        for (const [level, roleId] of Object.entries(roleMap)) {
          response += `**Level ${level}:** <@&${roleId}>\n`;
        }

        console.log(`Scheduled Execution:\n${response}`);
      }
    } catch (error) {
      errorHandler(error, 'Schedule Command - executeScheduled');
    }
  },
};

// models/Settings.js
const mongoose = require('../utils/database');

const settingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
}, {
  versionKey: false,
});

module.exports = mongoose.model('Settings', settingsSchema);

// config/constants.js
module.exports = {
    BUTTON_IDS: {
      JOIN: 'join',
      LEAVE: 'leave',
      // Add more button IDs as needed
    },
    PERMISSIONS: {
      ADMINISTRATOR: 'ADMINISTRATOR',
      // Add more permissions as needed
    },
  };
  // utils/errorHandler.js
module.exports = (error, context = 'Unknown') => {
    console.error(`[❌] [${context}] ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
  };
  
  // services/settingsService.js
const Settings = require('../models/Settings');
const errorHandler = require('../utils/errorHandler');

module.exports = {
  /**
   * Get a setting by key.
   * @param {String} key - The setting key.
   * @returns {Promise<Any>}
   */
  async getSetting(key) {
    try {
      const setting = await Settings.findOne({ key }).exec();
      return setting ? setting.value : null;
    } catch (error) {
      errorHandler(error, 'Settings Service - getSetting');
      return null;
    }
  },

  /**
   * Set a setting by key.
   * @param {String} key - The setting key.
   * @param {Any} value - The value to set.
   * @returns {Promise<Object>}
   */
  async setSetting(key, value) {
    try {
      return await Settings.findOneAndUpdate(
        { key },
        { value },
        { upsert: true, new: true }
      ).exec();
    } catch (error) {
      errorHandler(error, 'Settings Service - setSetting');
      throw error;
    }
  },

  /**
   * Get role ID by level.
   * @param {Number} level - The user level.
   * @returns {Promise<String|null>}
   */
  async getRoleByLevel(level) {
    try {
      const setting = await Settings.findOne({ key: `levelRole_${level}` }).exec();
      return setting ? setting.value : null;
    } catch (error) {
      errorHandler(error, 'Settings Service - getRoleByLevel');
      return null;
    }
  },

  /**
   * Set role ID for a specific level.
   * @param {Number} level - The user level.
   * @param {String} roleId - The Discord role ID.
   * @returns {Promise<Object>}
   */
  async setRoleForLevel(level, roleId) {
    try {
      return await Settings.findOneAndUpdate(
        { key: `levelRole_${level}` },
        { value: roleId },
        { upsert: true, new: true }
      ).exec();
    } catch (error) {
      errorHandler(error, 'Settings Service - setRoleForLevel');
      throw error;
    }
  },

  /**
   * Get all role mappings.
   * @returns {Promise<Object>}
   */
  async getAllRoleMappings() {
    try {
      const mappings = await Settings.find({ key: /^levelRole_/ }).exec();
      const roleMap = {};
      mappings.forEach(mapping => {
        const level = mapping.key.replace('levelRole_', '');
        roleMap[level] = mapping.value;
      });
      return roleMap;
    } catch (error) {
      errorHandler(error, 'Settings Service - getAllRoleMappings');
      return {};
    }
  },
};
