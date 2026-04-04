/**
 * setup_pr_webhook.js
 * 
 * Automatically creates a GitHub webhook on your demo repo
 * pointing to your localtunnel URL.
 * 
 * Usage:
 *   node setup_pr_webhook.js <YOUR_LOCALTUNNEL_URL> <GITHUB_REPO>
 * 
 * Example:
 *   node setup_pr_webhook.js https://pink-chicken-beg.loca.lt YugYadav25/axon-demo-repo
 */

const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const tunnelUrl = process.argv[2];
const repoFullName = process.argv[3];

if (!tunnelUrl || !repoFullName) {
  console.error('\n❌  Usage: node setup_pr_webhook.js <TUNNEL_URL> <GITHUB_REPO>');
  console.error('   Example: node setup_pr_webhook.js https://pink-chicken-beg.loca.lt YugYadav25/axon-demo-repo\n');
  process.exit(1);
}

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
if (!GITHUB_TOKEN) {
  console.error('❌  GITHUB_TOKEN not found in .env file!');
  process.exit(1);
}

const webhookUrl = `${tunnelUrl.replace(/\/$/, '')}/api/webhook/github`;
const [owner, repo] = repoFullName.split('/');

const body = JSON.stringify({
  name: 'web',
  active: true,
  events: ['pull_request'],   // ONLY pull_request events — not push
  config: {
    url: webhookUrl,
    content_type: 'json',
    insecure_ssl: '0'
  }
});

const options = {
  hostname: 'api.github.com',
  path: `/repos/${owner}/${repo}/hooks`,
  method: 'POST',
  headers: {
    'Authorization': `token ${GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'User-Agent': 'Axon-Setup-Script'
  }
};

console.log(`\n🔗 Creating webhook on ${repoFullName}...`);
console.log(`   Payload URL: ${webhookUrl}`);
console.log(`   Events: pull_request\n`);

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const parsed = JSON.parse(data);
    if (res.statusCode === 201) {
      console.log('✅  Webhook created successfully!');
      console.log(`   Webhook ID: ${parsed.id}`);
      console.log('\n🎯  Next steps:');
      console.log('   1. Go to your test repo on GitHub');
      console.log('   2. Open a Pull Request (or close & reopen an existing one)');
      console.log('   3. Watch Axon automatically post a review comment on the PR!\n');
    } else if (res.statusCode === 422 && parsed.errors?.[0]?.message?.includes('already exists')) {
      console.log('⚠️   A webhook already exists on this repo.');
      console.log('     Delete the old one in GitHub Settings → Webhooks and run this script again.\n');
    } else {
      console.error('❌  Failed to create webhook. GitHub response:');
      console.error(JSON.stringify(parsed, null, 2));
    }
  });
});

req.on('error', (err) => {
  console.error('❌  Network error:', err.message);
});

req.write(body);
req.end();
