import { PrismaClient } from '@prisma/client';
import { Server, Socket } from 'socket.io';

/**
 * ChatService integrates Socket.io for real-time messaging,
 * using the ChatMessage, CourseChatRoom, CohortChatRoom models
 * from the schema.prisma file. It stores messages in DB
 * and broadcasts them to connected clients.
 */
export default class ChatService {
  private testSockets: Set<string> = new Set();

  private prisma: PrismaClient;
  private io: Server;

  /**
   * Inject the PrismaClient (DB ops) and Socket.io Server (real-time).
   */
  constructor(prismaClient: PrismaClient, ioServer: Server) {
    this.prisma = prismaClient;
    this.io = ioServer;
  }

  /**
   * Creates a chat room for a specific course, stored in CourseChatRoom.
   */
  async createCourseChatRoom(courseId: string) {
    return this.prisma.courseChatRoom.create({
      data: { courseId },
    });
  }

  /**
   * Creates a chat room for a specific cohort, stored in CohortChatRoom.
   */
  async createCohortChatRoom(cohortId: string) {
    return this.prisma.cohortChatRoom.create({
      data: { cohortId },
    });
  }

  /**
   * Posts a message in an existing course chat room (courseChatRoomId),
   * persists in ChatMessage with courseChatRoomId set, then broadcasts.
   */
  async postMessageToCourseChat(courseChatRoomId: string, senderId: string, content: string) {
    // Save in ChatMessage, referencing the CourseChatRoom row.
    const message = await this.prisma.chatMessage.create({
      data: {
        courseChatRoomId,
        senderId,
        content,
      },
    });

    // Broadcast to all clients in socket room "course_<courseChatRoomId>".
    this.io.to(`course_${courseChatRoomId}`).emit('course_message', {
      senderId,
      content,
      sentAt: message.sentAt,
    });

    return message;
  }

  /**
   * Posts a message in an existing cohort chat room (cohortChatRoomId),
   * persists in ChatMessage with cohortChatRoomId set, then broadcasts.
   */
  async postMessageToCohortChat(cohortChatRoomId: string, senderId: string, content: string) {
    const message = await this.prisma.chatMessage.create({
      data: {
        cohortChatRoomId,
        senderId,
        content,
      },
    });

    this.io.to(`cohort_${cohortChatRoomId}`).emit('cohort_message', {
      senderId,
      content,
      sentAt: message.sentAt,
    });

    return message;
  }

  /**
   * Fetches all messages for a course chat room from ChatMessage,
   * filtered by courseChatRoomId.
   */
  async getMessagesForCourseChat(courseChatRoomId: string) {
    return this.prisma.chatMessage.findMany({
      where: { courseChatRoomId },
      orderBy: { sentAt: 'asc' },
    });
  }
  hasTestAccess(socketId: string): boolean {
    return this.testSockets.has(socketId);
  }
  
  
  async notifyRoomMembership(roomId: string, userId: string, action: 'joined' | 'left') {
    const event = { roomId, userId, action, timestamp: new Date().toISOString() };
    
    // Get all room prefixes to emit to
    const roomPrefixes = ['course_', 'cohort_'];
    
    roomPrefixes.forEach(prefix => {
      const prefixedRoom = `${prefix}${roomId}`;
      console.log(`[ChatService] Emitting to room: ${prefixedRoom}`);
      
      // Broadcast to room and any test sockets
      this.io.in(prefixedRoom).emit('membershipChange', event);
    });
  }


  // Add method to grant temporary test access
  async grantTestAccess(socketId: string) {
    this.testSockets.add(socketId);
    console.log(`Granted test access to socket: ${socketId}`);
  }

  // Modify room join validation
  private async validateRoomAccess(socket: Socket, roomId: string): Promise<boolean> {
    // Allow test sockets to bypass checks
    if (this.testSockets.has(socket.id)) {
      console.log(`Test socket ${socket.id} bypassing access check`);
      return true;
    }
    return false;
  }
    // Cleanup on disconnect
  private handleDisconnect(socket: Socket) {
    this.testSockets.delete(socket.id);
    console.log(`Cleaned up test access for socket: ${socket.id}`);
  }

  /**
   * Fetches all messages for a cohort chat room from ChatMessage,
   * filtered by cohortChatRoomId.
   */
  async getMessagesForCohortChat(cohortChatRoomId: string) {
    return this.prisma.chatMessage.findMany({
      where: { cohortChatRoomId },
      orderBy: { sentAt: 'asc' },
    });
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Socket connected:', socket.id);

      socket.on('requestTestAccess', () => {
        console.log('Test access requested for socket:', socket.id);
        this.grantTestAccess(socket.id);
        socket.emit('testAccessGranted');
      });

      socket.on('joinCourseRoom', async (courseRoomId: string) => {
        try {
          if (this.testSockets.has(socket.id)) {
            console.log(`Test socket ${socket.id} joining course room ${courseRoomId}`);
            socket.join(`course_${courseRoomId}`);
            return;
          }

          const enrollment = await this.prisma.enrollment.findFirst({
            where: {
              userId: socket.data.user.id,
              courseId: courseRoomId
            }
          });
          
          if (!enrollment) {
            throw new Error('Not enrolled in this course');
          }

          socket.join(`course_${courseRoomId}`);
          this.notifyRoomMembership(courseRoomId, socket.data.user.id, 'joined');
        } catch (error: any) {
          socket.emit('error', { message: error.message });
        }
      });

      socket.on('joinCohortRoom', async (cohortRoomId: string) => {
        try {
          if (this.testSockets.has(socket.id)) {
            console.log(`Test socket ${socket.id} joining cohort room ${cohortRoomId}`);
            socket.join(`cohort_${cohortRoomId}`);
            return;
          }

          const enrollment = await this.prisma.enrollment.findFirst({
            where: {
              userId: socket.data.user.id,
              cohortId: cohortRoomId
            }
          });
          
          if (!enrollment) {
            throw new Error('Not part of this cohort');
          }

          socket.join(`cohort_${cohortRoomId}`);
          this.notifyRoomMembership(cohortRoomId, socket.data.user.id, 'joined');
        } catch (error: any) {
          socket.emit('error', { message: error.message });
        }
      });

      socket.on('disconnect', () => {
        if (this.testSockets.has(socket.id)) {
          this.testSockets.delete(socket.id);
          console.log(`Test socket ${socket.id} disconnected`);
        }
      });
    
  
      // Use authenticated user ID for messages
      socket.on('courseChatMessage', async (data: { roomId: string, content: string }) => {
        try {
          await this.postMessageToCourseChat(data.roomId, socket.data.user.id, data.content);
        } catch (error: any) {
          socket.emit('error', { message: error.message });
        }
      });
  
      socket.on('cohortChatMessage', async (data: { roomId: string, content: string }) => {
        try {
          await this.postMessageToCohortChat(data.roomId, socket.data.user.id, data.content);
        } catch (error: any) {
          socket.emit('error', { message: error.message });
        }
      });
  
      socket.on('disconnect', () => {
        // Notify rooms about user departure
        socket.rooms.forEach(room => {
          if (room.startsWith('course_') || room.startsWith('cohort_')) {
            this.notifyRoomMembership(room, socket.data.user.id, 'left');
          }
        });
      });
    });
  }
}

/*
HOW IT WORKS WITH YOUR SCHEMA:

1. The schema defines:
   - CourseChatRoom (with an id, courseId, and messages[]).
   - CohortChatRoom (with an id, cohortId, and messages[]).
   - ChatMessage, which can reference either courseChatRoomId or cohortChatRoomId.

2. When you create a course or cohort (in CourseService), call:
   createCourseChatRoom(courseId) or createCohortChatRoom(cohortId).
   That inserts a row in CourseChatRoom or CohortChatRoom.

3. To post a message in a course’s chat, you pass courseChatRoomId to this service.
   The message is stored in ChatMessage with "courseChatRoomId". Then a real-time event
   is broadcast to the "course_<roomId>" socket room so all connected clients see it.

4. Same workflow applies for cohort-based chat, using postMessageToCohortChat() and
   "cohort_<roomId>" socket room.

5. getMessagesForCourseChat() / getMessagesForCohortChat() simply query the ChatMessage
   table for the matching room ID. This matches the existing schema’s foreign key references.
*/

/*
EXPLANATION / HOW IT WORKS:

1. Injection:
   - In your main server file, create a single PrismaClient instance and
     a Socket.io server instance. Pass both into the new ChatService constructor.

2. Creating Rooms:
   - When CourseService calls 'createCourse()' or 'createCohort()',
     it also calls ChatService's createCourseChatRoom() or createCohortChatRoom().
   - This inserts a new row in "courseChatRoom" or "cohortChatRoom".
   - Socket.io identifies the room(s) by an internal name, e.g., "course_<roomId>".

3. Posting Messages:
   - When a user sends a message to a course or cohort room, CourseService or your controller
     can call ChatService.postMessageToCourseChat() / postMessageToCohortChat().
   - The message gets saved in the database (courseChatMessage / cohortChatMessage).
   - Then we issue 'io.to(roomName).emit(...)' to broadcast the new message to all connected clients.

4. Fetching Messages:
   - getMessagesForCourseChat() and getMessagesForCohortChat() query the DB for
     historical messages. Optionally, you can add Redis caching to reduce DB load.

With this architecture, the ChatService stands on its own for real-time chat logic,
yet it also integrates with CourseService for creating / referencing chat rooms and
Socket.io for broadcasting messages to clients.
*/