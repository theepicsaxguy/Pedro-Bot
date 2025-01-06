// commands/levels/levelUtils.js

/**
 * For example: xp needed = 100 * (level^2).
 * Feel free to adjust to taste.
 */
function xpRequiredForLevel(level) {
    return 100 * (level ** 3);
  }
  
  /**
   * Given total XP, figure out which level the user is on.
   * This loops from 1 upward until the next level is too large.
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
  