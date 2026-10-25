import dotenv from 'dotenv';
// Load environment variables before any other imports
dotenv.config();

import http from 'http';
import app from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { initSocketServer } from './sockets/socketServer.js';

const PORT = process.env.PORT || 5000;

// Start Server
const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Create Node.js HTTP server wrapping the Express app
    const httpServer = http.createServer(app);

    // 3. Initialize Socket.IO engine and bind to HTTP server
    const io = initSocketServer(httpServer);

    // 4. Attach io instance to Express app for access in routes via req.app.get('io')
    app.set('io', io);

    // 5. Start listening for incoming HTTP & WebSocket traffic
    httpServer.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 [Server] SyncSpace API running on port ${PORT}`);
      console.log(`🔌 [Sockets] Socket.IO server initialized on ws://localhost:${PORT}`);
      console.log(`📡 [Health] http://localhost:${PORT}/health`);
      console.log(`🔒 [Security] JWT Handshake Auth & Helmet active`);
      console.log(`🌐 [CORS] Allowed Origins: ${process.env.CLIENT_ORIGIN || 'http://localhost:3000'}, ${process.env.ADMIN_ORIGIN || 'http://localhost:4200'}`);
      console.log(`=======================================================`);
    });

    // 6. Graceful Shutdown handlers
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n[Server] Received ${signal}. Closing HTTP and Socket.IO server...`);
      io.close(() => {
        console.log('[Socket] Socket.IO connections closed.');
      });

      httpServer.close(async () => {
        console.log('[Server] HTTP server closed.');
        await disconnectDB();
        process.exit(0);
      });

      // Force close after 10s if graceful shutdown hangs
      setTimeout(() => {
        console.error('[Server] Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('[Server] Fatal startup error:', error);
    process.exit(1);
  }
};

startServer();
