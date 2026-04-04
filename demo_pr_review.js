/**
 * demo_pr_review.js
 * 
 * Simulates a GitHub PR webhook locally and triggers Axon's AI review.
 * This lets you demo the PR Review feature WITHOUT needing localtunnel
 * or GitHub webhook configuration.
 * 
 * Usage:
 *   node demo_pr_review.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// ─── CONFIGURE YOUR DEMO REPO HERE ────────────────────────────────────────────
const DEMO_OWNER = 'YugYadav25';
const DEMO_REPO  = 'axon-demo-repo';
const DEMO_PR_NUMBER = 1;  // Change this to your actual PR number
// ──────────────────────────────────────────────────────────────────────────────

async function run() {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║   🤖 Axon PR Review Agent — Live Demo        ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  // Step 1: Fetch real PR data from GitHub API
  console.log(`📡 Fetching PR #${DEMO_PR_NUMBER} from ${DEMO_OWNER}/${DEMO_REPO}...`);
  let prData;
  try {
    const prRes = await axios.get(
      `https://api.github.com/repos/${DEMO_OWNER}/${DEMO_REPO}/pulls/${DEMO_PR_NUMBER}`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Axon-Demo-Script'
        }
      }
    );
    prData = prRes.data;
    console.log(`✅ Found PR: "${prData.title}"`);
    console.log(`   Changed files: ${prData.changed_files}, Additions: ${prData.additions}, Deletions: ${prData.deletions}\n`);
  } catch (err) {
    console.error(`❌ Could not fetch PR from GitHub: ${err.response?.data?.message || err.message}`);
    console.error('   Make sure GITHUB_TOKEN is set in .env and the PR number is correct.');
    process.exit(1);
  }

  // Step 2: Construct the webhook payload GitHub would have sent
  const webhookPayload = {
    action: 'opened',
    number: DEMO_PR_NUMBER,
    pull_request: {
      url: prData.url,
      number: DEMO_PR_NUMBER,
      title: prData.title,
      head: { sha: prData.head.sha },
      base: { sha: prData.base.sha }
    },
    repository: {
      full_name: `${DEMO_OWNER}/${DEMO_REPO}`,
      url: `https://api.github.com/repos/${DEMO_OWNER}/${DEMO_REPO}`
    }
  };

  // Step 3: Send it to Axon's webhook endpoint (running locally)
  console.log(`🚀 Sending PR payload to Axon backend (${BACKEND_URL})...`);
  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/webhook/github`,
      webhookPayload,
      { headers: { 'Content-Type': 'application/json' } }
    );
    console.log(`✅ Axon received the payload: "${response.data}"`);
  } catch (err) {
    console.error(`❌ Failed to reach Axon backend: ${err.message}`);
    console.error('   Make sure the backend is running on port 3000 (run ./start_all.ps1 first).');
    process.exit(1);
  }

  // Step 4: Poll the PR for the new comment (wait up to 30s)
  console.log('\n⏳ Waiting for Axon AI to analyze and post review (up to 30 seconds)...\n');
  const deadline = Date.now() + 30000;
  let found = false;

  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 4000)); // poll every 4 seconds

    const commentsRes = await axios.get(
      `https://api.github.com/repos/${DEMO_OWNER}/${DEMO_REPO}/issues/${DEMO_PR_NUMBER}/comments`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          'User-Agent': 'Axon-Demo-Script'
        }
      }
    );
    const axonComment = commentsRes.data.find(c => c.body.includes('🤖 Axon Senior Developer Review'));
    if (axonComment) {
      found = true;
      console.log('╔══════════════════════════════════════════════╗');
      console.log('║   ✅ AXON REVIEW POSTED ON GITHUB!            ║');
      console.log('╚══════════════════════════════════════════════╝\n');
      console.log('─'.repeat(50));
      console.log(axonComment.body);
      console.log('─'.repeat(50));
      console.log(`\n🔗 View it live: https://github.com/${DEMO_OWNER}/${DEMO_REPO}/pull/${DEMO_PR_NUMBER}\n`);
      break;
    } else {
      process.stdout.write('.');
    }
  }

  if (!found) {
    console.log('\n⚠️  Comment not found yet. Check the backend terminal for errors.');
    console.log(`   You can view the PR manually: https://github.com/${DEMO_OWNER}/${DEMO_REPO}/pull/${DEMO_PR_NUMBER}\n`);
  }
}

run().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
