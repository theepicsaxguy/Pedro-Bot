const mongoose = require('../utils/database');

const auditLogSchema = new mongoose.Schema({
  adminId: { type: String, required: true },
  action: { type: String, required: true },
  details: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now },
}, {
  versionKey: false,
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
