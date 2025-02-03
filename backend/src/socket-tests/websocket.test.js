const io = require('socket.io-client');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const DEBUG = true;
const joinedRoomsUserA = new Set();
const joinedRoomsUserB = new Set();

async function runMultiClientTest() {
  try {
    const courses = await prisma.course.findMany({
      where: { isPublished: true },
      include: { 
        chatRooms: true,
        cohorts: {
          include: { chatRooms: true }
        }
      }
    });
    
    console.log(`Found ${courses.length} courses to monitor`);

    // Two tokens simulating two different students
    const tokenA = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjE5YjdhZGVjLTJkNjktNDJiMS05ODc2LTQ0MmRlNzZhOGNlNSIsImVtYWlsIjoicmlnaHRtZW5jdXN0b216QGdtYWlsLmNvbSIsInBob25lTnVtYmVyIjoiMDEwNjMyNjYyNyIsInJvbGUiOiJMRUFSTkVSIiwiaWF0IjoxNzM4NTMxMDIyLCJleHAiOjE3Mzg1MzQ2MjJ9.--6orViJFnC5jAvEeN-w5aNKdiQ4MWEr8p5hffb8bVY';
    const tokenB = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImZmODIxNDgxLWZiOWItNDg4Ni1iZjZmLWQ2YmVkMWVkZjJiZSIsImVtYWlsIjoiYW5nZWxha29sd2FAZ21haWwuY29tIiwicGhvbmVOdW1iZXIiOiIwNzEyMzQ1Njc4Iiwicm9sZSI6IkxFQVJORVIiLCJpYXQiOjE3Mzg1MzA5NjksImV4cCI6MTczODUzNDU2OX0.nTImCiUWUYMBj1sfYyCu7OVhNE9oeQuZbwhKU_DnLb8';


    // Connect two sockets
    const socketA = io('http://localhost:3000', {
      auth: { token: tokenA },
      transports: ['websocket']
    });
    const socketB = io('http://localhost:3000', {
      auth: { token: tokenB },
      transports: ['websocket']
    });

    // Helper to join the correct rooms
    function joinRooms(socket, joinedRooms, label) {
      courses.forEach((course) => {
        course.chatRooms?.forEach((room) => {
          const roomId = room.id;
          ['course_', 'cohort_'].forEach(prefix => {
            const prefixedRoom = `${prefix}${roomId}`;
            if (!joinedRooms.has(prefixedRoom)) {
              console.log(`${label} joining room: ${prefixedRoom}`);
              socket.emit(prefix === 'course_' ? 'joinCourseRoom' : 'joinCohortRoom', roomId);
              joinedRooms.add(prefixedRoom);
            }
          });
        });
      });
    }
    
    

    // Socket A event handlers
    socketA.on('connect', () => {
      console.log(`UserA connected as ${socketA.id}`);
      socketA.emit('requestTestAccess');
    });
    socketA.onAny((event, ...args) => {
      if (DEBUG) console.log('UserA sees event:', event, args);
    });
    socketA.on('testAccessGranted', () => {
      joinRooms(socketA, joinedRoomsUserA, 'UserA');
    });
    socketA.on('roomJoined', (data) => {
      console.log(`Room joined confirmation:`, data);
    });
    
    // Debug all events
    socketA.onAny((eventName, ...args) => {
      console.log(`[${socketA.id}] Received ${eventName}:`, args);
    });
    socketA.on('membershipChange', (data) => {
      console.log('UserA sees membershipChange:', data);
    });
    socketA.on('course_message', (msg) => {
      console.log('UserA sees course_message:', msg);
    });
    socketA.on('cohort_message', (msg) => {
      console.log('UserA sees cohort_message:', msg);
    });

    // Socket B event handlers
    socketB.on('connect', () => {
      console.log(`UserB connected as ${socketB.id}`);
      socketB.emit('requestTestAccess');
    });
    socketB.on('roomJoined', (data) => {
      console.log(`Room joined confirmation:`, data);
    });
    
    // Debug all events
    socketB.onAny((eventName, ...args) => {
      console.log(`[${socketB.id}] Received ${eventName}:`, args);
    });
    socketB.on('testAccessGranted', () => {
      joinRooms(socketB, joinedRoomsUserB, 'UserB');
      // Optionally send a test message to the first "course" chat room
      if (courses[0] && courses[0].chatRooms && courses[0].chatRooms[0]) {
        const roomId = courses[0].chatRooms[0].id;
        setTimeout(() => {
          socketB.emit('postMessageToCourseChat', {
            courseChatRoomId: roomId,
            content: `Hello from UserB in room ${roomId}`
          });
        }, 3000);
      }
    });
    socketB.onAny((event, ...args) => {
      if (DEBUG) console.log('UserB sees event:', event, args);
    });
    socketB.on('membershipChange', (data) => {
      console.log('UserB sees membershipChange:', data);
    });
    socketB.on('course_message', (msg) => {
      console.log('UserB sees course_message:', msg);
    });
    socketB.on('cohort_message', (msg) => {
      console.log('UserB sees cohort_message:', msg);
    });

    // Keep running until Ctrl+C
    process.on('SIGINT', async () => {
      console.log('\nReceived SIGINT, cleaning up...');
      socketA.disconnect();
      socketB.disconnect();
      await prisma.$disconnect();
      process.exit(0);
    });

  } catch (err) {
    console.error('Fatal error:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Run it
runMultiClientTest().catch(console.error);