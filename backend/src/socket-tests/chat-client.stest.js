const io = require('socket.io-client');
const readline = require('readline');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { Server } = require('socket.io');
const ChatService = require('../../dist/services/chat.service.js').default;

const PORT = 3081;
const prisma = new PrismaClient();

// Create Server instance for ChatService
const ioServer = new Server();
const chatService = new ChatService(prisma, ioServer);

// Connect client socket
const socket = io(`http://localhost:${PORT}`);

if (!process.env.STUDENT_TOKEN) {
  console.error('Please provide STUDENT_TOKEN');
  process.exit(1);
}

const decoded = jwt.decode(process.env.STUDENT_TOKEN);
const userId = decoded.id;

console.log(`Testing ChatService for user: ${userId}`);

let availableRooms = {
  course: [],
  cohort: []
};

socket.on('connect', () => {
  console.log('Connected as:', socket.id);
  socket.emit('requestTestAccess');
});

socket.on('testAccessGranted', async () => {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    include: {
      course: { include: { chatRooms: true } },
      cohort: { include: { chatRooms: true } }
    }
  });

  enrollments.forEach(enrollment => {
    if (enrollment.course?.chatRooms) {
      availableRooms.course.push(...enrollment.course.chatRooms);
    }
    if (enrollment.cohort?.chatRooms) {
      availableRooms.cohort.push(...enrollment.cohort.chatRooms);
    }
  });

  console.log('\nTesting ChatService methods:');
  console.log('Course Rooms:');
  availableRooms.course.forEach((room, i) => {
    console.log(`[${i}] ${room.id}`);
  });

  console.log('\nCohort Rooms:');
  availableRooms.cohort.forEach((room, i) => {
    console.log(`[${i}] ${room.id}`);
  });

  console.log('\nCommands:');
  console.log('course <index> <message>');
  console.log('cohort <index> <message>');
  console.log('quit');
  rl.prompt();
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', async (input) => {
  if (input.toLowerCase() === 'quit') {
    await cleanup();
    return;
  }

  const [type, index, ...messageParts] = input.split(' ');
  const message = messageParts.join(' ');

  try {
    const roomIndex = parseInt(index);
    if (type === 'course') {
      const room = availableRooms.course[roomIndex];
      if (!room) {
        console.log('Invalid course room index');
        return;
      }
      // Test ChatService methods directly
      await chatService.postMessageToCourseChat(room.id, userId, message);
      const messages = await chatService.getMessagesForCourseChat(room.id);
      console.log('Course messages:', messages);
      
    } else if (type === 'cohort') {
      const room = availableRooms.cohort[roomIndex];
      if (!room) {
        console.log('Invalid cohort room index');
        return;
      }
      // Test ChatService methods directly
      await chatService.postMessageToCohortChat(room.id, userId, message);
      const messages = await chatService.getMessagesForCohortChat(room.id);
      console.log('Cohort messages:', messages);
    }
  } catch (error) {
    console.error('ChatService Error:', error);
  }
  rl.prompt();
});

async function cleanup() {
  console.log('Cleaning up...');
  socket.disconnect();
  ioServer.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', cleanup);