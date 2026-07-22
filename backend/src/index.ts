// Force nodemon restart
import 'dotenv/config';
import http from 'http';
import app from './app';
import { initializeSocket, setIo } from './socket';

const PORT = process.env.PORT ?? 5000;

// ─── Create HTTP server (required to share with Socket.IO) ───────────────────
const httpServer = http.createServer(app);

// ─── Initialize Socket.IO ────────────────────────────────────────────────────
const io = initializeSocket(httpServer);
setIo(io);

// ─── Start Listening ─────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`🚀 ProManager server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  console.log(`⚡ Socket.IO is active`);
});

// ─── Graceful Shutdown ───────────────────────────────────────────────────────
process.on('unhandledRejection', (reason: unknown) => {
  console.error('💥 Unhandled Rejection:', reason);
  httpServer.close(() => process.exit(1));
});

process.on('uncaughtException', (error: Error) => {
  console.error('💥 Uncaught Exception:', error.message);
  process.exit(1);
});

export { io };
export default httpServer;
