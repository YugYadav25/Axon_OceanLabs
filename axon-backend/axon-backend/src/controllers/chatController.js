const express = require('express');
const { answerQuestion } = require('../services/chatService');
const ChatLog = require('../models/ChatLog');

const router = express.Router();

// POST /api/chat/ask
router.post('/ask', async (req, res) => {
  try {
    const { repoId, userId, question } = req.body;
    const answer = await answerQuestion(repoId, userId, question);
    return res.status(200).json({ success: true, answer });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/chat/logs/:repoId
router.get('/logs/:repoId', async (req, res) => {
  try {
    const { repoId } = req.params;
    const data = await ChatLog.find({ repo_id: repoId })
      .sort({ createdAt: -1 })
      .limit(50);
    return res.status(200).json({ success: true, logs: data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
