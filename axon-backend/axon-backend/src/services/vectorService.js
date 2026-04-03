require('dotenv').config();
const axios = require('axios');
const CodeEmbedding = require('../models/CodeEmbedding');

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL;
const EMBED_ENDPOINT = `${PYTHON_BACKEND_URL}/embed`;

// 1) Call Python backend to embed a piece of text
async function embedText(text) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    throw new Error('Invalid input: Text must be a non-empty string');
  }

  try {
    const response = await axios.post(
      EMBED_ENDPOINT,
      { text },
      { headers: { 'Content-Type': 'application/json' } }
    );
    if (!response.data || !Array.isArray(response.data.embedding)) {
      throw new Error('Unexpected response format from embedding API');
    }
    return response.data.embedding;
  } catch (error) {
    console.error('Python embedding API error:', error?.response?.data || error.message);
    throw new Error('Failed to generate embedding');
  }
}

// 2) Upsert embedding into MongoDB
async function upsertCodeEmbedding(repoId, type, refId, textToEmbed, metadata) {
  try {
    const embedding = await embedText(textToEmbed);

    const row = {
      repo_id: repoId,
      type,
      ref_id: refId,
      embedding,
      metadata,
      module: metadata.module?.replace(/\\/g, '/'),
      file_path: metadata.filePath?.replace(/\\/g, '/'),
    };

    const data = await CodeEmbedding.findOneAndUpdate(
      { repo_id: repoId, type, ref_id: refId },
      { $set: row },
      { upsert: true, new: true }
    );
    return data;
  } catch (err) {
    console.error('Embedding or upsert failed:', err.message);
    return null;
  }
}

// 3) Calculate cosine similarity manually
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// 4) Semantic search in-memory to support default MongoDB without Atlas vector search
async function searchEmbeddings(repoId, query, type, k = 5) {
  try {
    const queryEmbedding = await embedText(query);
    
    const allDocs = await CodeEmbedding.find({ repo_id: repoId, type });
    
    const results = allDocs.map(doc => {
      const similarity = cosineSimilarity(queryEmbedding, doc.embedding);
      return { doc, similarity };
    });

    results.sort((a, b) => b.similarity - a.similarity);
    const topK = results.slice(0, k).map(item => item.doc);
    return topK;
  } catch (err) {
    console.error('Semantic search failed:', err.message);
    return [];
  }
}

module.exports = { embedText, upsertCodeEmbedding, searchEmbeddings };