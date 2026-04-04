const { createResumeSection, getContributionsAndMetrics, getRepoContributors  } = require('../services/personalBrandingService');

/**
 * Controller: orchestrates fetching contributions, computing metrics,
 * generating AI bullets, formatting section, and responding.
 */
async function generateResumeSection(req, res) {
  try {
    const { repoUrl, repoId, userId, targetUsername, role, projectName, startDate, endDate } = req.body;
    if (!repoUrl || !repoId || (!userId && !targetUsername)) {
      return res.status(400).json({ error: 'repoUrl, repoId and userId/targetUsername are required' });
    }

    const sectionText = await createResumeSection({ repoUrl, repoId, userId, targetUsername, role, projectName, startDate, endDate });
    return res.status(200).json({ resumeSection: sectionText });
  } catch (err) {
    console.error('Error in generateResumeSection:', err);
    return res.status(500).json({ error: 'Failed to generate resume section' });
  }
}

async function getGitHubInsights(req, res) {
  try {
    const { repoUrl, userId, targetUsername, startDate, endDate } = req.body;
    if (!repoUrl || (!userId && !targetUsername)) {
      return res.status(400).json({ error: 'repoUrl and userId/targetUsername are required' });
    }

    const { contributions, metrics } = await getContributionsAndMetrics({ repoUrl, userId, targetUsername, startDate, endDate });
    return res.status(200).json({ contributions, metrics });
  } catch (err) {
    console.error('Error in getGitHubInsights:', err);
    return res.status(500).json({ error: 'Failed to fetch GitHub insights' });
  }
}

async function getContributors(req, res) {
  try {
    const { repoUrl } = req.body;
    if (!repoUrl) {
      return res.status(400).json({ error: 'repoUrl is required' });
    }
    const contributors = await getRepoContributors(repoUrl);
    return res.status(200).json({ contributors });
  } catch (err) {
    console.error('Error in getContributors:', err);
    return res.status(500).json({ error: 'Failed to fetch contributors' });
  }
}

module.exports = {
  generateResumeSection,
  getGitHubInsights,
  getContributors
};