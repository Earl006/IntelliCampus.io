const io = require('socket.io-client');

const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});

// Connect to course chat room
socket.emit('joinCourseRoom', 'courseRoomId');

// Send message
socket.emit('courseChatMessage', {
  roomId: 'courseRoomId',
  content: 'Real-time test message'
});

// Listen for messages
socket.on('course_message', (message) => {
  console.log('Received:', message);
});

// Error handling
socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});