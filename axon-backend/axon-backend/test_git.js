const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs');

async function testGit() {
  const repoId = 'expressjs/express';
  const repoRoot = path.join(require('os').tmpdir(), 'axon', repoId);
  console.log('Target path:', repoRoot);
  
  // ensure parent directories exist
  fs.mkdirSync(path.dirname(repoRoot), { recursive: true });

  const git = simpleGit();
  console.log('Cloning...');
  await git.clone('https://github.com/expressjs/express', repoRoot);
  console.log('Done cloning!');
}

testGit().catch(console.error);
