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

        if (!lobbyData) {
            await interaction.reply({ content: 'Lobby data not found.', flags: MessageFlags.Ephemeral });
            return;
        }

        const userId = interaction.user.id;
        const username = interaction.user.username;

        switch (interaction.customId) {
            case 'join':
                if (!lobbyData.joinedUsers.includes(username)) {
                    lobbyData.joinedUsers.push(username);
                    lobbyData.joinedUserIds.push(userId);
                    lobbyData.currentSlots += 1;

                    await updateLobbyEmbed(interaction, lobbyData);
                    await interaction.deferUpdate();
                } else {
                    await interaction.reply({ content: 'You are already in the match!', flags: MessageFlags.Ephemeral });
                }
                break;

            case 'leave':
                if (lobbyData.joinedUsers.includes(username)) {
                    lobbyData.joinedUsers = lobbyData.joinedUsers.filter(user => user !== username);
                    lobbyData.joinedUserIds = lobbyData.joinedUserIds.filter(id => id !== userId);
                    lobbyData.currentSlots -= 1;

                    await updateLobbyEmbed(interaction, lobbyData);
                    await interaction.deferUpdate();
                } else {
                    await interaction.reply({ content: 'You are not in the match!', flags: MessageFlags.Ephemeral });
                }
                break;

            case 'start':
                if (lobbyData.creator !== userId) {
                    await interaction.reply({ content: 'Only the lobby creator can start the match!', flags: MessageFlags.Ephemeral });
                    return;
                }
                if (!lobbyData.started) {
                    lobbyData.started = true;
                    await updateLobbyStatus(interaction, lobbyData, 'Matchmaking Lobby (Started)');
                } else {
                    await interaction.reply({ content: 'The match is already started!', flags: MessageFlags.Ephemeral });
                }
                break;

            case 'stop':
                if (lobbyData.creator !== userId) {
                    await interaction.reply({ content: 'Only the lobby creator can stop the match!', flags: MessageFlags.Ephemeral });
                    return;
                }
                if (lobbyData.started) {
                    lobbyData.started = false;
                    await updateLobbyStatus(interaction, lobbyData, 'Matchmaking Lobby');
                } else {
                    await interaction.reply({ content: 'The match is not started yet!', flags: MessageFlags.Ephemeral });
                }
                break;

            default:
                await interaction.reply({ content: 'Unknown interaction.', flags: MessageFlags.Ephemeral });
        }
    } else if (interaction.type === InteractionType.ModalSubmit) {
        if (interaction.customId === 'customTimeModal') {
            const customTimeInput = interaction.fields.getTextInputValue('customTime');
            const messageId = interaction.message.id;
            lobbyManager.setLobby(messageId, lobbyData);
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

            // Schedule the match start
            schedule.scheduleJob(customTime, async () => {
                if (lobbyData && !lobbyData.started) {
                    lobbyData.started = true;
                    lobbyData.embed.setTitle('Matchmaking Lobby (Started)');
                    await interaction.message.edit({
                        embeds: [lobbyData.embed],
                        components: [
                            ButtonManager.createButtonRow(['stop'])
                        ]
                    });
                }
            });

            await interaction.reply({ content: 'Custom time set successfully!', flags: MessageFlags.Ephemeral });
        }
    }
});

client.login(TOKEN);
