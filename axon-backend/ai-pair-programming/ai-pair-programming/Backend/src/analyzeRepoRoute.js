const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const router = express.Router();

// Initialize MongoDB connection for the Pair Programming backend
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/axon';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB (Axon Database) for Code Context'))
  .catch(err => console.error('MongoDB connection error:', err));

// Match the primary schema used by Axon
const OnboardingOverviewSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  repo_id: { type: String, required: true },
  role: { type: String, required: true },
  html: { type: String, required: true }
}, { timestamps: true });

const OnboardingOverview = mongoose.models.OnboardingOverview || mongoose.model('OnboardingOverview', OnboardingOverviewSchema);

router.post('/api/analyze-repo', async (req, res) => {
  console.log('Received request to extract repo context:', req.body);
  const { repoUrl } = req.body;
  const llmApiUrl = process.env.LLM_API_URL || 'https://api-inference.huggingface.co/models/Qwen/Qwen2.5-72B-Instruct/v1/chat/completions';
  const llmApiToken = process.env.LLM_API_TOKEN;

  if (!repoUrl) {
    return res.status(400).json({ success: false, error: 'Missing repoUrl' });
  }

  try {
    // Extract the repo_id slug from the repoUrl (e.g., https://github.com/JINAY2910/Qyra -> JINAY2910/Qyra)
    let repoSlug = repoUrl.replace('https://github.com/', '').replace('.git', '');
    if (repoSlug.endsWith('/')) {
        repoSlug = repoSlug.slice(0, -1);
    }
    console.log('Searching MongoDB for repo slug:', repoSlug);

    // Find the latest OnboardingOverview for this repo (ignoring user_id to easily share the AI context)
    const overview = await OnboardingOverview.findOne({ repo_id: repoSlug }).sort({ createdAt: -1 });

    if (!overview || !overview.html) {
      return res.status(404).json({
        success: false,
        error: `No existing generated summary found for ${repoSlug}. Please run the primary Axon Onboarding Architecture pipeline first.`
      });
    }

    // Convert HTML to clean markdown for Gitzy UI
    let markdown = overview.html
      // Remove head and styles
      .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      // Convert headers
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
      // Convert bullets
      .replace(/<li[^>]*>/gi, '- ')
      .replace(/<\/li>/gi, '\n')
      // Convert bold
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
      // Convert code snippets
      .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
      // Strip remaining tags
      .replace(/<[^>]*>?/gm, '')
      // Decode HTML entities
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      // Remove extra newlines
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // Call HuggingFace to convert to detailed architecture
    let advancedContext = markdown;
    
    if (llmApiToken) {
        console.log('Contacting LLM to generate advanced architecture context...');
        try {
            const prompt = `You are an expert software architect. Analyze the provided repository architecture overview. Generate a highly detailed Markdown analysis including:
1. Project Summary & Goals
2. Proposed Solution
3. A visually appealing Mermaid.js Chart representing the System Architecture
4. Key Highlights using bullet points. Be specific about this repository.

Repository Data:
${markdown}`;
            
            const hfResponse = await axios.post(llmApiUrl, {
                model: "Qwen/Qwen2.5-72B-Instruct",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 2500,
                temperature: 0.3
            }, {
                headers: {
                    'Authorization': `Bearer ${llmApiToken}`,
                    'Content-Type': 'application/json'
                },
                timeout: 120000 // 2 minute timeout for generation
            });

            const data = hfResponse.data;
            if (data.choices && data.choices.length > 0) {
                advancedContext = data.choices[0].message.content;
            } else if (Array.isArray(data) && data[0].generated_text) {
                advancedContext = data[0].generated_text;
            }
        } catch (llmErr) {
            console.error('LLM generation failed, falling back to basic DB context:', llmErr.message);
        }
    }

    // Package results identically to the old python format so frontend requires 0 changes
    const result = {
      results: [
        {
          files: ['Advanced Architecture Analysis'],
          ai_response: { text: advancedContext }
        }
      ]
    };

    res.json({ success: true, result });
  } catch (err) {
    console.error('Error querying MongoDB for repo overview:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
