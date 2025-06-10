// commands/admin/backup.command.js
const { SlashCommandBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const errorHandler = require('../../utils/errorHandler');
const adminLogService = require('../../services/adminLogService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('backup')
    .setDescription('Create or restore a database backup')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    .addSubcommand(sub =>
      sub.setName('create').setDescription('Create a backup'))
    .addSubcommand(sub =>
      sub.setName('restore')
        .setDescription('Restore from uploaded backup')
        .addAttachmentOption(opt =>
          opt.setName('file')
            .setDescription('Backup JSON file')
            .setRequired(true))),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      if (sub === 'create') {
        const collections = await mongoose.connection.db.collections();
        const data = {};
        for (const col of collections) {
          const docs = await col.find({}).toArray();
          data[col.collectionName] = docs;
        }
        const filePath = path.join('/tmp', `backup-${Date.now()}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        await interaction.user.send({ files: [filePath] });
        await interaction.editReply('✅ Backup created and sent to your DM.');
        await adminLogService.logAction(interaction.user.id, 'backup create', { file: filePath });
      } else if (sub === 'restore') {
        const attachment = interaction.options.getAttachment('file');
        if (!attachment) {
          await interaction.editReply('❌ Please attach a backup file.');
          return;
        }
        const res = await fetch(attachment.url);
        const json = await res.json();
        for (const [name, docs] of Object.entries(json)) {
          const col = mongoose.connection.db.collection(name);
          await col.deleteMany({});
          if (docs.length) await col.insertMany(docs);
        }
        await interaction.editReply('✅ Backup restored.');
        await adminLogService.logAction(interaction.user.id, 'backup restore', {});
      }
    } catch (error) {
      errorHandler(error, 'Backup Command - execute');
      await interaction.editReply('❌ Backup operation failed.');
    }
  },
};
