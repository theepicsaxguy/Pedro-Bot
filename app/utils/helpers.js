// utils/helpers.js

const { EmbedBuilder } = require('discord.js');
const ButtonManager = require('./ButtonManager');

/**
 * Build or rebuild a lobby embed in one place.
 * We read all the fields from the provided lobbyData
 * to maintain a single source of truth for embed structure.
 */
function buildLobbyEmbed(lobbyData) {
  // Title = Game code
  // Using the field data from lobbyData to ensure consistency
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

Cc: @Matchmaking
`)
    .setColor(0x00AE86);
}

/**
 * Update an existing lobby message with new embed data.
 * We rebuild the embed from the latest lobbyData, then edit the message.
 */
async function updateLobbyEmbed(interaction, lobbyData, components = []) {
  // Rebuild the embed via our single helper
  const embed = buildLobbyEmbed(lobbyData);
  lobbyData.embed = embed;

  // Reuse existing buttons if none are provided
  const finalComponents = components.length > 0 ? components : interaction.message.components;

  if (interaction.message) {
    await interaction.message.edit({ embeds: [embed], components: finalComponents });
  }
}

/**
 * Optional: If you still need a function specifically to update the title,
 * you can do it here, but typically buildLobbyEmbed() is enough.
 */
async function updateLobbyStatus(interaction, lobbyData, title) {
  // You could do something with the title, or just rely on buildLobbyEmbed again.
  lobbyData.gameCode = title; // for example, if we want to rename the "gameCode" to the new title
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
