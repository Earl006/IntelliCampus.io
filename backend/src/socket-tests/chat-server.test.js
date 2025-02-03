const { PrismaClient } = require('@prisma/client');
const { Server } = require('socket.io');
const http = require('http');
const ChatService = require('../../dist/services/chat.service.js').default;

const PORT = 3081;
const prisma = new PrismaClient();

// Create HTTP server + Socket.IO
const httpServer = http.createServer();
const io = new Server(httpServer);

// Create single ChatService instance
const chatService = new ChatService(prisma, io);

// Start server
async function startServer() {
  // Basic socket handlers
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Grant test access
    socket.on('requestTestAccess', () => {
      console.log(`Test access requested for socket: ${socket.id}`);
      chatService.grantTestAccess(socket.id);
      socket.emit('testAccessGranted');
    });

    // Let client join chosen room
    socket.on('joinCourseRoom', (roomId) => {
      if (chatService.hasTestAccess(socket.id)) {
        socket.join(`course_${roomId}`);
        console.log(`Socket ${socket.id} joined course room ${roomId}`);
      }
    });
    socket.on('joinCohortRoom', (roomId) => {
      if (chatService.hasTestAccess(socket.id)) {
        socket.join(`cohort_${roomId}`);
        console.log(`Socket ${socket.id} joined cohort room ${roomId}`);
      }
    });

    // When client wants to send a course message
    socket.on('courseChatMessage', async ({ roomId, senderId, content }) => {
      try {
        // Test ChatService method on the server
        await chatService.postMessageToCourseChat(roomId, senderId, content);
      } catch (err) {
        console.error('courseChatMessage error:', err);
      }
    });

    // When client wants to send a cohort message
    socket.on('cohortChatMessage', async ({ roomId, senderId, content }) => {
      try {
        // Test ChatService method on the server
        await chatService.postMessageToCohortChat(roomId, senderId, content);
      } catch (err) {
        console.error('cohortChatMessage error:', err);
      }
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