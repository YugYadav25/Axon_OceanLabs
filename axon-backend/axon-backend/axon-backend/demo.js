require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Replace with a PR number from your test repo
const DEMO_OWNER = 'YugYadav25';
const DEMO_REPO  = 'axon-demo-repo';
const DEMO_PR_NUMBER = 1;

async function run() {
  console.log('Fetching PR from GitHub...');
  const prRes = await axios.get(
    `https://api.github.com/repos/${DEMO_OWNER}/${DEMO_REPO}/pulls/${DEMO_PR_NUMBER}`,
    { headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' } }
  );
  
  const webhookPayload = {
    action: 'opened',
    number: DEMO_PR_NUMBER,
    pull_request: prRes.data,
    repository: { full_name: `${DEMO_OWNER}/${DEMO_REPO}`, url: `https://api.github.com/repos/${DEMO_OWNER}/${DEMO_REPO}` }
  };

  console.log('Sending Webhook to Local Backend...');
  await axios.post(`${BACKEND_URL}/api/webhook/github`, webhookPayload, { headers: { 'Content-Type': 'application/json' } });
  
  console.log('Waiting for AI Review (20 seconds)...');
  await new Promise(r => setTimeout(r, 20000));

  const commentsRes = await axios.get(
    `https://api.github.com/repos/${DEMO_OWNER}/${DEMO_REPO}/issues/${DEMO_PR_NUMBER}/comments`,
    { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
  );
  
  const axonComment = commentsRes.data.find(c => c.body.includes('🤖 Axon Senior Developer Review'));
  if (axonComment) {
    console.log('\n✅ AXON REVIEW POSTED:\n' + axonComment.body);
  } else {
    console.log('⚠️ Comment not found. Check Node backend console for errors.');
  }
}
run().catch(e => console.error('Error:', e.message));
