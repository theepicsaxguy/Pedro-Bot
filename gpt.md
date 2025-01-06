You are a software developer specialiced in Discord.js v14. You job is to analyze the folowing code and structure and create a plan on how to make the code more scalable, more efficient and focus on making it more flexablie and modular. Its important there is no duplicate or unnececary code. Do not seperate code if not needed. All changes shall be justified. 

Your first job is to analyze the provided code. You should not solve any issues. But rather plan and discuss how we can achieve our goal. If something is unclear you will ask questions. 


## Project Structure

Pedro-Bot/ ├── commands/ │   ├── matchmaking/ │   │   ├── helpers.js           # Utilities to build/update matchmaking embeds │   │   ├── lobbyManager.js      # Manages lobby data in Mongo (was originally file-based) │   │   └── matchmaking.js       # The /matchmaking command logic (creates a new lobby post) │   ├── levels/ │   │   ├── levelsManager.js     # Core XP logic: awarding XP, checking level-ups, assigning roles │   │   ├── levelUtils.js        # XP / Level formulas (xpRequiredForLevel, etc.) │   │   └── level.js             # The /level command that shows a user's current XP/level │   └── [other-command].js       # Potential future commands, each file exports a SlashCommand ├── models/ │   ├── Lobby.js                 # Mongoose model for storing matchmaking lobbies │   └── UserXP.js                # Mongoose model for storing user XP & level ├── utils/ │   ├── ButtonManager.js         # Generic button creation/management (JOIN/LEAVE, etc.) │   └── database.js              # Mongoose connect() logic shared across the project ├── .env                         # Environment variables (tokens, MONGO_URI, etc.) ├── docker-compose.yml           # Defines two services: pedro-bot and mongodb ├── index.js                     # Main entry point. Registers commands, listens for interactions └── package.json                 # Node.js dependencies


Files to analyze:

//Index.js
require('dotenv').config();
const fs = require('fs');
const schedule = require('node-schedule');
const { Client, GatewayIntentBits, Collection, InteractionType, MessageFlags } = require('discord.js');
const { REST, Routes } = require('discord.js');

// Load Mongo connection
require('./utils/database');

const ButtonManager = require('./utils/ButtonManager');
const lobbyManager = require('./commands/matchmaking/lobbyManager');
const { updateLobbyEmbed } = require('./commands/matchmaking/helpers');
const { incrementXP } = require('./commands/levels/levelsManager');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});
client.commands = new Collection();

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

// === SCHEDULING FUNCTION ===
client.scheduleLobbyStart = function (lobbyId, matchTime, message) {
  schedule.scheduleJob(matchTime, async () => {
    const lobbyData = await lobbyManager.getLobby(lobbyId);
    if (lobbyData && !lobbyData.started) {
      lobbyData.started = true;
      lobbyData.embed.title = 'Matchmaking Lobby (Started)';
      await lobbyManager.setLobby(lobbyId, lobbyData);

      await message.edit({
        embeds: [lobbyData.embed],
        components: [ButtonManager.createButtonRow(['join', 'leave'])],
        allowedMentions: { parse: ['roles'] },
      });
      console.log(`[✅] Lobby ${lobbyId} has started.`);
    }
  });
};

// === LOAD COMMAND FILES ===
console.log('[ℹ️] Loading commands...');
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
  console.log(`[✅] Command loaded: ${command.data.name}`);
}
console.log(`[✅] Total commands loaded: ${client.commands.size}`);

// === REGISTER COMMANDS (CLEAR THEN PUT) ===
const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
  try {
    console.log('[ℹ️] Registering commands with Discord...');
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [] });
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: client.commands.map(cmd => cmd.data.toJSON()) }
    );
    console.log('[✅] Commands registered successfully.');
  } catch (error) {
    console.error('[❌] Command registration failed:', error);
  }
})();

// === READY EVENT ===
client.once('ready', async () => {
  console.log(`[✅] Bot is online as ${client.user.tag}.`);

  // Check MongoDB connection
  try {
    const mongoose = require('mongoose');
    const connectionStatus = mongoose.connection.readyState;
    if (connectionStatus === 1) {
      console.log('[✅] MongoDB connection is live.');
    } else {
      console.log('[⚠️] MongoDB connection is not live. Check your connection settings.');
    }
  } catch (error) {
    console.error('[❌] Error checking MongoDB connection:', error);
  }
});

// === MESSAGE CREATE EVENT ===
client.on('messageCreate', async (message) => {
  if (!message.guild || message.author.bot) return;
  await incrementXP(message, 5);
});

// === INTERACTION CREATE EVENT ===
client.on('interactionCreate', async interaction => {
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
      console.error(`[❌] Error executing command: ${interaction.commandName}`, error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: 'There was an error executing that command.',
          flags: Flags.Ephemeral
        });
      } else {
        await interaction.reply({
          content: 'There was an error executing that command.',
          flags: Flags.Ephemeral
        });
      }
    }
  } else if (interaction.isButton()) {
    // Handle button interactions

    const messageId = interaction.message.id;
    const lobbyData = await lobbyManager.getLobby(messageId);

    if (!lobbyData) {
      await interaction.reply({
        content: 'Lobby data not found.',
        flags: MessageFlags.Ephemeral,
        allowedMentions: { parse: ['roles'] },
      });
      return;
    }

    const userId = interaction.user.id;
    const username = interaction.user.username;

    switch (interaction.customId) {
      case 'join':
        if (lobbyData.joinedUsers.includes(username)) {
          await interaction.reply({
            content: 'You are already in the match!',
            flags: MessageFlags.Ephemeral,
            allowedMentions: { parse: ['roles'] },
          });
          return;
        }
        lobbyData.joinedUsers.push(username);
        lobbyData.joinedUserIds.push(userId);
        lobbyData.currentSlots = (lobbyData.currentSlots || 1) + 1;

        if (lobbyData.threadId) {
          const thread = interaction.channel.threads.cache.get(lobbyData.threadId);
          if (thread) {
            await thread.members.add(userId);
            await thread.send(`Welcome <@${userId}>! All match communication will happen here.`);
          }
        }

        // Persist to DB
        await lobbyManager.setLobby(messageId, lobbyData);
        await updateLobbyEmbed(interaction, lobbyData);
        await interaction.deferUpdate();
        break;

      case 'leave':
        if (!lobbyData.joinedUsers.includes(username)) {
          await interaction.reply({
            content: 'You are not in the match!',
            flags: MessageFlags.Ephemeral,
            allowedMentions: { parse: ['roles'] },
          });
          return;
        }
        lobbyData.joinedUsers = lobbyData.joinedUsers.filter(user => user !== username);
        lobbyData.joinedUserIds = lobbyData.joinedUserIds.filter(id => id !== userId);
        lobbyData.currentSlots = (lobbyData.currentSlots || 1) - 1;

        if (lobbyData.threadId) {
          const thread = interaction.channel.threads.cache.get(lobbyData.threadId);
          if (thread) {
            await thread.members.remove(userId);
            await thread.send(`${username} has left the match.`);
          }
        }

        await lobbyManager.setLobby(messageId, lobbyData);
        await updateLobbyEmbed(interaction, lobbyData);
        await interaction.deferUpdate();
        break;

      default:
        await interaction.reply({
          content: 'Unknown interaction.',
          flags: MessageFlags.Ephemeral,
          allowedMentions: { parse: ['roles'] },
        });
    }

  }

});




// === LOGIN THE BOT ===
client.login(TOKEN).then(() => {
  console.log('[✅] Bot login successful.');
}).catch(err => {
  console.error('[❌] Bot login failed:', err);
});



// utils/database.js
require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB successfully.');
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
})();

module.exports = mongoose;

// utils/ButtonManager.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class ButtonManager {
    constructor() {
        this.buttons = new Map();
        this.createDefaultButtons();
    }

    createDefaultButtons() {
        const joinButton = new ButtonBuilder()
            .setCustomId('join')
            .setLabel('Join')
            .setStyle(ButtonStyle.Success);

        const leaveButton = new ButtonBuilder()
            .setCustomId('leave')
            .setLabel('Leave')
            .setStyle(ButtonStyle.Danger);

        this.buttons.set('join', joinButton);
        this.buttons.set('leave', leaveButton);
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

// models/UserXP.js
const mongoose = require('../utils/database');

const userXPSchema = new mongoose.Schema({
  _id: String,
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 0 },
  lastMessage: { type: Date, default: null },
  excludedChannels: { type: [String], default: [] },
}, {
  versionKey: false
});

module.exports = mongoose.model('UserXP', userXPSchema);

// models/Lobby.js
const mongoose = require('../utils/database');

const lobbySchema = new mongoose.Schema({
  _id: String, // We'll store the "message ID" as the primary key
  gameCode: String,
  creator: String,
  unixTime: Number,
  tags: String,
  joinedUsers: [String],
  joinedUserIds: [String],
  totalSlots: Number,
  description: String,
  started: Boolean,
  matchTime: Date,
  embed: Object,
  threadId: String,
}, {
  versionKey: false
});

module.exports = mongoose.model('Lobby', lobbySchema);

// commands/level.js
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const UserXP = require('../models/UserXP');
const { xpRequiredForLevel } = require('./levels/levelUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('level')
    .setDescription('Check your current level'),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const userId = interaction.user.id;
    const userDoc = await UserXP.findById(userId).exec() || { xp: 0, level: 0 };
    const xp = userDoc.xp;
    const lvl = userDoc.level;
    const xpNeeded = xpRequiredForLevel(lvl + 1) - xp;

    await interaction.editReply({
      content: `You are **Level ${lvl}** with **${xp} XP**.\n` +
               `You need **${xpNeeded > 0 ? xpNeeded : 0} XP** to reach Level ${lvl + 1}.`,
      flags: MessageFlags.Ephemeral
    });
  }
};

// commands/manageChannels.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const UserXP = require('../models/UserXP');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('managechannels')
    .setDescription('Manage the list of channels excluded from XP tracking')
    .setDefaultMemberPermissions(0x00000008n) // Correct: Bitfield for ADMINISTRATOR
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add a channel to the excluded list')
        .addChannelOption(option => 
          option.setName('channel')
            .setDescription('Channel to exclude')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove a channel from the excluded list')
        .addChannelOption(option => 
          option.setName('channel')
            .setDescription('Channel to remove')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all excluded channels')),

  async execute(interaction) {
    // Check if the user has admin permissions
    if (!interaction.member.permissions.has('ADMINISTRATOR')) {
      return interaction.reply({
        content: '❌ You do not have permission to use this command.',
        ephemeral: true
      });
    }

    const subcommand = interaction.options.getSubcommand();
    const channel = interaction.options.getChannel('channel');

    let globalSettings = await UserXP.findById('globalSettings').exec();
    if (!globalSettings) {
      globalSettings = new UserXP({ _id: 'globalSettings', excludedChannels: [] });
      await globalSettings.save();
    }

    if (subcommand === 'add') {
      if (globalSettings.excludedChannels.includes(channel.id)) {
        await interaction.reply(`🔴 Channel <#${channel.id}> is already excluded.`);
      } else {
        globalSettings.excludedChannels.push(channel.id);
        await globalSettings.save();
        await interaction.reply(`✅ Channel <#${channel.id}> has been added to the excluded list.`);
        console.log(`[ℹ️] ${interaction.user.tag} added channel ${channel.id} to excluded channels.`);
      }
    } else if (subcommand === 'remove') {
      if (!globalSettings.excludedChannels.includes(channel.id)) {
        await interaction.reply(`🔴 Channel <#${channel.id}> is not in the excluded list.`);
      } else {
        globalSettings.excludedChannels = globalSettings.excludedChannels.filter(id => id !== channel.id);
        await globalSettings.save();
        await interaction.reply(`✅ Channel <#${channel.id}> has been removed from the excluded list.`);
        console.log(`[ℹ️] ${interaction.user.tag} removed channel ${channel.id} from excluded channels.`);
      }
    } else if (subcommand === 'list') {
      if (globalSettings.excludedChannels.length === 0) {
        await interaction.reply('📋 No channels are currently excluded from XP tracking.');
      } else {
        const channelList = globalSettings.excludedChannels.map(id => `<#${id}>`).join('\n');
        await interaction.reply(`📋 Excluded Channels:\n${channelList}`);
      }
    }
  },
};


// commands/matchmaking.js
const {
    SlashCommandBuilder,
    ActionRowBuilder,
    MessageFlags
  } = require('discord.js');
  
  const ButtonManager = require('../utils/ButtonManager');
  const lobbyManager = require('./matchmaking/lobbyManager');
  const { buildLobbyEmbed } = require('./matchmaking/helpers');
  
  module.exports = {
    data: new SlashCommandBuilder()
      .setName('matchmaking')
      .setDescription('Create a matchmaking lobby')
      .addStringOption(option =>
        option.setName('time')
          .setDescription('Select match time')
          .setRequired(true)
          .addChoices(
            { name: 'Now',           value: 'now'     },
            { name: 'In 30 Minutes', value: '30_min'  },
            { name: 'In 1 Hour',     value: '1_hour'  },
            { name: 'In 2 Hours',    value: '2_hours' }
            // REMOVED: { name: 'Custom Time', value: 'custom' }
          )
      )
      .addStringOption(option =>
        option.setName('tags')
          .setDescription('Select match tags (separate multiple tags with commas)')
          .setRequired(true)
          .addChoices(
            { name: 'Casual',    value: 'casual'    },
            { name: 'Tactical',  value: 'tactical'  },
            { name: 'Mislim',    value: 'mislim'    },
            { name: 'Training',  value: 'training'  }
          )
      )
      .addStringOption(option =>
        option.setName('game_code')
          .setDescription('Enter a game code (1 to 4 digits)')
          .setRequired(true)
      )
      .addStringOption(option =>
        option.setName('description')
          .setDescription('Provide a description for the match')
          .setRequired(true)
      ),
  
    async execute(interaction) {
      // Defer ephemeral
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  
      // Collect user input
      const timeInput = interaction.options.getString('time');
      const tagsInput = interaction.options.getString('tags');
      const tags = tagsInput.split(',').map(tag => tag.trim()).join(', ');
      const gameCode = interaction.options.getString('game_code');
      const description = interaction.options.getString('description');
      const creator = interaction.user.id;
      const username = interaction.user.username;
  
      // Basic validations
      if (!/^[0-9]{1,4}$/.test(gameCode)) {
        await interaction.editReply({
          content: 'Invalid game code. Please enter a number between 1 and 4 digits.',
          flags: MessageFlags.Ephemeral
        });
        return;
      }
  
      if (description.length > 200) {
        await interaction.editReply({
          content: 'Description is too long. Please limit to 200 characters.',
          flags: MessageFlags.Ephemeral
        });
        return;
      }
  
      // Determine the match time
      const now = new Date();
      let matchTime;
      if (timeInput === 'now') {
        matchTime = now;
      } else if (timeInput === '30_min') {
        matchTime = new Date(now.getTime() + 30 * 60 * 1000);
      } else if (timeInput === '1_hour') {
        matchTime = new Date(now.getTime() + 60 * 60 * 1000);
      } else if (timeInput === '2_hours') {
        matchTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      }
  
      const unixTime = Math.floor(matchTime.getTime() / 1000);
  
      // Build initial data
      const lobbyData = {
        _id: '', // We'll fill with message ID
        gameCode,
        creator,
        unixTime,
        tags,
        joinedUsers: [username],
        joinedUserIds: [creator],
        totalSlots: 6,
        description,
        started: false,
        matchTime,
      };
      const embed = buildLobbyEmbed(lobbyData);
      lobbyData.embed = embed;
  
      // Provide join/leave buttons
      const publicComponents = [
        ButtonManager.createButtonRow(['join', 'leave'])
      ];
  
      // Send to #matchmaking
      const matchmakingChannel = interaction.guild.channels.cache.find(ch => ch.name === 'matchmaking');
      if (!matchmakingChannel) {
        await interaction.editReply({
          content: 'Error: Could not find a channel named #matchmaking.',
          flags: MessageFlags.Ephemeral
        });
        return;
      }
  
      // Fix the role mention (no "Cc:"), just the role itself
      const MATCHMAKING_ROLE_ID = '1324150202470371358' || null;

      const roleMention = MATCHMAKING_ROLE_ID ? `<@&${MATCHMAKING_ROLE_ID}>` : '@Matchmaking';
  
      // Actually ping the role with no prefix
      const message = await matchmakingChannel.send({
        content: roleMention,
        embeds: [embed],
        components: publicComponents,
        allowedMentions: { parse: ['roles'] },
      });
  
      // Create a thread
      const thread = await message.startThread({
        name: gameCode,
        autoArchiveDuration: 60,
        reason: 'Matchmaking thread',
      });
      await thread.members.add(creator);
      await thread.send(`<@${creator}> This thread is for match communication.`);
  
      // Store final data (Mongo)
      lobbyData._id = message.id;
      lobbyData.threadId = thread.id;
      await lobbyManager.setLobby(message.id, lobbyData);
  
      // Schedule
      interaction.client.scheduleLobbyStart(message.id, matchTime, message);
  
      // Inform user ephemeral
      await interaction.editReply({
        content: 'Your matchmaking lobby has been created in #matchmaking!',
        flags: MessageFlags.Ephemeral
      });
    }
  };
  

  // commands/matchmaking/helpers.js
const { EmbedBuilder } = require('discord.js');
const ButtonManager = require('../../utils/ButtonManager');

const MATCHMAKING_ROLE_ID = process.env.MATCHMAKING_ROLE_ID || null;

function buildLobbyEmbed(lobbyData) {
  // Title can stay as "Lobby created X"
  return new EmbedBuilder()
    .setTitle(`Lobby created ${lobbyData.gameCode}`)
    .setDescription(`
      **Host:** <@${lobbyData.creator}>
      **Time:** <t:${lobbyData.unixTime}:t>
      **Tags:** ${lobbyData.tags}
      **Slots Available:** ${lobbyData.joinedUsers.length}/${lobbyData.totalSlots}
      **Joined:** ${lobbyData.joinedUsers.join(', ')}
      **Description:** ${lobbyData.description}

      Notes: Missions start at designated time (auto-converts to your time).
      All discussion is in the thread. Please click Join/Leave as needed.
      `)
    .setColor(0x00AE86)
    // NEW: Add the small footer at the bottom
    .setFooter({ text: '(MATAC) The Mature Tactical Circkle'
     });
}

async function updateLobbyEmbed(interaction, lobbyData) {
  const embed = buildLobbyEmbed(lobbyData);
  lobbyData.embed = embed;

  const finalComponents = interaction.message.components;
  await interaction.message.edit({
    embeds: [embed],
    components: finalComponents,
    allowedMentions: { parse: ['roles'] },
  });
}

module.exports = {
  buildLobbyEmbed,
  updateLobbyEmbed,
};


// commands/matchmaking/lobbyManager.js
const LobbyModel = require('../../models/Lobby');

module.exports = {
  /**
   * Fetch a lobby by ID (returns a doc or null).
   */
  async getLobby(id) {
    return await LobbyModel.findById(id).exec();
  },

  /**
   * Upsert a lobby doc based on the ID.
   */
  async setLobby(id, data) {
    return await LobbyModel.findByIdAndUpdate(
      id,
      { _id: id, ...data },
      { upsert: true, new: true }
    ).exec();
  },

  /**
   * Delete a lobby by ID.
   */
  async deleteLobby(id) {
    return await LobbyModel.findByIdAndDelete(id).exec();
  },
};

// commands/levels/levelsManager.js
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

// commands/levels/levelUtils.js

/**
 * For example: xp needed = 100 * (level^2).
 * Feel free to adjust to taste.
 */
function xpRequiredForLevel(level) {
    return 100 * (level ** 3);
  }
  
  /**
   * Given total XP, figure out which level the user is on.
   * This loops from 1 upward until the next level is too large.
   */
  function calculateLevelFromXP(xp) {
    let lvl = 0;
    while (xp >= xpRequiredForLevel(lvl + 1)) {
      lvl++;
    }
    return lvl;
  }
  
  module.exports = {
    xpRequiredForLevel,
    calculateLevelFromXP,
  };
  