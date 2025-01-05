require('dotenv').config();
const fs = require('fs');
const schedule = require('node-schedule');
const { Client, GatewayIntentBits, Collection, InteractionType, MessageFlags } = require('discord.js');
const { REST, Routes } = require('discord.js');

// === Load the MongoDB connection from utils/database.js ===
require('./utils/database');

const ButtonManager = require('./utils/ButtonManager');
const lobbyManager = require('./commands/matchmaking/lobbyManager');
const { updateLobbyEmbed } = require('./commands/matchmaking/helpers');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

// === SCHEDULING FUNCTION ===
client.scheduleLobbyStart = function (lobbyId, matchTime, message) {
  schedule.scheduleJob(matchTime, async () => {
    const lobbyData = await lobbyManager.getLobby(lobbyId); // Must await now that it's Mongo-based
    if (lobbyData && !lobbyData.started) {
      lobbyData.started = true;
      lobbyData.embed.title = `Matchmaking Lobby (Started)`; // or .setTitle if you rebuild embed
      // upsert changes
      await lobbyManager.setLobby(lobbyId, lobbyData);

      await message.edit({
        embeds: [lobbyData.embed],
        components: [ButtonManager.createButtonRow(['join', 'leave'])],
        allowedMentions: { parse: ['roles'] },
      });
    }
  });
};

// === LOAD COMMAND FILES ===
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

// === REGISTER COMMANDS (CLEAR THEN PUT) ===
const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
  try {
    // Remove existing global commands
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });

    // Remove existing guild commands
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [] });

    // Register fresh set of guild commands
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: client.commands.map(cmd => cmd.data.toJSON()) }
    );
  } catch (error) {
    // no console logging
  }
})();

client.once('ready', () => {
  console.log('Bot is started and ready!');
});

client.on('interactionCreate', async interaction => {
  if (interaction.isCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (err) {
      // If we already replied or deferred:
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: 'There was an error executing that command.',
          flags: MessageFlags.Ephemeral
        });
      } else {
        await interaction.reply({
          content: 'There was an error executing that command.',
          flags: MessageFlags.Ephemeral
        });
      }
    }

  } else if (interaction.isButton()) {
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
        // Or handle if undefined, etc.

        if (lobbyData.threadId) {
          const thread = interaction.channel.threads.cache.get(lobbyData.threadId);
          if (thread) {
            await thread.members.add(userId);
            await thread.send(`Welcome <@${userId}>! All match communication will happen here.`);
          }
        }

        // Update DB
        await lobbyManager.setLobby(messageId, lobbyData);
        // Update embed
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

        // Update DB
        await lobbyManager.setLobby(messageId, lobbyData);
        // Update embed
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

  } else if (interaction.type === InteractionType.ModalSubmit) {
    if (interaction.customId === 'customTimeModal') {
      // Single-field approach B
      const customTimeInput = interaction.fields.getTextInputValue('customTime');

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

      const parsedDate = new Date(customTimeInput);
      if (isNaN(parsedDate)) {
        await interaction.reply({
          content: 'Invalid format. Please use YYYY-MM-DD HH:MM (e.g., 2025-01-04 15:30).',
          flags: MessageFlags.Ephemeral,
          allowedMentions: { parse: ['roles'] },
        });
        return;
      }

      // Update data
      lobbyData.matchTime = parsedDate;
      lobbyData.unixTime = Math.floor(parsedDate.getTime() / 1000);

      await lobbyManager.setLobby(messageId, lobbyData);
      await updateLobbyEmbed(interaction, lobbyData);

      client.scheduleLobbyStart(messageId, parsedDate, interaction.message);

      await interaction.reply({
        content: 'Custom time set successfully!',
        flags: MessageFlags.Ephemeral,
        allowedMentions: { parse: ['roles'] },
      });
    }
  }
});

client.login(TOKEN);
