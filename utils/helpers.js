// utils/helpers.js
const { EmbedBuilder } = require('discord.js');
const ButtonManager = require('./ButtonManager');

// NEW: If you prefer to mention the role by ID, set it here
const MATCHMAKING_ROLE_ID = process.env.MATCHMAKING_ROLE_ID || null;

/**
 * Build or rebuild a lobby embed in one place.
 */
function buildLobbyEmbed(lobbyData) {
  // Title = Game code
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

/**
 * Update an existing lobby message with new embed data.
 */
async function updateLobbyEmbed(interaction, lobbyData, components = []) {
  const embed = buildLobbyEmbed(lobbyData);
  lobbyData.embed = embed;

  const finalComponents = components.length > 0 ? components : interaction.message.components;
  if (interaction.message) {
    await interaction.message.edit({ embeds: [embed], components: finalComponents });
  }
}

/**
 * Optional function for updating the lobby status, but typically buildLobbyEmbed is enough.
 */
async function updateLobbyStatus(interaction, lobbyData, title) {
  lobbyData.gameCode = title;
  const embed = buildLobbyEmbed(lobbyData);
  lobbyData.embed = embed;

  const components = [
    ButtonManager.createButtonRow(['join', 'leave']),
  ];

  await interaction.message.edit({ embeds: [embed], components });
}

module.exports = {
  buildLobbyEmbed,
  updateLobbyEmbed,
  updateLobbyStatus,
};
