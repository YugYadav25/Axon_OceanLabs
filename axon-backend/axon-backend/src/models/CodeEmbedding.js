const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CodeEmbeddingSchema = new Schema({
  repo_id: { type: String, required: true },
  type: { type: String, required: true }, // e.g. 'node', 'commit'
  ref_id: { type: String, required: true }, // e.g. nodeId, sha
  embedding: { type: [Number], required: true },
  metadata: { type: Schema.Types.Mixed },
  module: { type: String },
  file_path: { type: String }
}, { timestamps: true });

// Ensure unique index for (repo_id, type, ref_id)
CodeEmbeddingSchema.index({ repo_id: 1, type: 1, ref_id: 1 }, { unique: true });

module.exports = mongoose.model('CodeEmbedding', CodeEmbeddingSchema);
