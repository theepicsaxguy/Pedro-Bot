// utils/roleManager.js
const roleService = require('../services/settingsService');
const errorHandler = require('./errorHandler');

module.exports = {
  async assignRole(member, level) {
    try {
      const roleId = await roleService.getRoleByLevel(level);
      if (roleId) {
        await member.roles.add(roleId);
        console.log(`[✅] Assigned role ${roleId} to ${member.user.tag} for Level ${level}.`);
      }
    } catch (error) {
      errorHandler(error, 'Role Manager - assignRole');
    }
  },

  async removeRole(member, level) {
    try {
      const roleId = await roleService.getRoleByLevel(level);
      if (roleId) {
        await member.roles.remove(roleId);
        console.log(`[ℹ️] Removed role ${roleId} from ${member.user.tag} for Level ${level}.`);
      }
    } catch (error) {
      errorHandler(error, 'Role Manager - removeRole');
    }
  },
};
