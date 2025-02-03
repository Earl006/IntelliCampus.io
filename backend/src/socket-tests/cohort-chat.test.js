const io = require('socket.io-client');
const readline = require('readline');

if (!process.env.STUDENT_TOKEN) {
  console.error('Please provide STUDENT_TOKEN');
  process.exit(1);
}

const socket = io('http://localhost:3000', {
  auth: { token: process.env.STUDENT_TOKEN },
  transports: ['websocket']
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

socket.on('connect', () => {
  console.log(`Connected to server with socket id: ${socket.id}`);
  socket.emit('requestTestAccess');
});

socket.on('testAccessGranted', () => {
  console.log('Test access granted');
  console.log('\nType your message and press enter to send');
  console.log('Type "quit" to exit');
  rl.prompt();
});

socket.on('cohort_message', (msg) => {
  console.log(`\nReceived message: ${msg.content}`);
  console.log(`From: ${msg.senderId}`);
  console.log(`Sent at: ${msg.sentAt}`);
  rl.prompt();
});

rl.on('line', (line) => {
  if (line.toLowerCase() === 'quit') {
    rl.close();
    socket.disconnect();
    return;
  }

  socket.emit('postMessageToCohortChat', {
    cohortChatRoomId: 'bd980bc8-04e5-44be-b8fd-e939c8993e84', // Cohort room ID
    content: line
  });
  
  rl.prompt();
});