require('dotenv').config();
const fs = require('fs');
const schedule = require('node-schedule');
const { Client, GatewayIntentBits, Collection, InteractionType, MessageFlags } = require('discord.js');
const { REST, Routes } = require('discord.js');
const ButtonManager = require('./utils/ButtonManager');
// Moved: lobbyManager import now from the matchmaking folder
const lobbyManager = require('./commands/matchmaking/lobbyManager');
// Moved: embed helpers import now from matchmaking folder
const { updateLobbyEmbed } = require('./commands/matchmaking/helpers');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

// === CENTRALIZED SCHEDULING FUNCTION ===
client.scheduleLobbyStart = function (lobbyId, matchTime, message) {
    schedule.scheduleJob(matchTime, async () => {
        const lobbyData = lobbyManager.getLobby(lobbyId);
        if (lobbyData && !lobbyData.started) {
            lobbyData.started = true;
            lobbyData.embed.setTitle('Matchmaking Lobby (Started)');
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
        // Clear existing guild commands
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });
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

client.on('interactionCreate', async interaction => {
    if (interaction.isCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch {
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
    }

    else if (interaction.isButton()) {
        const messageId = interaction.message.id;
        const lobbyData = lobbyManager.getLobby(messageId);
        if (!lobbyData) {
            // FIRST ACK -> ephemeral reply and return
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
                // If user is already in
                if (lobbyData.joinedUsers.includes(username)) {
                    // FIRST ACK -> ephemeral reply and return
                    await interaction.reply({
                        content: 'You are already in the match!',
                        flags: MessageFlags.Ephemeral,
                        allowedMentions: { parse: ['roles'] },
                    });
                    return;
                }
                // Otherwise proceed
                lobbyData.joinedUsers.push(username);
                lobbyData.joinedUserIds.push(userId);
                lobbyData.currentSlots += 1;

                if (lobbyData.threadId) {
                    const thread = interaction.channel.threads.cache.get(lobbyData.threadId);
                    if (thread) {
                        await thread.members.add(userId);
                        await thread.send(`Welcome <@${userId}>! All match communication will happen here.`);
                    }
                }
                // We edit the embed
                await updateLobbyEmbed(interaction, lobbyData);
                // SECOND (and only) ACK -> deferUpdate
                await interaction.deferUpdate();
                break;

            case 'leave':
                // If user is not in
                if (!lobbyData.joinedUsers.includes(username)) {
                    // FIRST ACK -> ephemeral reply and return
                    await interaction.reply({
                        content: 'You are not in the match!',
                        flags: MessageFlags.Ephemeral,
                        allowedMentions: { parse: ['roles'] },
                    });
                    return;
                }
                // Otherwise proceed
                lobbyData.joinedUsers = lobbyData.joinedUsers.filter(user => user !== username);
                lobbyData.joinedUserIds = lobbyData.joinedUserIds.filter(id => id !== userId);
                lobbyData.currentSlots -= 1;

                if (lobbyData.threadId) {
                    const thread = interaction.channel.threads.cache.get(lobbyData.threadId);
                    if (thread) {
                        await thread.members.remove(userId);
                        await thread.send(`${username} has left the match.`);
                    }
                }
                await updateLobbyEmbed(interaction, lobbyData);
                // SECOND (and only) ACK -> deferUpdate
                await interaction.deferUpdate();
                break;

            default:
                // FIRST ACK -> ephemeral reply and return
                await interaction.reply({
                    content: 'Unknown interaction.',
                    flags: MessageFlags.Ephemeral,
                    allowedMentions: { parse: ['roles'] },
                });
        }
    }

    else if (interaction.type === InteractionType.ModalSubmit) {
        if (interaction.customId === 'customTimeModal') {
            const customTimeInput = interaction.fields.getTextInputValue('customTime');
            const messageId = interaction.message.id;
            const lobbyData = lobbyManager.getLobby(messageId);

            if (!lobbyData) {
                // FIRST ACK -> ephemeral reply and return
                await interaction.reply({
                    content: 'Lobby data not found.',
                    flags: MessageFlags.Ephemeral,
                    allowedMentions: { parse: ['roles'] },
                });
                return;
            }

            const customTime = new Date(customTimeInput);
            if (isNaN(customTime)) {
                // FIRST ACK -> ephemeral reply and return
                await interaction.reply({
                    content: 'Invalid date format. Please use YYYY-MM-DD HH:MM.',
                    flags: MessageFlags.Ephemeral,
                    allowedMentions: { parse: ['roles'] },
                });
                return;
            }

            // Update data and embed
            lobbyData.matchTime = customTime;
            lobbyData.unixTime = Math.floor(customTime.getTime() / 1000);
            await updateLobbyEmbed(interaction, lobbyData);
            client.scheduleLobbyStart(messageId, customTime, interaction.message);

            // FIRST ACK -> ephemeral reply
            await interaction.reply({
                content: 'Custom time set successfully!',
                flags: MessageFlags.Ephemeral,
                allowedMentions: { parse: ['roles'] },
            });
        }
    }
});

client.login(TOKEN);
