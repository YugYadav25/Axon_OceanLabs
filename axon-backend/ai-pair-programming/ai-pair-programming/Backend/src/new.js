const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const axios = require("axios");
const mongoose = require("mongoose");
require("dotenv").config();
const analyzeRepoRouter = require('./analyzeRepoRoute');

// Define OnboardingOverview Schema for Chat Context
const OnboardingOverviewSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  repo_id: { type: String, required: true },
  role: { type: String, required: true },
  html: { type: String, required: true }
}, { timestamps: true });
const OnboardingOverview = mongoose.models.OnboardingOverview || mongoose.model('OnboardingOverview', OnboardingOverviewSchema);
// Use HuggingFace API through environment variables
const llmUrl = process.env.LLM_API_URL || 'https://api-inference.huggingface.co/models/Qwen/Qwen2.5-72B-Instruct/v1/chat/completions';
const llmToken = process.env.LLM_API_TOKEN;

// Initialize Express and Middleware
const app = express();
app.use(cors());
app.use(express.json());
app.use(analyzeRepoRouter);

// Health check endpoint
app.get("/", (req, res) => {
  res.send("AI Assistant Backend is running with Gemini");
});

// Gemini AI Assistant Endpoint — Gitzy (repo-aware)
app.post('/api/chat', async (req, res) => {
  const { message, codeMentions, repoUrl, transcript } = req.body;

  // Build contextual system prompt
  let systemContext = 'You are Gitzy, an expert AI pair programming assistant. Help developers understand code, debug issues, and learn best practices. Be concise and specific.';
  
  if (repoUrl) {
    let repoSlug = repoUrl.replace('https://github.com/', '').replace('.git', '');
    if (repoSlug.endsWith('/')) repoSlug = repoSlug.slice(0, -1);
    
    systemContext += ` You are assisting with the GitHub repository: ${repoUrl}. Provide advice specific to this codebase.`;
    
    try {
      const overview = await OnboardingOverview.findOne({ repo_id: repoSlug }).sort({ createdAt: -1 });
      if (overview && overview.html) {
         let markdown = overview.html
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]*>?/gm, '\n')
          .replace(/\n\s*\n/g, '\n\n')
          .trim();
         systemContext += `\n\nHere is the architecture overview of the codebase to help you answer questions accurately:\n${markdown.substring(0, 3000)}`;
      }
    } catch (e) {
      console.error('Error fetching chat context from MongoDB:', e?.message);
    }
  }
  if (codeMentions && codeMentions.length > 0) {
    systemContext += ` Recent code mentions from the session: ${codeMentions.join(', ')}.`;
  }
  if (transcript) {
    systemContext += ` Recent conversation context: "${transcript.slice(-400)}".`;
  }

  const fullPrompt = `${systemContext}\n\nDeveloper question: ${message}`;

  if (!llmToken) {
    return res.status(500).json({ error: 'LLM_API_TOKEN is not configured.' });
  }

  try {
    const hfRes = await axios.post(
      llmUrl,
      {
        model: 'Qwen/Qwen2.5-72B-Instruct',
        messages: [{ role: 'user', content: fullPrompt }],
        max_tokens: 800,
        temperature: 0.4,
      },
      {
        headers: {
          Authorization: `Bearer ${llmToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = hfRes.data;
    let text = 'No content returned.';
    if (data?.choices?.[0]?.message?.content) {
      text = data.choices[0].message.content.trim();
    } else if (Array.isArray(data) && data[0]?.generated_text) {
      text = data[0].generated_text.trim();
    } else if (typeof data === 'string') {
      text = data.trim();
    } else {
      text = JSON.stringify(data);
    }

    res.json({
      id: Date.now().toString(),
      type: 'assistant',
      content: text,
      timestamp: new Date().toISOString(),
      context: codeMentions || []
    });
  } catch (error) {
    console.error('Error calling HuggingFace API (Chat):', error?.response?.data || error.message);
    res.status(500).json({
      id: Date.now().toString(),
      type: 'assistant',
      content: 'Sorry, there was an error processing your request.',
      timestamp: new Date().toISOString(),
      context: codeMentions || []
    });
  }
});

// Session Summary Endpoint — called when session ends to generate AI summary
app.post('/api/session-summary', async (req, res) => {
  const { transcript, repoUrl } = req.body;

  if (!transcript || transcript.trim().length === 0) {
    return res.json({
      summary: 'No voice conversation was recorded in this session.',
      decisions: 'No decisions captured.',
      references: 'No code references detected.'
    });
  }

  const repoContext = repoUrl ? ` for the repository ${repoUrl}` : '';
  const prompt = `You are an expert at summarizing pair programming sessions${repoContext}.\n\nFull voice transcript:\n---\n${transcript}\n---\n\nProvide:\n1. SUMMARY: A 3-5 sentence summary of what was discussed and accomplished.\n2. DECISIONS: Bullet points of technical decisions made. Format as "- Decision: [desc]". If none, say "No clear decisions were made."\n3. REFERENCES: Comma-separated list of all code files, functions, components, APIs mentioned. If none, say "None detected."\n\nRespond in EXACTLY this format:\nSUMMARY:\n[summary]\n\nDECISIONS:\n[bullets]\n\nREFERENCES:\n[list]`;

  try {
    const hfRes = await axios.post(
      llmUrl,
      {
        model: 'Qwen/Qwen2.5-72B-Instruct',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        temperature: 0.3,
      },
      {
        headers: {
          Authorization: `Bearer ${llmToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = hfRes.data;
    let text = '';
    if (data?.choices?.[0]?.message?.content) {
      text = data.choices[0].message.content.trim();
    } else if (Array.isArray(data) && data[0]?.generated_text) {
      text = data[0].generated_text.trim();
    } else if (typeof data === 'string') {
      text = data.trim();
    } else {
      text = JSON.stringify(data);
    }

    const summaryMatch = text.match(/SUMMARY:\n([\s\S]*?)(?=\n\nDECISIONS:|$)/);
    const decisionsMatch = text.match(/DECISIONS:\n([\s\S]*?)(?=\n\nREFERENCES:|$)/);
    const referencesMatch = text.match(/REFERENCES:\n([\s\S]*)/);

    res.json({
      summary: summaryMatch ? summaryMatch[1].trim() : text.substring(0, 400),
      decisions: decisionsMatch ? decisionsMatch[1].trim() : 'Could not extract decisions.',
      references: referencesMatch ? referencesMatch[1].trim() : 'Could not extract references.'
    });
  } catch (error) {
    console.error('Error generating session summary:', error);
    res.status(500).json({
      summary: 'Could not generate AI summary.',
      decisions: 'Please review the transcript manually.',
      references: 'N/A'
    });
  }
});

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.io
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Room storage
const rooms = new Map();

const getRoomInfo = (roomId) => {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      users: new Map(),
      messages: [],
    });
  }
  return rooms.get(roomId);
};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  const { userId, userName, roomId } = socket.handshake.query;

  if (!userId || !userName || !roomId) {
    console.log("Missing required connection data");
    socket.disconnect();
    return;
  }

  const room = getRoomInfo(roomId);

  if (room.users.size >= 2 && !room.users.has(userId)) {
    console.log(`Room ${roomId} is full`);
    socket.emit("room-full");
    setTimeout(() => {
      socket.disconnect();
    }, 1000);
    return;
  }

  socket.on("join-room", ({ userId, userName, roomId }) => {
    socket.join(roomId);
    socket.emit("connected");
    console.log("User joined room:", roomId, "with ID:", userId);
    socket.to(roomId).emit("user-joined", { id: userId, name: userName });

    const otherUsers = Array.from(room.users.values()).filter(
      (user) => user.id !== userId
    );
    otherUsers.forEach((user) => {
      socket.emit("user-joined", {
        id: user.id,
        name: user.name,
      });
    });
  });

  room.users.set(userId, {
    id: userId,
    name: userName,
    socketId: socket.id,
  });

  room.messages.forEach((message) => {
    socket.emit("message", message);
  });

  const otherUsers = Array.from(room.users.values()).filter(
    (user) => user.id !== userId
  );
  otherUsers.forEach((user) => {
    socket.emit("user-joined", {
      id: user.id,
      name: user.name,
    });
  });

  console.log(
    `User ${userName} joined room ${roomId}. Room size: ${room.users.size}`
  );

  socket.on("send-message", (message) => {
    console.log("Message received:", message);

    if (!message || !message.content || !message.senderId) {
      console.log("Invalid message format");
      return;
    }

    room.messages.push(message);
    socket.to(roomId).emit("message", message);
  });

  socket.on("call-offer", (data) => {
    console.log("Call offer from", userId, "to", data.to);

    if (!data.offer || !data.to) {
      console.log("Invalid call offer data");
      return;
    }

    const targetUser = Array.from(room.users.values()).find(
      (user) => user.id === data.to
    );
    if (targetUser) {
      io.to(targetUser.socketId).emit("call-offer", {
        from: userId,
        offer: data.offer,
      });
    } else {
      console.log("Target user not found for call offer");
    }
  });

  socket.on("call-answer", (data) => {
    console.log("Call answer from", userId);

    if (!data.answer) {
      console.log("Invalid call answer data");
      return;
    }

    socket.to(roomId).emit("call-answer", {
      from: userId,
      answer: data.answer,
    });
  });

  socket.on("ice-candidate", (data) => {
    console.log("ICE candidate from", userId);

    if (!data.candidate) {
      console.log("Invalid ICE candidate data");
      return;
    }

    socket.to(roomId).emit("ice-candidate", {
      from: userId,
      candidate: data.candidate,
    });
  });

  socket.on("end-call", () => {
    console.log("Call ended by", userId);
    socket.to(roomId).emit("call-ended", { from: userId });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    if (room.users.has(userId)) {
      const user = room.users.get(userId);
      room.users.delete(userId);

      socket.to(roomId).emit("user-left", {
        id: userId,
        name: user.name,
      });

      console.log(
        `User ${user.name} left room ${roomId}. Room size: ${room.users.size}`
      );

      if (room.users.size === 0) {
        rooms.delete(roomId);
        console.log(`Room ${roomId} deleted (empty)`);
      }
    }
  });

  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });
});

server.on("error", (error) => {
  console.error("Server error:", error);
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("WebRTC signaling server & AI Assistant backend ready with Gemini");
});
