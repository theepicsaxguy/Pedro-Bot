// models/Schedule.js
const mongoose = require('../utils/database');

const scheduleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // Unique name for the schedule
  commandName: { type: String, required: true },        // Name of the command to execute
  args: { type: Object, default: {} },                  // Arguments for the command
  frequency: { type: String, required: true },          // Cron expression or interval (e.g., '0 * * * *' for hourly)
  nextRun: { type: Date },                               // Next scheduled run time
  createdAt: { type: Date, default: Date.now },         // Creation timestamp
  updatedAt: { type: Date, default: Date.now },         // Last update timestamp
}, {
  versionKey: false,
});

module.exports = mongoose.model('Schedule', scheduleSchema);
