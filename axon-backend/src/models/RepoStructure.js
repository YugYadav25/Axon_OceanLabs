const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RepoStructureSchema = new Schema({
  repo_id: { type: String, required: true, unique: true },
  structure: { type: Schema.Types.Mixed }
}, { timestamps: true });

module.exports = mongoose.model('RepoStructure', RepoStructureSchema);
