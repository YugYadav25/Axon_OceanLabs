const ResumeCache = require('../models/ResumeSection');
const { buildPrompt } = require('../utils/promptBuilder');
const { formatResumeSection } = require('../utils/formatter');
const axios = require('axios');
const fs = require('fs');

// Read GitHub token from Docker secret
let GITHUB_TOKEN;
try {
  GITHUB_TOKEN = fs.readFileSync('/run/secrets/github_token', 'utf8').trim();
} catch (error) {
  // Fallback to environment variable for development
  GITHUB_TOKEN = process.env.GITHUB_TOKEN;
}

if (!GITHUB_TOKEN) {
  throw new Error('GITHUB_TOKEN not found. Required for personal branding feature.');
}

/**
 * Get user's GitHub contributions using GitHub API
 */
async function getGitHubContributions(repoUrl, username, startDate, endDate) {
  const cleanedUrl = repoUrl.replace(/\/$/, ''); // remove trailing slash
  const url = new URL(cleanedUrl);
  let [owner, repo] = url.pathname.slice(1).split('/');
  repo = repo.replace(/\.git$/, '');

  if (!owner || !repo) {
    throw new Error('Invalid GitHub repo URL. Expected format: https://github.com/{owner}/{repo}');
  }
  
  if (username === 'guest') {
    username = owner;
  }

  const headers = {
    'Authorization': `token ${GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json'
  };

  try {
    const commitsResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/commits`,
      {
        headers,
        params: { author: username, since: startDate, until: endDate, per_page: 100 }
      }
    );

    const prsResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/pulls`,
      {
        headers,
        params: { state: 'all', per_page: 100 }
      }
    );
    const pullRequestsFiltered = prsResponse.data.filter(pr => pr.user?.login?.toLowerCase() === username.toLowerCase());

    const issuesResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/issues`,
      {
        headers,
        params: { state: 'all', creator: username, per_page: 100 }
      }
    );

    const commitsWithStats = await Promise.all(
      commitsResponse.data.map(async (commit) => {
        try {
          const statsResponse = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/commits/${commit.sha}`,
            { headers }
          );
          return {
            sha: commit.sha,
            message: commit.commit.message,
            date: commit.commit.author.date,
            author: commit.commit.author.name,
            stats: statsResponse.data.stats,
            files: statsResponse.data.files?.map(f => f.filename) || []
          };
        } catch (error) {
          return {
            sha: commit.sha,
            message: commit.commit.message,
            date: commit.commit.author.date,
            author: commit.commit.author.name,
            stats: { additions: 0, deletions: 0, total: 0 },
            files: []
          };
        }
      })
    );

    return {
      commits: commitsWithStats,
      pullRequests: pullRequestsFiltered,
      issues: issuesResponse.data.filter(issue => !issue.pull_request),
      repoInfo: {
        name: repo,
        owner,
        fullName: `${owner}/${repo}`
      }
    };

  } catch (error) {
    console.error('GitHub API error:', error.response?.data || error.message);
    throw new Error(`Failed to fetch GitHub data: ${error.message}`);
  }
}

/**
 * Calculate metrics from GitHub API data
 */
function calculateMetrics(contributions) {
  const { commits, pullRequests, issues } = contributions;

  let totalAdded = 0, totalDeleted = 0;
  const dailyCount = {};
  const techCount = {};
  const prLinks = new Set();

  commits.forEach(commit => {
    totalAdded += commit.stats.additions || 0;
    totalDeleted += commit.stats.deletions || 0;

    const day = new Date(commit.date);
    day.setHours(0, 0, 0, 0);
    const key = day.toISOString().slice(0, 10);
    dailyCount[key] = (dailyCount[key] || 0) + 1;

    commit.files.forEach(file => {
      const ext = file.split('.').pop()?.toLowerCase();
      if (ext) {
        techCount[ext] = (techCount[ext] || 0) + 1;
      }
    });
  });

  pullRequests.forEach(pr => {
    prLinks.add(pr.html_url);
  });

  const totalTech = Object.values(techCount).reduce((a, b) => a + b, 0);
  const techDist = {};
  for (const [ext, cnt] of Object.entries(techCount)) {
    techDist[ext] = Math.round((cnt / totalTech) * 100);
  }

  const cycleTimes = pullRequests
    .filter(pr => pr.merged_at)
    .map(pr => {
      const created = new Date(pr.created_at);
      const merged = new Date(pr.merged_at);
      return (merged - created) / (1000 * 3600 * 24);
    });

  const avgCycle = cycleTimes.length
    ? (cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length).toFixed(1)
    : null;

  return {
    totalAdded,
    totalDeleted,
    commitsPerDay: dailyCount,
    techDistribution: techDist,
    prLinks: Array.from(prLinks),
    avgCycleTimeDays: avgCycle,
    totalPRs: pullRequests.length,
    totalIssues: issues.length,
    mergedPRs: pullRequests.filter(pr => pr.merged_at).length
  };
}

const User = require('../models/User');

/**
 * Helper function to get GitHub username from userId using MongoDB
 */
async function getGitHubUsername(userId) {
  try {
    const user = await User.findOne({ githubId: userId });

    if (!user) {
      // Fallback if user model doesn't exist but we already have the username as userId
      return userId;
    }

    const githubUsername = user.githubId || user.username;

    if (!githubUsername) {
      throw new Error('GitHub username not found in user profile.');
    }

    return githubUsername;

  } catch (error) {
    console.error('Error in getGitHubUsername:', error);
    throw new Error(`Failed to get GitHub username: ${error.message}`);
  }
}

/**
 * Fetch all contributors for a given repository
 */
async function getRepoContributors(repoUrl) {
  const cleanedUrl = repoUrl.replace(/\/$/, ''); // remove trailing slash
  const url = new URL(cleanedUrl);
  let [owner, repo] = url.pathname.slice(1).split('/');
  repo = repo.replace(/\.git$/, '');

  if (!owner || !repo) {
    throw new Error('Invalid GitHub repo URL. Expected format: https://github.com/{owner}/{repo}');
  }

  const headers = {
    'Authorization': `token ${GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json'
  };

  try {
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/contributors`,
      { headers, params: { per_page: 100 } }
    );
    return response.data;
  } catch (error) {
    console.error('GitHub API error (contributors):', error.response?.data || error.message);
    throw new Error(`Failed to fetch GitHub contributors: ${error.message}`);
  }
}



async function getContributionsAndMetrics({ repoUrl, userId, targetUsername, startDate, endDate }) {
  try {
    const username = targetUsername || await getGitHubUsername(userId);
    const contributions = await getGitHubContributions(repoUrl, username, startDate, endDate);
    const metrics = calculateMetrics(contributions);

    return { contributions, metrics };
  } catch (error) {
    console.error('Error in getContributionsAndMetrics:', error);
    throw error;
  }
}

/**
 * Main service: fetch GitHub contributions, compute metrics, call LLM, cache & format.
 */
async function createResumeSection({ repoUrl, repoId, userId, targetUsername, role, projectName, startDate, endDate }) {
  const resolvedUsername = targetUsername || userId; // fallback for cache key
  const cacheKey = `${resolvedUsername}:${repoId}`;

  const cached = await ResumeCache.findOne({ cacheKey });
  if (cached && (Date.now() - cached.updatedAt) < 60 * 60 * 1000) {
    return cached.sectionText;
  }

  try {
    const username = targetUsername || await getGitHubUsername(userId);

    const contributions = await getGitHubContributions(repoUrl, username, startDate, endDate);
    const metrics = calculateMetrics(contributions);

    const prompt = buildPrompt(contributions.commits, metrics, { role, projectName, startDate, endDate });

    const { data } = await axios.post(
      `${process.env.PYTHON_BACKEND_URL}/resume`,
      { prompt }
    );
    
    console.log(data);
   
    const bullets = data.bullets;
    
    const sectionText = formatResumeSection({ role, projectName, startDate, endDate, bullets });

    await ResumeCache.findOneAndUpdate(
      { cacheKey },
      { sectionText, updatedAt: Date.now() },
      { upsert: true }
    );

    return sectionText;

  } catch (error) {
    console.error('Error in createResumeSection:', error);
    throw error;
  }
}

module.exports = {
  createResumeSection,
  getContributionsAndMetrics,
  getRepoContributors
};
