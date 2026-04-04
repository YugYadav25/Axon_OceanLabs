const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config(); // Load GEMINI_API_KEY from .env
const analyzeRepoRouter = require('./analyzeRepoRoute');
const { GoogleGenAI } = require("@google/genai");

// Initialize Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.LLM_API_TOKEN,
});

// Initialize Express and Middleware
const app = express();
app.use(cors());
app.use(express.json());
app.use(analyzeRepoRouter);

// Health check endpoint
app.get("/", (req, res) => {
  res.send("AI Assistant Backend is running with Gemini");
});

// ✅ Gemini AI Assistant Endpoint
app.post('/api/chat', async (req, res) => {
  const { message, codeMentions } = req.body;

  try {
   const response = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: message,
  });
    const text = response.text;

    res.json({
      id: Date.now().toString(),
      type: 'assistant',
      content: text,
      timestamp: new Date().toISOString(),
      context: codeMentions || []
    });
  } catch (error) {
    console.error('Error calling Google Gemini API:', error);
    res.status(500).json({
      id: Date.now().toString(),
      type: 'assistant',
      content: 'Sorry, there was an error processing your request.',
      timestamp: new Date().toISOString(),
      context: codeMentions || []
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




