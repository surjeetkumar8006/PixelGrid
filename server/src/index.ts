import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { seedGridIfNeeded } from './db';
import { setupSocketIO } from './socket/socketManager';
import {
  handleUserJoin,
  handleGetGrid,
  handleGetLeaderboard,
  handleGetStats,
  handleClaimBlock,
} from './controllers/gridController';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// REST Routes
app.post('/api/users', handleUserJoin);
app.get('/api/grid', handleGetGrid);
app.get('/api/leaderboard', handleGetLeaderboard);
app.get('/api/stats', handleGetStats);
app.post('/api/blocks/:id/claim', handleClaimBlock);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Create HTTP Server & Socket.IO Instance
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

setupSocketIO(io);

// Initialize DB and start server
async function main() {
  try {
    await seedGridIfNeeded();
    server.listen(PORT, () => {
      console.log(`=================================`);
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`   REST API: http://localhost:${PORT}/api`);
      console.log(`   WebSockets: ws://localhost:${PORT}`);
      console.log(`=================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

main();
