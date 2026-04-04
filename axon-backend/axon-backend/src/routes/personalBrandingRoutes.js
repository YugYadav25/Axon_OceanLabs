const express = require('express');
const {
  generateResumeSection,
  getGitHubInsights,
  getContributors
} = require('../controllers/personalBrandingController');

const router = express.Router();

router.post('/resume-section', generateResumeSection);
router.post('/github-insights', getGitHubInsights);
router.post('/contributors', getContributors);

module.exports = router;
