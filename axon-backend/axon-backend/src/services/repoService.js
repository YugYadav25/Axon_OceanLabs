// src/services/repoService.js
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { ensureRepoAvailable } = require('./gitService');

async function getRepoStructure(repoId) {
  const repoPath = await ensureRepoAvailable(repoId);
  const structure = [];

  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        structure.push({
          module: path.relative(repoPath, full),
          desc: `Contains ${entry.name}`
        });
        await walk(full);
      }
    }
  }

  await walk(repoPath);
  return structure;
}

module.exports = { getRepoStructure };
