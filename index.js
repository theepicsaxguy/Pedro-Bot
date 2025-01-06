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
  console.log(`[📨] Message received from ${message.author.tag}: "${message.content}" - XP awarded.`);
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

