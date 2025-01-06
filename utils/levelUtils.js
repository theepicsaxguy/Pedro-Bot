// commands/levels/levelUtils.js

/**
 * Calculate the XP required for a given level.
 * Example formula: 100 * (level^3)
 * @param {Number} level - The target level.
 * @returns {Number}
 */

function xpRequiredForLevel(level) {
  return 50* (level ** 2);
}
/**
 * Calculate the current level based on total XP.
 * Loops from level 0 upwards until the required XP exceeds total XP.
 * @param {Number} xp - The total XP.
 * @returns {Number}
 */
function calculateLevelFromXP(xp) {
  let lvl = 0;
  while (xp >= xpRequiredForLevel(lvl + 1)) {
    lvl++;
  }
  return lvl;
}

module.exports = {
  xpRequiredForLevel,
  calculateLevelFromXP,
};
