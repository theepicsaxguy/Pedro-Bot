// commands/matchmaking/helpers.js
const { EmbedBuilder } = require('discord.js');
const ButtonManager = require('../../utils/ButtonManager');

const MATCHMAKING_ROLE_ID = process.env.MATCHMAKING_ROLE_ID || null;

function buildLobbyEmbed(lobbyData) {
    const roleMention = MATCHMAKING_ROLE_ID ? `<@&${MATCHMAKING_ROLE_ID}>` : '@Matchmaking';
    return new EmbedBuilder()
        .setTitle(lobbyData.gameCode)
        .setDescription(`
**Host:** <@${lobbyData.creator}>
**Time:** <t:${lobbyData.unixTime}:t>
**Tags:** ${lobbyData.tags}
**Slots Available:** ${lobbyData.joinedUsers.length}/${lobbyData.totalSlots}
**Joined:** ${lobbyData.joinedUsers.join(', ')}
**Description:** ${lobbyData.description}

Notes: Running missions in a lobby, will start at designated time (auto-converts to your time)
Info and questions in thread.

Please put the corresponding tick for attendance;

Cc: ${roleMention}
`)
        .setColor(0x00AE86);
}

async function updateLobbyEmbed(interaction, lobbyData) {
    const embed = buildLobbyEmbed(lobbyData);
    lobbyData.embed = embed;

    const finalComponents = interaction.message.components;
    await interaction.message.edit({
        embeds: [embed],
        components: finalComponents,
        allowedMentions: { parse: ['roles'] },
    });
}

module.exports = {
    buildLobbyEmbed,
    updateLobbyEmbed,
};
