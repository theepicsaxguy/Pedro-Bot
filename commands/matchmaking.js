// commands/matchmaking.js

const {
    SlashCommandBuilder,
    ActionRowBuilder,
    MessageFlags,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');
const ButtonManager = require('../utils/ButtonManager');
const lobbyManager = require('../utils/lobbyManager');
const { buildLobbyEmbed } = require('../utils/helpers'); // Import the single embed builder

module.exports = {
    data: new SlashCommandBuilder()
        .setName('matchmaking')
        .setDescription('Create a matchmaking lobby')
        .addStringOption(option =>
            option.setName('time')
                .setDescription('Select match time')
                .setRequired(true)
                .addChoices(
                    { name: 'Now', value: 'now' },
                    { name: 'In 1 Hour', value: '1_hour' },
                    { name: 'Tomorrow', value: 'tomorrow' },
                    { name: 'Custom Time', value: 'custom' }
                )
        )
        .addStringOption(option =>
            option.setName('tags')
                .setDescription('Select match tags (separate multiple tags with commas)')
                .setRequired(true)
                .addChoices(
                    { name: 'Casual', value: 'casual' },
                    { name: 'Tactical', value: 'tactical' },
                    { name: 'Mislim', value: 'mislim' },
                    { name: 'Training', value: 'training' }
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
        await interaction.deferReply();

        // Extract input
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
        } else if (timeInput === '1_hour') {
            matchTime = new Date(now.getTime() + 60 * 60 * 1000);
        } else if (timeInput === 'tomorrow') {
            matchTime = new Date(now);
            matchTime.setDate(matchTime.getDate() + 1);
        } else if (timeInput === 'custom') {
            // Present a modal for custom date/time
            const modal = new ModalBuilder()
                .setCustomId('customTimeModal')
                .setTitle('Set Custom Time');

            const timeInputField = new TextInputBuilder()
                .setCustomId('customTime')
                .setLabel('Enter custom time (YYYY-MM-DD HH:MM)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('2025-01-04 15:30')
                .setRequired(true);

            const firstActionRow = new ActionRowBuilder().addComponents(timeInputField);
            modal.addComponents(firstActionRow);

            await interaction.showModal(modal);
            return;
        }

        const unixTime = Math.floor(matchTime.getTime() / 1000);

        // Build the initial embed via our unified helper
        const lobbyData = {
            gameCode,
            creator,
            unixTime,
            tags,
            joinedUsers: [username],
            totalSlots: 6,
            description,
        };
        const embed = buildLobbyEmbed(lobbyData);

        // Provide join/leave buttons
        const publicComponents = [
            ButtonManager.createButtonRow(['join', 'leave'])
        ];

        // Send the embed
        const message = await interaction.editReply({
            embeds: [embed],
            components: publicComponents
        });

        // Create a thread for this lobby
        const thread = await message.startThread({
            name: gameCode,
            autoArchiveDuration: 60,
            reason: 'Matchmaking thread',
        });
        await thread.members.add(creator);
        await thread.send(`<@${creator}> This thread is for match communication.`);

        // Now finalize the lobby data (including the embed we just built) for storing
        lobbyData.started = false;
        lobbyData.matchTime = matchTime;
        lobbyData.joinedUserIds = [creator];
        lobbyData.embed = embed;
        lobbyData.threadId = thread.id;

        // Store in our manager
        lobbyManager.setLobby(message.id, lobbyData);

        // Schedule the lobby
        interaction.client.scheduleLobbyStart(message.id, matchTime, message);
    }
};
