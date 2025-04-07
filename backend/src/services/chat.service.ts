import { PrismaClient } from "@prisma/client";
import { Server, Socket } from "socket.io";

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
  async postMessageToCourseChat(
    courseChatRoomId: string,
    senderId: string,
    content: string
  ) {
    // Save in ChatMessage, referencing the CourseChatRoom row.
    const message = await this.prisma.chatMessage.create({
      data: {
        courseChatRoomId,
        senderId,
        content,
      },
    });

    // Get sender's name for better UX
    let senderName = "Unknown User";
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: senderId },
        select: { firstName: true, lastName: true },
      });

      if (user) {
        senderName = `${user.firstName} ${user.lastName}`.trim();
      }
    } catch (error) {
      console.error("Error fetching user name:", error);
    }

    // Broadcast complete message data to all clients in room
    const messageData = {
      id: message.id,
      courseChatRoomId,
      senderId,
      senderName,
      content,
      sentAt: message.sentAt,
    };

    console.log(`Broadcasting to course_${courseChatRoomId}:`, messageData);
    this.io
      .to(`course_${courseChatRoomId}`)
      .emit("course_message", messageData);

    return message;
  }
  /**
   * Posts a message in an existing cohort chat room (cohortChatRoomId),
   * persists in ChatMessage with cohortChatRoomId set, then broadcasts.
   */
  async postMessageToCohortChat(
    cohortChatRoomId: string,
    senderId: string,
    content: string,
    socketId?: string
  ) {
    const message = await this.prisma.chatMessage.create({
      data: {
        cohortChatRoomId,
        senderId,
        content,
      },
    });

    // Get sender's name for better UX
    let senderName = "Unknown User";
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: senderId },
        select: { firstName: true, lastName: true },
      });

      if (user) {
        senderName = `${user.firstName} ${user.lastName}`.trim();
      }
    } catch (error) {
      console.error("Error fetching user name:", error);
    }

    // Prepare message data
    const messageData = {
      id: message.id,
      cohortChatRoomId,
      senderId,
      senderName,
      content,
      sentAt: message.sentAt,
    };

    // If we have the sender's socket ID, broadcast to everyone EXCEPT sender
    if (socketId) {
      console.log(
        `Broadcasting to cohort_${cohortChatRoomId} (excluding ${socketId}):`
      );
      this.io
        .to(`cohort_${cohortChatRoomId}`)
        .except(socketId)
        .emit("cohort_message", messageData);

      // Send directly to sender with a different event name to avoid duplicate processing
      this.io.to(socketId).emit("cohort_message_sent", messageData);
    } else {
      // No sender socket ID, broadcast to everyone
      console.log(`Broadcasting to cohort_${cohortChatRoomId}:`);
      this.io
        .to(`cohort_${cohortChatRoomId}`)
        .emit("cohort_message", messageData);
    }

    return message;
  }

  /**
   * Fetches all messages for a course chat room from ChatMessage,
   * filtered by courseChatRoomId.
   */
  async getMessagesForCourseChat(courseChatRoomId: string) {
    return this.prisma.chatMessage.findMany({
      where: { courseChatRoomId },
      orderBy: { sentAt: "asc" },
    });
  }
  hasTestAccess(socketId: string): boolean {
    return this.testSockets.has(socketId);
  }

  async notifyRoomMembership(
    roomId: string,
    userId: string,
    action: "joined" | "left"
  ) {
    const event = {
      roomId,
      userId,
      action,
      timestamp: new Date().toISOString(),
    };

    // Get all room prefixes to emit to
    const roomPrefixes = ["course_", "cohort_"];

    roomPrefixes.forEach((prefix) => {
      const prefixedRoom = `${prefix}${roomId}`;
      console.log(`[ChatService] Emitting to room: ${prefixedRoom}`);

      // Broadcast to room and any test sockets
      this.io.in(prefixedRoom).emit("membershipChange", event);
    });
  }

  // Add method to grant temporary test access
  async grantTestAccess(socketId: string) {
    this.testSockets.add(socketId);
    console.log(`Granted test access to socket: ${socketId}`);
  }

  // Modify room join validation
  private async validateRoomAccess(
    socket: Socket,
    roomId: string
  ): Promise<boolean> {
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
      orderBy: { sentAt: "asc" },
    });
  }
  async debugSocketRooms(roomId: string) {
    try {
      const roomName = `course_${roomId}`;
      const sockets = await this.io.in(roomName).fetchSockets();
      console.log(`Room ${roomName} has ${sockets.length} clients:`);

      sockets.forEach((socket) => {
        console.log(`- Socket ${socket.id}`);
      });

      return sockets.length;
    } catch (error) {
      console.error("Error debugging socket rooms:", error);
      return 0;
    }
  }
  /**
   * Fetches all relevant chat messages for an instructor from courses and cohorts they manage
   * Includes metadata about the message source for better context
   */
  async getInstructorMessages(instructorId: string) {
    try {
      // Step 1: Find all courses taught by this instructor
      const instructorCourses = await this.prisma.course.findMany({
        where: { instructorId },
        select: {
          id: true,
          title: true,
          chatRooms: {
            select: { id: true },
          },
        },
      });

      // Step 2: Find all cohorts managed by this instructor
      const instructorCohorts = await this.prisma.cohort.findMany({
        where: { instructorId },
        select: {
          id: true,
          name: true,
          chatRooms: {
            select: { id: true },
          },
          course: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      // Step 3: Extract all chat room IDs
      const courseChatRoomIds = instructorCourses.flatMap((course) =>
        course.chatRooms.map((room) => room.id)
      );

      const cohortChatRoomIds = instructorCohorts.flatMap((cohort) =>
        cohort.chatRooms.map((room) => room.id)
      );

      // Step 4: Get messages from these rooms with pagination
      const courseMessages = await this.prisma.chatMessage.findMany({
        where: {
          courseChatRoomId: { in: courseChatRoomIds },
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          courseChatRoom: {
            select: {
              course: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
        orderBy: {
          sentAt: "desc",
        },
        take: 100, // Limit to avoid overwhelming response
      });

      const cohortMessages = await this.prisma.chatMessage.findMany({
        where: {
          cohortChatRoomId: { in: cohortChatRoomIds },
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          cohortChatRoom: {
            select: {
              cohort: {
                select: {
                  id: true,
                  name: true,
                  course: {
                    select: {
                      id: true,
                      title: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          sentAt: "desc",
        },
        take: 100, // Limit to avoid overwhelming response
      });

      // Step 5: Create lookup maps for course and cohort info
      const courseMap = instructorCourses.reduce((map, course) => {
        map[course.id] = course.title;
        return map;
      }, {} as Record<string, string>);

      const cohortMap = instructorCohorts.reduce((map, cohort) => {
        map[cohort.id] = {
          name: cohort.name,
          courseTitle: cohort.course.title,
          courseId: cohort.course.id,
        };
        return map;
      }, {} as Record<string, any>);

      // Step 6: Transform and combine messages with context information
      const transformedCourseMessages = courseMessages.map((message) => {
        const courseId = message.courseChatRoom?.course.id;
        const courseTitle =
          message.courseChatRoom?.course.title ||
          (courseId ? courseMap[courseId] : undefined) ||
          "Unknown Course";

        return {
          id: message.id,
          content: message.content,
          sentAt: message.sentAt,
          sender: {
            id: message.sender.id,
            name: `${message.sender.firstName} ${message.sender.lastName}`.trim(),
          },
          source: {
            type: "course",
            id: courseId,
            title: courseTitle,
            roomId: message.courseChatRoomId,
          },
          isFromInstructor: message.senderId === instructorId,
        };
      });

      const transformedCohortMessages = cohortMessages.map((message) => {
        const cohortId = message.cohortChatRoom?.cohort.id;
        const cohortInfo =
          message.cohortChatRoom?.cohort ||
          (cohortId && cohortMap[cohortId]
            ? cohortMap[cohortId]
            : { name: "Unknown Cohort", courseTitle: "Unknown Course" });

        return {
          id: message.id,
          content: message.content,
          sentAt: message.sentAt,
          sender: {
            id: message.sender.id,
            name: `${message.sender.firstName} ${message.sender.lastName}`.trim(),
          },
          source: {
            type: "cohort",
            id: cohortId,
            title: cohortInfo.name,
            courseId: cohortInfo.course?.id || cohortInfo.courseId,
            courseTitle: cohortInfo.course?.title || cohortInfo.courseTitle,
          },
          roomId: message.cohortChatRoomId,
          isFromInstructor: message.senderId === instructorId,
        };
      });

      // Step 7: Combine and sort by most recent
      const allMessages = [
        ...transformedCourseMessages,
        ...transformedCohortMessages,
      ].sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());

      // Step 8: Group messages by conversation
      const conversationGroups = this.groupMessagesByConversation(allMessages);

      return {
        messages: allMessages,
        conversations: conversationGroups,
        unreadCount: this.countUnreadMessages(allMessages), // You would need to track read status
      };
    } catch (error: any) {
      console.error("Error fetching instructor messages:", error);
      throw new Error(
        `Failed to retrieve instructor messages: ${error.message}`
      );
    }
  }

  /**
   * Helper method to group messages by conversation for better UI organization
   */
  private groupMessagesByConversation(messages: any[]) {
    const conversations = new Map();

    messages.forEach((message) => {
      let conversationKey;
      let conversationTitle;

      if (message.source.type === "course") {
        conversationKey = `course_${message.source.id}`;
        conversationTitle = `Course: ${message.source.title}`;
      } else {
        conversationKey = `cohort_${message.source.id}`;
        conversationTitle = `Cohort: ${message.source.title} (${message.source.courseTitle})`;
      }

      if (!conversations.has(conversationKey)) {
        conversations.set(conversationKey, {
          id: conversationKey,
          title: conversationTitle,
          type: message.source.type,
          entityId: message.source.id,
          roomId: message.roomId,
          lastMessage: message.content,
          lastMessageAt: message.sentAt,
          messages: [],
          unreadCount: 0, // Would need to track read status
        });
      }

      const conversation = conversations.get(conversationKey);
      if (conversation.messages.length < 5) {
        // Limit messages per conversation in this summary
        conversation.messages.push(message);
      }

      // Update last message if this is newer
      if (message.sentAt > conversation.lastMessageAt) {
        conversation.lastMessage = message.content;
        conversation.lastMessageAt = message.sentAt;
      }
    });

    return Array.from(conversations.values()).sort(
      (a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime()
    );
  }

  /**
   * Helper method to count unread messages
   * You would need to track read status in your database
   */
  private countUnreadMessages(messages: any[]) {
    // For now, returning 0 as we don't track read status yet
    // You would need to implement tracking of message read status
    return 0;
  }

  async debugCohortSocketRooms(roomId: string) {
    try {
      const roomName = `cohort_${roomId}`;
      const sockets = await this.io.in(roomName).fetchSockets();
      console.log(`Room ${roomName} has ${sockets.length} clients:`);

      sockets.forEach((socket) => {
        console.log(`- Socket ${socket.id}`);
      });

      return sockets.length;
    } catch (error) {
      console.error("Error debugging cohort socket rooms:", error);
      return 0;
    }
  }

  setupSocketHandlers() {
    this.io.on("connection", (socket) => {
      console.log("Socket connected:", socket.id);

      socket.on("requestTestAccess", () => {
        console.log("Test access requested for socket:", socket.id);
        this.grantTestAccess(socket.id);
        socket.emit("testAccessGranted");
      });

      socket.on("joinCourseRoom", async (payload) => {
        try {
          // Handle both string and object formats
          const courseRoomId =
            typeof payload === "object" ? payload.roomId : payload;

          console.log(
            `Socket ${socket.id} joining course room ${courseRoomId}`
          );

          if (this.testSockets.has(socket.id)) {
            console.log(
              `Test socket ${socket.id} joining course room ${courseRoomId}`
            );
            socket.join(`course_${courseRoomId}`);
            return;
          }

          const chatRoom = await this.prisma.courseChatRoom.findUnique({
            where: { id: courseRoomId },
          });

          if (!chatRoom) {
            console.error(`Course chat room not found: ${courseRoomId}`);
            return;
          }

          const enrollment = await this.prisma.enrollment.findFirst({
            where: {
              userId: socket.data.user.id,
              courseId: chatRoom.courseId,
            },
          });

          if (!enrollment) {
            throw new Error("Not enrolled in this course");
          }

          socket.join(`course_${courseRoomId}`);
          this.notifyRoomMembership(
            courseRoomId,
            socket.data.user.id,
            "joined"
          );
        } catch (error: any) {
          socket.emit("error", { message: error.message });
        }
      });

      socket.on("joinCohortRoom", async (payload) => {
        try {
          // Handle both string and object formats
          const cohortRoomId =
            typeof payload === "object" ? payload.roomId : payload;

          console.log(
            `Socket ${socket.id} joining cohort room ${cohortRoomId}`
          );

          if (this.testSockets.has(socket.id)) {
            console.log(
              `Test socket ${socket.id} joining cohort room ${cohortRoomId}`
            );
            socket.join(`cohort_${cohortRoomId}`);
            return;
          }

          const chatRoom = await this.prisma.cohortChatRoom.findUnique({
            where: { id: cohortRoomId },
          });

          if (!chatRoom) {
            console.error(`Cohort chat room not found: ${cohortRoomId}`);
            return;
          }

          const enrollment = await this.prisma.enrollment.findFirst({
            where: {
              userId: socket.data.user.id,
              cohortId: chatRoom.cohortId,
            },
          });

          if (!enrollment) {
            throw new Error("Not part of this cohort");
          }

          socket.join(`cohort_${cohortRoomId}`);
          this.notifyRoomMembership(
            cohortRoomId,
            socket.data.user.id,
            "joined"
          );
        } catch (error: any) {
          socket.emit("error", { message: error.message });
        }
      });

      socket.on(
        "debugRoom",
        async (data: { roomId: string; type?: "course" | "cohort" }) => {
          const roomId = typeof data === "object" ? data.roomId : data;
          const type = data.type || "course";

          let count = 0;
          if (type === "cohort") {
            count = await this.debugCohortSocketRooms(roomId);
          } else {
            count = await this.debugSocketRooms(roomId);
          }

          socket.emit("debugResult", { roomId, type, count });
        }
      );

      socket.on("disconnect", () => {
        if (this.testSockets.has(socket.id)) {
          this.testSockets.delete(socket.id);
          console.log(`Test socket ${socket.id} disconnected`);
        }
      });

      // Use authenticated user ID for messages
      socket.on(
        "courseChatMessage",
        async (data: { roomId: string; content: string }) => {
          try {
            console.log("Received course message:", data);

            // Make sure we have the user ID - either from socket.data or use a fallback for testing
            const userId = socket.data?.user?.id || "unknown-user";

            // Post the message which will broadcast to all clients
            const message = await this.postMessageToCourseChat(
              data.roomId,
              userId,
              data.content
            );

            // Send back confirmation to sender with message ID
            socket.emit("message_sent", {
              success: true,
              messageId: message.id,
            });
          } catch (error: any) {
            console.error("Error handling course message:", error);
            socket.emit("error", { message: error.message });
          }
        }
      );

      socket.on(
        "cohortChatMessage",
        async (data: { roomId: string; content: string }) => {
          try {
            console.log("Received cohort message:", data);

            // Make sure we have the user ID - either from socket.data or use a fallback for testing
            const userId = socket.data?.user?.id || "unknown-user";

            // Post the message which will broadcast to all clients EXCEPT sender
            const message = await this.postMessageToCohortChat(
              data.roomId,
              userId,
              data.content,
              socket.id
            );

            // Send back confirmation to sender with message ID
            socket.emit("message_sent", {
              success: true,
              messageId: message.id,
            });
          } catch (error: any) {
            console.error("Error handling cohort message:", error);
            socket.emit("error", { message: error.message });
          }
        }
      );

      socket.on("disconnect", () => {
        // Notify rooms about user departure
        socket.rooms.forEach((room) => {
          if (room.startsWith("course_") || room.startsWith("cohort_")) {
            this.notifyRoomMembership(room, socket.data.user.id, "left");
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
