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
      // Update embed title or any field you want
      lobbyData.embed.title = 'Matchmaking Lobby (Started)';
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
    // Clear global commands
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });
    // Clear guild commands
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [] });
    // Register fresh set
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: client.commands.map(cmd => cmd.data.toJSON()) }
    );
  } catch (error) {
    // No console logging
  }
})();

client.once('ready', () => {
  console.log('Bot is started and ready!');
});
// NEW: messageCreate event to award XP
client.on('messageCreate', async (message) => {
  // optional: ignore DMs or bot messages
  if (!message.guild || message.author.bot) return;
  // For now, we award 5 XP per message. Adjust as needed
  await incrementXP(message, 5);
});

client.on('interactionCreate', async interaction => {
  if (interaction.isCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (err) {
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
  // REMOVE the entire custom time modal code:
  // We no longer handle "customTimeModal" or any "ModalSubmit" for it

});

client.login(TOKEN);
