// Updated matchmaking.js with the latest API recommendations
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
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
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const timeInput = interaction.options.getString('time');
        const tags = interaction.options.getString('tags').split(',').map(tag => tag.trim()).join(', ');
        const gameCode = interaction.options.getString('game_code');
        const description = interaction.options.getString('description');
        const creator = interaction.user.id;

        if (!/^[0-9]{1,4}$/.test(gameCode)) {
            await interaction.editReply({ content: 'Invalid game code. Please enter a number between 1 and 4 digits.', flags: MessageFlags.Ephemeral });
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
            await interaction.editReply({ content: 'Please enter a custom time in the format YYYY-MM-DD HH:MM.', flags: MessageFlags.Ephemeral });
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
                `👥 **Slots Available:** 1/6\n✅ **Joined:** ${interaction.user.username}`
            )
            .setColor(0x00AE86);

        let components = [new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('join').setLabel('Join').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('leave').setLabel('Leave').setStyle(ButtonStyle.Danger)
        )];

        if (timeInput === 'now' || matchTime <= new Date()) {
            components = [new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('stop').setLabel('Stop').setStyle(ButtonStyle.Secondary)
            )];
        } else if (creator === interaction.user.id) {
            components.push(new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('start').setLabel('Start').setStyle(ButtonStyle.Success)
            ));
        }

        const message = await interaction.editReply({ embeds: [embed], components });

        global.lobbyMap.set(message.id, {
            joinedUsers: [interaction.user.username],
            started: false,
            totalSlots: 6,
            creator
        });

        setTimeout(async () => {
            const lobbyData = global.lobbyMap.get(message.id);
            if (lobbyData && !lobbyData.started && matchTime <= new Date()) {
                lobbyData.started = true;
                embed.setTitle('Matchmaking Lobby (Started)');
                await interaction.editReply({ embeds: [embed], components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('stop').setLabel('Stop').setStyle(ButtonStyle.Secondary)
                    )
                ] });
            }
        }, 1000);
    }
};
