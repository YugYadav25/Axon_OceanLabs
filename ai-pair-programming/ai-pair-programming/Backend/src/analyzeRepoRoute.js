const express = require('express');
const { spawn } = require('child_process');
const router = express.Router();

function analyzeGithubRepo(repoUrl, localDir, geminiApiKey, githubToken) {
  return new Promise((resolve, reject) => {
    const args = [
      'src/github_ai_assistant.py',
      repoUrl,
      localDir,
      geminiApiKey,
    ];
    if (githubToken) args.push(githubToken);

    const py = spawn('python', args);

    let data = '';
    let error = '';

    py.stdout.on('data', (chunk) => { data += chunk.toString(); });
    py.stderr.on('data', (chunk) => { error += chunk.toString(); });

    py.on('close', (code) => {
      if (code === 0) {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject('Failed to parse Python output: ' + data);
        }
      } else {
        reject(error || 'Python script exited with code ' + code);
      }
    });
  });
}

router.post('/api/analyze-repo', async (req, res) => {
    console.log('Received request to analyze repo:', req.body);
  const { repoUrl, githubToken } = req.body;
  const localDir = '/tmp/repo_clone_' + Date.now();
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!repoUrl || !geminiApiKey) {
    return res.status(400).json({ success: false, error: 'Missing repoUrl or Gemini API key' });
  }

  try {
    const result = await analyzeGithubRepo(repoUrl, localDir, geminiApiKey, githubToken);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err });
  }
});

module.exports = router;
