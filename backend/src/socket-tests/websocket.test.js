const io = require('socket.io-client');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const TEST_DURATION = 1200000; 
const DEBUG = true;
const joinedRooms = new Set();

async function runSocketTest() {
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

    const socket = io('http://localhost:3000', {
      auth: { token: process.env.STUDENT_TOKEN },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5
    });

    function joinRooms() {
      courses.forEach(course => {
        course.chatRooms?.forEach(room => {
          const roomId = room.id;
          if (!joinedRooms.has(roomId)) {
            DEBUG && console.log(`Joining course room: ${roomId}`);
            socket.emit('joinCourseRoom', roomId);
            joinedRooms.add(roomId);
          }
        });
    
        course.cohorts?.forEach(cohort => {
          cohort.chatRooms?.forEach(room => {
            const roomId = room.id;
            if (!joinedRooms.has(roomId)) {
              DEBUG && console.log(`Joining cohort room: ${roomId}`);
              socket.emit('joinCohortRoom', roomId);
              joinedRooms.add(roomId);
            }
          });
        });
      });
    }
    

    socket.on('connect', () => {
      console.log(`[${new Date().toISOString()}] Connected as ${socket.id}`);
      socket.emit('requestTestAccess');
    });

    socket.on('testAccessGranted', joinRooms);

    socket.on('membershipChange', (data) => {
      const roomPrefix = data.roomId.includes('course_') ? 'course' : 'cohort';
      console.log('\n🔔 Event:', JSON.stringify({
        type: 'membershipChange',
        roomType: roomPrefix,
        data,
        timestamp: new Date().toISOString(),
        socketId: socket.id,
        joinedRooms: Array.from(joinedRooms)
      }, null, 2));
    });

    socket.on('roomJoined', (roomId) => {
      console.log(`✅ Room joined: ${roomId}`);
    });

    socket.on('error', (error) => {
      console.error('❌ Error:', error);
    });

    socket.on('disconnect', (reason) => {
      console.log(`Disconnected: ${reason}`);
      joinedRooms.clear();
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`Reconnected after ${attemptNumber} attempts`);
      socket.emit('requestTestAccess');
    });

    process.on('SIGINT', cleanup);
    setTimeout(cleanup, TEST_DURATION);

    function cleanup() {
      console.log('\nCleaning up...');
      socket.disconnect();
      prisma.$disconnect();
      process.exit(0);
    }

  } catch (error) {
    console.error('Fatal error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

runSocketTest().catch(console.error);