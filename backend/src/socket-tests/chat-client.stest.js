const io = require('socket.io-client');
const readline = require('readline');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const PORT = 3081;
const prisma = new PrismaClient();

// Connect client socket to same port
const socket = io(`http://localhost:${PORT}`);

// Require STUDENT_TOKEN
if (!process.env.STUDENT_TOKEN) {
  console.error('Please provide STUDENT_TOKEN');
  process.exit(1);
}

const decoded = jwt.decode(process.env.STUDENT_TOKEN);
const userId = decoded.id;
console.log(`Starting Chat Test for user: ${userId}`);

let availableRooms = {
  course: [],
  cohort: []
};

// On connect, request test access
socket.on('connect', () => {
  console.log('Connected as:', socket.id);
  socket.emit('requestTestAccess');
});

// After test access granted, fetch DB rooms. Then join them.
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

  // Join each discovered room so we can receive real-time messages
  availableRooms.course.forEach(room => socket.emit('joinCourseRoom', room.id));
  availableRooms.cohort.forEach(room => socket.emit('joinCohortRoom', room.id));

  console.log('\nAvailable Rooms:');
  console.log('Course Rooms:');
  availableRooms.course.forEach((room, i) => console.log(`[${i}] ${room.id}`));
  console.log('\nCohort Rooms:');
  availableRooms.cohort.forEach((room, i) => console.log(`[${i}] ${room.id}`));

  console.log('\nCommands:');
  console.log('course <index> <message>');
  console.log('cohort <index> <message>');
  console.log('quit');
  rl.prompt();
});

// Listen for real-time course messages
socket.on('course_message', (msg) => {
  console.log(`\n[Course] from ${msg.senderId}: ${msg.content}`);
  console.log(`Sent at: ${msg.sentAt}`);
  rl.prompt();
});

// Listen for real-time cohort messages
socket.on('cohort_message', (msg) => {
  console.log(`\n[Cohort] from ${msg.senderId}: ${msg.content}`);
  console.log(`Sent at: ${msg.sentAt}`);
  rl.prompt();
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Handle user input to send messages
rl.on('line', async (input) => {
  if (input.toLowerCase() === 'quit') {
    await cleanup();
    return;
  }

  const [type, index, ...rest] = input.split(' ');
  const message = rest.join(' ');

  try {
    const roomIndex = parseInt(index, 10);
    if (type === 'course') {
      const room = availableRooms.course[roomIndex];
      if (!room) {
        console.log('Invalid course room index');
        return;
      }
      // Ask server to post course message (calls ChatService on server)
      socket.emit('courseChatMessage', {
        roomId: room.id,
        senderId: userId,
        content: message
      });
    } else if (type === 'cohort') {
      const room = availableRooms.cohort[roomIndex];
      if (!room) {
        console.log('Invalid cohort room index');
        return;
      }
      // Ask server to post cohort message
      socket.emit('cohortChatMessage', {
        roomId: room.id,
        senderId: userId,
        content: message
      });
    }
  } catch (err) {
    console.error('Error sending message:', err);
  }
  rl.prompt();
});

async function cleanup() {
  console.log('Cleaning up...');
  socket.disconnect();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', cleanup);