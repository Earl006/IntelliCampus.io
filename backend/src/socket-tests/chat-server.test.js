const { PrismaClient } = require('@prisma/client');
const { Server } = require('socket.io');
const http = require('http');
const ChatService = require('../../dist/services/chat.service.js').default;

const PORT = 3081;
const httpServer = http.createServer();
const io = new Server(httpServer);
const prisma = new PrismaClient();
const chatService = new ChatService(prisma, io);

async function startServer() {
  chatService.setupSocketHandlers();

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    
    socket.on('requestTestAccess', () => {
      console.log(`Test access requested for socket: ${socket.id}`);
      socket.emit('testAccessGranted');
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  httpServer.listen(PORT);
  console.log(`Test server running on port ${PORT}`);
}

async function cleanup() {
  console.log('Shutting down server...');
  await prisma.$disconnect();
  httpServer.close();
  process.exit(0);
}

process.on('SIGINT', cleanup);
startServer().catch(console.error);