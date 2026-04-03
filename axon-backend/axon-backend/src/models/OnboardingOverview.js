const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OnboardingOverviewSchema = new Schema({
  user_id: { type: String, required: true },
  repo_id: { type: String, required: true },
  role: { type: String, required: true },
  html: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('OnboardingOverview', OnboardingOverviewSchema);
