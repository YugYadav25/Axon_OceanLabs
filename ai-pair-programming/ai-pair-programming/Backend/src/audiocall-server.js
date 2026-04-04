const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

// Simple room management
const rooms = {};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join-room', (roomId, userId) => {
    if (!rooms[roomId]) rooms[roomId] = { users: [] };
    if (rooms[roomId].users.length >= 2) {
      socket.emit('room-full');
      return;
    }

    rooms[roomId].users.push({ id: userId, socketId: socket.id });
    socket.join(roomId);

    // Notify existing user (if any) about new user
    if (rooms[roomId].users.length === 2) {
      io.to(roomId).emit('user-joined', userId);
    }

    socket.emit('room-joined', roomId, rooms[roomId].users);
  });

  socket.on('offer', (roomId, userId, offer) => {
    socket.to(roomId).emit('offer', userId, offer);
  });

  socket.on('answer', (roomId, userId, answer) => {
    socket.to(roomId).emit('answer', userId, answer);
  });

  socket.on('ice-candidate', (roomId, userId, candidate) => {
    socket.to(roomId).emit('ice-candidate', userId, candidate);
  });

  socket.on('leave', (roomId, userId) => {
    if (rooms[roomId]) {
      rooms[roomId].users = rooms[roomId].users.filter(u => u.id !== userId);
      if (rooms[roomId].users.length === 0) delete rooms[roomId];
      socket.to(roomId).emit('user-left', userId);
      socket.leave(roomId);
    }
  });

  socket.on('disconnect', () => {
    // Clean up room on disconnect
    for (const roomId in rooms) {
      rooms[roomId].users = rooms[roomId].users.filter(u => u.socketId !== socket.id);
      if (rooms[roomId].users.length === 0) delete rooms[roomId];
    }
  });
});

app.get('/', (req, res) => {
  res.send('Audio Call Signaling Server is running');
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

