const { Client, GatewayIntentBits, Collection, InteractionType, MessageFlags, EmbedBuilder } = require('discord.js');
const { REST, Routes } = require('discord.js');
const ButtonManager = require('./utils/ButtonManager');
const lobbyManager = require('./utils/lobbyManager'); // Newly added lobbyManager
const { updateLobbyEmbed, updateLobbyStatus } = require('./utils/helpers'); // Helper functions
require('dotenv').config();
const fs = require('fs');
const schedule = require('node-schedule'); // For scheduling

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
client.commands = new Collection();

// === CENTRALIZED SCHEDULING FUNCTION ===
client.scheduleLobbyStart = function (lobbyId, matchTime, message) {
    schedule.scheduleJob(matchTime, async () => {
        const lobbyData = lobbyManager.getLobby(lobbyId);
        if (lobbyData && !lobbyData.started) {
            lobbyData.started = true;
            // After starting, we just keep the join/leave buttons on the message (no start/stop).
            lobbyData.embed.setTitle('Matchmaking Lobby (Started)');
            await message.edit({
                embeds: [lobbyData.embed],
                components: [
                    ButtonManager.createButtonRow(['join', 'leave'])
                ]
            });
        }
    });
};

// Loading command files
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

const rest = new REST({ version: '10' }).setToken(TOKEN);

// Registering commands
(async () => {
    try {
        console.log('Registering guild-specific commands...');
        const commands = client.commands.map(command => command.data.toJSON());
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
        console.log('Successfully registered guild commands.');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
})();

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
    if (interaction.isCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(`Error executing command ${interaction.commandName}:`, error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error executing that command.', flags: MessageFlags.Ephemeral });
            } else {
                await interaction.reply({ content: 'There was an error executing that command.', flags: MessageFlags.Ephemeral });
            }
        }
    } else if (interaction.isButton()) {
        const messageId = interaction.message.id;
        const lobbyData = lobbyManager.getLobby(messageId);

        console.log(`[INFO] Button interaction detected. User: ${interaction.user.tag}, Button ID: ${interaction.customId}`);

        if (!lobbyData) {
            console.log('[INFO] Lobby data not found.');
            await interaction.reply({ content: 'Lobby data not found.', flags: MessageFlags.Ephemeral });
            return;
        }

        const userId = interaction.user.id;
        const username = interaction.user.username;

        switch (interaction.customId) {
            case 'join':
                console.log(`User ${username} is attempting to join the lobby.`);
                if (!lobbyData.joinedUsers.includes(username)) {
                    lobbyData.joinedUsers.push(username);
                    lobbyData.joinedUserIds.push(userId);
                    lobbyData.currentSlots += 1;

                    console.log(`User ${username} joined the lobby. Current Slots: ${lobbyData.currentSlots}`);
                    await updateLobbyEmbed(interaction, lobbyData);
                    await interaction.deferUpdate();
                } else {
                    console.log(`User ${username} is already in the match.`);
                    await interaction.reply({ content: 'You are already in the match!', flags: MessageFlags.Ephemeral });
                }
                break;

            case 'leave':
                console.log(`User ${username} is attempting to leave the lobby.`);
                if (lobbyData.joinedUsers.includes(username)) {
                    lobbyData.joinedUsers = lobbyData.joinedUsers.filter(user => user !== username);
                    lobbyData.joinedUserIds = lobbyData.joinedUserIds.filter(id => id !== userId);
                    lobbyData.currentSlots -= 1;

                    console.log(`User ${username} left the lobby. Current Slots: ${lobbyData.currentSlots}`);
                    await updateLobbyEmbed(interaction, lobbyData);
                    await interaction.deferUpdate();
                } else {
                    console.log(`User ${username} is not in the match.`);
                    await interaction.reply({ content: 'You are not in the match!', flags: MessageFlags.Ephemeral });
                }
                break;

            // === REMOVED start & stop CASES ===

            default:
                console.log(`Unknown button interaction: ${interaction.customId}`);
                await interaction.reply({ content: 'Unknown interaction.', flags: MessageFlags.Ephemeral });
        }
    } else if (interaction.type === InteractionType.ModalSubmit) {
        if (interaction.customId === 'customTimeModal') {
            const customTimeInput = interaction.fields.getTextInputValue('customTime');
            const messageId = interaction.message.id;
            // Minimal fix: correct usage to find existing lobby data
            const lobbyData = lobbyManager.getLobby(messageId);

            if (!lobbyData) {
                await interaction.reply({ content: 'Lobby data not found.', flags: MessageFlags.Ephemeral });
                return;
            }

            // Validate custom time format
            const customTime = new Date(customTimeInput);
            if (isNaN(customTime)) {
                await interaction.reply({ content: 'Invalid date format. Please use YYYY-MM-DD HH:MM.', flags: MessageFlags.Ephemeral });
                return;
            }

            lobbyData.matchTime = customTime;
            lobbyData.unixTime = Math.floor(customTime.getTime() / 1000);

            // Update embed with custom time
            await updateLobbyEmbed(interaction, lobbyData);

            // Centralized scheduling
            client.scheduleLobbyStart(messageId, customTime, interaction.message);

            await interaction.reply({ content: 'Custom time set successfully!', flags: MessageFlags.Ephemeral });
        }
    }
});

client.login(TOKEN);
