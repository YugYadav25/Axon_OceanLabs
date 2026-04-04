// src/services/prReviewService.js
const axios = require('axios');
const NodeModel = require('../models/Node');
const Repo = require('../models/Repo');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const LLM_API_URL = process.env.LLM_API_URL;
const LLM_API_TOKEN = process.env.LLM_API_TOKEN;

async function handlePRReview(payload, io) {
  try {
    // Only process "opened" or "synchronize" (updated) PR events
    if (payload.action !== 'opened' && payload.action !== 'synchronize') {
      return;
    }

    const prUrl = payload.pull_request.url; // e.g. https://api.github.com/repos/org/repo/pulls/1
    const repoFullName = payload.repository.full_name;
    const prNumber = payload.pull_request.number;

    console.log(`[PR Review] Received PR #${prNumber} for ${repoFullName}`);

    // 1. Fetch the diff from GitHub
    const diffResponse = await axios.get(prUrl, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3.diff'
      }
    });
    const diffText = diffResponse.data;

    // 2. Try to find if we have this repo scanned in Axon
    // e.g. "anthropics__claude-code"
    const parsedRepoId = repoFullName.replace(/\//g, '__');
    const nodes = await NodeModel.find({ repoId: parsedRepoId });
    
    // We try to find context: file names mentioned in the diff
    // Extract changed files heuristically from diff (lines starting with '+++ b/')
    const changedFiles = [];
    const diffLines = diffText.split('\n');
    for (const line of diffLines) {
      if (line.startsWith('+++ b/')) {
        changedFiles.push(line.replace('+++ b/', ''));
      }
    }

    // Filter nodes that belong to the changed files
    const contextNodes = nodes.filter(n => changedFiles.some(f => n.filePath.endsWith(f)));
    
    let contextStr = '';
    if (contextNodes.length > 0) {
      const hotspots = contextNodes.filter(n => parseInt(n.complexity) > 10 || n.invokesAPI || n.invokesDBQuery || n.httpEndpoint);
      if (hotspots.length > 0) {
        contextStr = 'CRITICAL CONTEXT FROM AXON KNOWLEDGE GRAPH:\n';
        contextStr += 'The following modified functions are known Hotspots in the architecture:\n';
        for (const h of hotspots) {
          contextStr += `- ${h.name} (File: ${h.filePath}): Complexity Score = ${h.complexity || 'N/A'}. `;
          if (h.invokesDBQuery) contextStr += 'WARNING: Invokes Database. ';
          if (h.invokesAPI) contextStr += 'WARNING: Calls external API. ';
          contextStr += '\n';
        }
      }
    } else {
      contextStr = 'Axon Graph: No specific hotspots detected in the modified files.\n';
    }

    // 3. Construct the prompt for the AI
    const prompt = `
You are Axon, a Senior Developer acting as an automated PR reviewer.
Review the following Git Diffs. Make your review concise, constructive, and use markdown.
Highlight any security risks, logic bugs, or code quality issues.
Never output any xml tags.

${contextStr}

DIFF TO REVIEW:
\`\`\`diff
${diffText.substring(0, 4000)} // Truncate to safely fit context window
\`\`\`
`.trim();

    // 4. Generate Review via LLM
    const llmResponse = await axios.post(
      LLM_API_URL,
      {
        model: 'google/gemma-3-27b-it',  // Fast, free HuggingFace model via router
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800
      },
      {
        headers: {
          'Authorization': `Bearer ${LLM_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const reviewText = llmResponse.data?.choices?.[0]?.message?.content
      || 'Axon was unable to generate a review for this PR. Please check LLM configuration.';

    // 5. Post comment back to GitHub PR
    // We use /issues/:number/comments because /pulls/:number/reviews requires a commit_id
    const reviewBody = `### 🤖 Axon Senior Developer Review\n\n${reviewText}`;
    const commentsUrl = `https://api.github.com/repos/${repoFullName}/issues/${prNumber}/comments`;
    
    await axios.post(
      commentsUrl,
      { body: reviewBody },
      {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Axon-PR-Agent'
        }
      }
    );
    console.log(`[PR Review] ✅ Successfully posted review to PR #${prNumber} on ${repoFullName}`);

    // --- REAL-TIME WEBSOCKET NOTIFICATION ---
    if (io) {
      console.log(`[WebSocket] Broadcasting PR review to frontend clients...`);
      io.emit('pr_reviewed', {
        repo: repoFullName,
        prNumber: prNumber,
        title: payload.pull_request?.title || `PR #${prNumber}`,
        reviewMarkdown: reviewText
      });
    }

  } catch (err) {
    console.error('[PR Review] Error handling PR webhook:', err.message);
  }
}

module.exports = { handlePRReview };
