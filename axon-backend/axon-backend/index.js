const http = require('http');
const { Server } = require('socket.io');

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');

const repoRouter = require('./src/controllers/repoController');
const docsRouter = require('./src/controllers/docsController');
const tasksRouter = require('./src/controllers/tasksController');
const changeRouter = require('./src/controllers/changeController');
const chatRouter = require('./src/controllers/chatController');
const webhookRouter = require('./src/controllers/webhookController');
const onboardingRouter = require('./src/controllers/onboardingController');
const personalBrandingRouter = require('./src/routes/personalBrandingRoutes');
const authRouter = require('./src/routes/authRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allow connections from frontend
    methods: ['GET', 'POST']
  }
});

// Make `io` available across the app via req.app.get('io')
app.set('io', io);

io.on('connection', (socket) => {
  console.log(`[WebSocket] Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[WebSocket] Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;

// Middlewaresapi/
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/repo', repoRouter);
app.use('/api/docs', docsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/changes', changeRouter);
app.use('/api/chat', chatRouter);
app.use('/api/webhook', webhookRouter);
app.use('/api/onboarding', onboardingRouter);
app.use('/generated', express.static(path.join(__dirname, 'docs/generated')));
app.use('/api/personal-branding', personalBrandingRouter);

// Start server
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`WebSocket server initialized`);
  });
});
