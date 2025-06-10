const mongoose = require('../utils/database');

const adminLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  userId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  details: { type: Object, default: {} },
}, {
  versionKey: false,
});

module.exports = mongoose.model('AdminLog', adminLogSchema);
