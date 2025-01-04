// utils/helpers.js

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const ButtonManager = require('./ButtonManager');

async function updateLobbyEmbed(interaction, lobbyData, components = []) {
    console.log(`[INFO] Updating lobby embed for messageId: ${interaction.message.id}`);
    console.log(`[INFO] Lobby data:`, lobbyData);

    const embed = EmbedBuilder.from(lobbyData.embed);
    embed.setDescription(
        `🎮 **Created by <@${lobbyData.creator}>!**\n` +
        `📅 **Date/Time:** <t:${lobbyData.unixTime}:F>\n` +
        `🏷 **Tags:** ${lobbyData.tags}\n` +
        `🔑 **Game Code:** ${lobbyData.gameCode}\n` +
        `📜 **Description:** ${lobbyData.description}\n` +
        `👥 **Slots Available:** ${lobbyData.joinedUsers.length}/${lobbyData.totalSlots}\n` +
        `✅ **Joined:** ${lobbyData.joinedUsers.join(', ')}`
    );
    lobbyData.embed = embed;

    if (interaction.message) {
        await interaction.message.edit({ embeds: [embed], components });
        console.log(`[INFO] Message edited successfully.`);
    } else {
        console.error('[ERROR] Message not found or already deleted.');
    }
}

async function updateLobbyStatus(interaction, lobbyData, title) {
    console.log(`[INFO] Updating lobby status for messageId: ${interaction.message.id}`);
    console.log(`[INFO] Lobby data being used:`, lobbyData);

    const embed = EmbedBuilder.from(lobbyData.embed);
    embed.setTitle(title);
    lobbyData.embed = embed;

    const components = [
        ButtonManager.createButtonRow(['join', 'leave']),
    ];

    if (lobbyData.creator === interaction.user.id) {
        const additionalButtons = lobbyData.started ? ['stop'] : ['start', 'stop'];
        components.push(ButtonManager.createButtonRow(additionalButtons));
    }

    await interaction.message.edit({ embeds: [embed], components });
    console.log(`[INFO] Message edited with new status.`);
}


module.exports = {
    updateLobbyEmbed,
    updateLobbyStatus,
};
