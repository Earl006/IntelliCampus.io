import { PrismaClient } from '@prisma/client';
import { injectable } from 'tsyringe';
import { EventEmitter } from 'events';

@injectable()
export default class AnnouncementService {
  private prisma: PrismaClient;
  private eventEmitter: EventEmitter;

  constructor() {
    this.prisma = new PrismaClient();
    this.eventEmitter = new EventEmitter();
  }

  async createAnnouncement(courseId: string, data: { title: string, content: string, instructorId: string }) {
    try {
      // Verify the instructor owns this course
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
        select: { instructorId: true }
      });

      if (!course) {
        throw new Error('Course not found');
      }

      if (course.instructorId !== data.instructorId) {
        throw new Error('You do not have permission to create announcements for this course');
      }

      // Since the Announcement model is commented out in the schema, 
      // we'll implement this using ChatMessage as a workaround until the model is added

      // First, get or create a course chat room
      const chatRoom = await this.prisma.courseChatRoom.findFirst({
        where: { courseId }
      }) || await this.prisma.courseChatRoom.create({
        data: { courseId }
      });

      // Create an announcement message
      const announcementContent = `📢 ANNOUNCEMENT: ${data.title}\n\n${data.content}`;
      
      const message = await this.prisma.chatMessage.create({
        data: {
          courseChatRoomId: chatRoom.id,
          senderId: data.instructorId,
          content: announcementContent
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      // Emit an event for real-time notifications
      this.eventEmitter.emit('announcement', {
        courseId,
        title: data.title,
        content: data.content,
        instructorId: data.instructorId,
        instructorName: `${message.sender.firstName} ${message.sender.lastName}`,
        sentAt: message.sentAt
      });

      // Get all enrollments for the course to notify students
      const enrollments = await this.prisma.enrollment.findMany({
        where: { courseId },
        select: { userId: true }
      });

      return {
        id: message.id, // Using message ID as announcement ID for now
        courseId,
        title: data.title,
        content: data.content,
        instructorId: data.instructorId,
        createdAt: message.sentAt,
        recipientCount: enrollments.length
      };
    } catch (error) {
      console.error('Error creating announcement:', error);
      throw new Error('Failed to create announcement');
    }
  }

  async getAnnouncementsForInstructor(instructorId: string) {
    try {
      // Get all courses by this instructor
      const courses = await this.prisma.course.findMany({
        where: { instructorId },
        select: { 
          id: true,
          title: true,
          chatRooms: {
            select: {
              id: true
            }
          }
        }
      });

      // Extract chat room IDs
      const chatRoomIds = courses
        .flatMap(course => course.chatRooms)
        .map(room => room.id);

      // Find messages that look like announcements
      const messages = await this.prisma.chatMessage.findMany({
        where: {
          courseChatRoomId: { in: chatRoomIds },
          senderId: instructorId,
          content: {
            startsWith: '📢 ANNOUNCEMENT:'
          }
        },
        orderBy: {
          sentAt: 'desc'
        },
        include: {
          courseChatRoom: {
            select: {
              courseId: true
            }
          }
        }
      });

      // Parse announcements from messages
      const announcements = messages.map(message => {
        const contentParts = message.content.replace('📢 ANNOUNCEMENT: ', '').split('\n\n');
        const title = contentParts[0];
        const content = contentParts.slice(1).join('\n\n');
        
        const course = courses.find(c => 
          c.chatRooms.some(room => room.id === message.courseChatRoomId)
        );

        return {
          id: message.id,
          courseId: message.courseChatRoom?.courseId,
          courseTitle: course?.title || 'Unknown Course',
          title,
          content,
          createdAt: message.sentAt
        };
      });

      return announcements;
    } catch (error) {
      console.error('Error getting announcements:', error);
      throw new Error('Failed to retrieve announcements');
    }
  }

  async getAnnouncementsForCourse(courseId: string) {
    try {
      // Get the course chat room
      const chatRoom = await this.prisma.courseChatRoom.findFirst({
        where: { courseId }
      });

      if (!chatRoom) {
        return [];
      }

      // Find messages that look like announcements
      const messages = await this.prisma.chatMessage.findMany({
        where: {
          courseChatRoomId: chatRoom.id,
          content: {
            startsWith: '📢 ANNOUNCEMENT:'
          }
        },
        orderBy: {
          sentAt: 'desc'
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      // Parse announcements from messages
      const announcements = messages.map(message => {
        const contentParts = message.content.replace('📢 ANNOUNCEMENT: ', '').split('\n\n');
        const title = contentParts[0];
        const content = contentParts.slice(1).join('\n\n');

        return {
          id: message.id,
          courseId,
          title,
          content,
          instructorId: message.senderId,
          instructorName: `${message.sender.firstName} ${message.sender.lastName}`,
          createdAt: message.sentAt
        };
      });

      return announcements;
    } catch (error) {
      console.error('Error getting course announcements:', error);
      throw new Error('Failed to retrieve course announcements');
    }
  }

  async deleteAnnouncement(announcementId: string, instructorId: string) {
    try {
      // Since we're using ChatMessage as our announcement storage,
      // we need to verify this message exists and belongs to the instructor
      const message = await this.prisma.chatMessage.findUnique({
        where: { id: announcementId },
        include: {
          courseChatRoom: {
            select: {
              course: {
                select: {
                  instructorId: true
                }
              }
            }
          }
        }
      });

      if (!message) {
        throw new Error('Announcement not found');
      }

      if (message.senderId !== instructorId && 
          message.courseChatRoom?.course?.instructorId !== instructorId) {
        throw new Error('You do not have permission to delete this announcement');
      }

      // Delete the chat message
      await this.prisma.chatMessage.delete({
        where: { id: announcementId }
      });

      return { success: true, id: announcementId };
    } catch (error) {
      console.error('Error deleting announcement:', error);
      throw new Error('Failed to delete announcement');
    }
  }

  // Get event emitter for real-time notification handling
  getEventEmitter() {
    return this.eventEmitter;
  }
}