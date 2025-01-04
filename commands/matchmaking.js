// Updated matchmaking.js with the latest API recommendations
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
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
        await interaction.deferReply(); // Deferring the reply to handle interaction timing

        const timeInput = interaction.options.getString('time');
        const tags = interaction.options.getString('tags').split(',').map(tag => tag.trim()).join(', ');
        const gameCode = interaction.options.getString('game_code');
        const description = interaction.options.getString('description');

        if (!/^[0-9]{1,4}$/.test(gameCode)) {
            await interaction.editReply({ content: 'Invalid game code. Please enter a number between 1 and 4 digits.', ephemeral: true });
            return;
        }

        let matchTime;
        if (timeInput === 'now') {
            matchTime = new Date();
        } else if (timeInput === '1_hour') {
            matchTime = new Date(Date.now() + 60 * 60 * 1000);
        } else if (timeInput === 'tomorrow') {
            matchTime = new Date();
            matchTime.setDate(matchTime.getDate() + 1);
        } else if (timeInput === 'custom') {
            await interaction.editReply({ content: 'Please enter a custom time in the format YYYY-MM-DD HH:MM.', ephemeral: true });
            return;
        }

        const unixTime = Math.floor(matchTime.getTime() / 1000);

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

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('join')
                .setLabel('Join')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('start')
                .setLabel('Start')
                .setStyle(ButtonStyle.Success)
        );

        const message = await interaction.editReply({ embeds: [embed], components: [row] });

        global.lobbyMap.set(message.id, {
            joinedUsers: [],
            started: false,
            totalSlots: 6
        });
    }
};
