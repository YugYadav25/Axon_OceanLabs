const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OnboardingSessionSchema = new Schema({
  user_id: { type: String, required: true },
  repo_id: { type: String, required: true },
  flow: { type: Schema.Types.Mixed }
}, { timestamps: true });

// Enforce one active session per user per repo
OnboardingSessionSchema.index({ user_id: 1, repo_id: 1 }, { unique: true });

module.exports = mongoose.model('OnboardingSession', OnboardingSessionSchema);
