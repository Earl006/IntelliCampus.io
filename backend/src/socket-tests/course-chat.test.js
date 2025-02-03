const { PrismaClient } = require('@prisma/client');
const { Server } = require('socket.io');
const io = require('socket.io-client');
// Change import to use compiled JS or ts-node
const ChatService = require('../../dist/services/chat.service.js').default;
const readline = require('readline');

// Initialize services
const prisma = new PrismaClient();
const server = new Server(3031);
const chatService = new ChatService(prisma, server);

// Test room IDs 
const COURSE_ROOM_ID = '25452a2b-648a-4a7d-adcb-d49800b08ad1';

async function runTest() {
  // Start server
  server.listen(3031);
  console.log('Test server running on port 3001');

  const socket = io('http://localhost:3001', {
    auth: { token: process.env.STUDENT_TOKEN }
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  socket.on('connect', () => {
    console.log('Connected as:', socket.id);
    socket.emit('joinCourseRoom', COURSE_ROOM_ID);
    console.log('Start typing messages (quit to exit):');
    rl.prompt();
  });

  socket.on('course_message', (msg) => {
    console.log('\nMessage:', msg);
    rl.prompt();
  });

  rl.on('line', (input) => {
    if (input.toLowerCase() === 'quit') {
      cleanup();
      return;
    }
    
    socket.emit('postMessageToCourseChat', {
      courseChatRoomId: COURSE_ROOM_ID,
      content: input
    });
    rl.prompt();
  });

  function cleanup() {
    console.log('Cleaning up...');
    socket.disconnect();
    server.close();
    process.exit(0);
  }

  process.on('SIGINT', cleanup);
}

runTest().catch(console.error);