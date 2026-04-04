const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  githubId: { type: String, required: true, unique: true },
  username: { type: String },
  email: { type: String },
  avatarUrl: { type: String },
  accessToken: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
