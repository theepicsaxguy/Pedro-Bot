const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ButtonManager = require('../utils/ButtonManager');

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
                .setDescription('Select match tags')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('game_code')
                .setDescription('Enter a 4-digit game code')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('description')
                .setDescription('Provide a description for the match')
                .setRequired(false)
        ),
    async execute(interaction) {
        let timeInput = interaction.options.getString('time');
        const tags = interaction.options.getString('tags');
        const gameCode = interaction.options.getString('game_code');
        const description = interaction.options.getString('description') || 'No description provided';

        // Calculate time based on selected option
        let matchTime;
        if (timeInput === 'now') {
            matchTime = new Date();
        } else if (timeInput === '1_hour') {
            matchTime = new Date(Date.now() + 60 * 60 * 1000);
        } else if (timeInput === 'tomorrow') {
            matchTime = new Date();
            matchTime.setDate(matchTime.getDate() + 1);
        } else if (timeInput === 'custom') {
            // For custom time, prompt user to enter it manually (handled elsewhere if needed)
            await interaction.reply({ content: 'Please enter a custom time in the format YYYY-MM-DD HH:MM.', ephemeral: true });
            return;
        }

        const unixTime = Math.floor(matchTime.getTime() / 1000);

        // Create initial embed
        const embed = new EmbedBuilder()
            .setTitle('Matchmaking Lobby')
            .setDescription(
                `🎮 **Created by ${interaction.user.username}!**\n` +
                `📅 **Date/Time:** <t:${unixTime}:F>\n` +
                `🏷 **Tags:** ${tags}\n` +
                `🔑 **Game Code:** ${gameCode}\n` +
                `📜 **Description:** ${description}\n` +
                `👥 **Slots Available:** 0/6`
            )
            .setColor(0x00AE86);

        // Create buttons
        const row = ButtonManager.createButtonRow(['join', 'start']);

        // Send the initial embed with buttons
        const message = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

        // Store lobby data in the message for future updates
        message.lobbyData = {
            joinedUsers: [],
            started: false,
            totalSlots: 6
        };
    }
};
