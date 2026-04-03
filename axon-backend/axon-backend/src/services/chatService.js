const NodeModel = require('../models/Node');
const CommitModel = require('../models/Commit');
const ChatLog = require('../models/ChatLog');
const { searchEmbeddings } = require('./vectorService');
const axios = require('axios');
const fs = require('fs');

async function answerQuestion(repoId, userId, question) {
  // 1) Semantic search for relevant nodes & commits
  let nodeMatches = [];
  let commitMatches = [];
  try {
    nodeMatches = await searchEmbeddings(repoId, question, 'node', 3);
    commitMatches = await searchEmbeddings(repoId, question, 'commit', 2);
  } catch (err) {
    console.warn('Embedding search failed (continuing without context):', err.message);
  }

  // 2) Build context snippets — safely skip if file is missing
  const contexts = [];
  for (const m of nodeMatches) {
    try {
      const n = await NodeModel.findOne({ nodeId: m.ref_id });
      if (n && n.filePath && fs.existsSync(n.filePath)) {
        const lines = fs.readFileSync(n.filePath, 'utf-8').split('\n');
        const snippet = lines.slice(Math.max(0, n.startLine - 1), n.endLine).join('\n');
        const nodeType = n.type === 'class' ? 'Class' : 'Function';
        contexts.push(`${nodeType} "${n.name}":\n${snippet}`);
      }
    } catch (e) {
      console.warn('Skipping node context:', e.message);
    }
  }
  for (const m of commitMatches) {
    try {
      const c = await CommitModel.findOne({ sha: m.ref_id });
      if (c) contexts.push(`Commit ${c.sha} by ${c.author}: ${c.message}`);
    } catch (e) {
      console.warn('Skipping commit context:', e.message);
    }
  }

  // 3) Build prompt
  const contextBlock = contexts.length > 0
    ? contexts.map(c => `---\n${c}`).join('\n\n')
    : 'No specific code context found — answer based on general knowledge.';

  const prompt = `<s>[INST] You are an expert AI code mentor helping developers understand a software repository.

Repository: ${repoId}

Relevant code context:
${contextBlock}

Question: ${question}

Please give a clear, concise answer. If you reference functions or files, name them explicitly. [/INST]`;

  // 4) Call LLM
  const llmUrl = process.env.LLM_API_URL;
  const llmToken = process.env.LLM_API_TOKEN;

  if (!llmUrl || llmUrl.includes('your-chosen-model')) {
    throw new Error('LLM_API_URL is not configured in your .env file. Please set it to a valid HuggingFace model endpoint.');
  }

  let answerText;
  try {
    const llmRes = await axios.post(
      llmUrl,
      {
        model: 'Qwen/Qwen2.5-72B-Instruct',
        messages: [
          {
            role: 'system',
            content: `You are an expert AI code mentor. Repository: ${repoId}. Answer questions about the codebase clearly and concisely.`,
          },
          {
            role: 'user',
            content: `Context:\n${contextBlock}\n\nQuestion: ${question}`,
          },
        ],
        max_tokens: 400,
        temperature: 0.4,
      },
      {
        headers: {
          Authorization: `Bearer ${llmToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    );

    const data = llmRes.data;
    // OpenAI-compatible response shape
    if (data?.choices?.[0]?.message?.content) {
      answerText = data.choices[0].message.content.trim();
    } else if (Array.isArray(data) && data[0]?.generated_text) {
      answerText = data[0].generated_text.trim();
    } else if (typeof data === 'string') {
      answerText = data.trim();
    } else {
      answerText = JSON.stringify(data);
    }
  } catch (err) {
    const hfError = err?.response?.data?.error || err?.response?.data?.message || err.message;
    console.error('LLM API error:', hfError);
    throw new Error(`LLM call failed: ${hfError}`);
  }

  // 5) Save to MongoDB (non-blocking)
  ChatLog.create({ repo_id: repoId, user_id: userId, question, answer: answerText })
    .catch(e => console.error('ChatLog save error:', e.message));

  return answerText;
}

module.exports = { answerQuestion };
