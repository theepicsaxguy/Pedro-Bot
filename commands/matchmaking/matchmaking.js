// commands/matchmaking.js
const {
    SlashCommandBuilder,
    ActionRowBuilder,
    MessageFlags
  } = require('discord.js');
  
  const ButtonManager = require('../../utils/ButtonManager');
  const lobbyManager = require('./lobbyManager');
  const { buildLobbyEmbed } = require('./helpers');
  
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
      const MATCHMAKING_ROLE_ID = process.env.MATCHMAKING_ROLE_ID || null;
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
  