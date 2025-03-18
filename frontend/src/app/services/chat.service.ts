import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import {jwtDecode} from 'jwt-decode';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private socket: Socket | null = null;
  private connected = new BehaviorSubject<boolean>(false);
  private currentMessages = new BehaviorSubject<ChatMessage[]>([]);
  private activeRoomId: string | null = null;
  private activeRoomType: 'course' | 'cohort' | null = null;

  constructor(private authService: AuthService, private http: HttpClient) {}

  connect(): void {
    if (this.socket) {
      // If socket exists and is connected, do nothing
      if (this.socket.connected) {
        console.log('Socket already connected');
        this.connected.next(true);
        return;
      }
      
      // If socket exists but is disconnected, disconnect it first
      this.socket.disconnect();
      this.socket = null;
    }

    const token = this.authService.getToken();
    if (!token) {
      console.error('No auth token available for socket connection');
      return;
    }

    // Add debug logs
    console.log('Attempting to connect to socket server:', environment.apiUrl);
    
    // Create socket with better error handling
    this.socket = io(environment.apiUrl, {
      auth: { token },
      transports: ['websocket', 'polling'], // Try both transport methods
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000 // Increase timeout
    });

    // Setup enhanced listeners
    this.setupSocketListeners();
  }

  // Modify your setupSocketListeners method
  private setupSocketListeners(): void {
    if (!this.socket) return;
    
    console.log('Setting up socket listeners');
    
    // Remove previous listeners to avoid duplicates
    this.socket.removeAllListeners('course_message');
    this.socket.removeAllListeners('cohort_message');
    this.socket.removeAllListeners('message');
    
    // Basic connection events
    this.socket.on('connect', () => {
      console.log('Connected to chat server!', this.socket?.id);
      this.connected.next(true);
      
      // IMPORTANT: Re-join room after reconnection
      if (this.activeRoomId && this.activeRoomType) {
        console.log(`Rejoining ${this.activeRoomType} room after reconnect: ${this.activeRoomId}`);
        
        if (this.activeRoomType === 'course') {
          this.socket?.emit('joinCourseRoom', { roomId: this.activeRoomId });
        } else {
          this.socket?.emit('joinCohortRoom', { roomId: this.activeRoomId });
        }
      }
    });
    
    // Listen for ALL possible event names used by server
    this.socket.on('message', (message: any) => {
      console.log('Received message broadcast:', message);
      this.processIncomingMessage(message);
    });

    this.socket.on('course_message', (message: any) => {
      console.log('Received course_message broadcast:', message);
      this.processIncomingMessage(message);
    });
    
    this.socket.on('courseChatMessage', (message: any) => {
      console.log('Received courseChatMessage broadcast:', message);
      this.processIncomingMessage(message);
    });

    this.socket.on('cohort_message', (message: any) => {
      console.log('Received cohort_message broadcast:', message);
      this.processIncomingMessage(message);
    });
    
    this.socket.on('cohortChatMessage', (message: any) => {
      console.log('Received cohortChatMessage broadcast:', message);
      this.processIncomingMessage(message);
    });
    
    // Listen for errors
    this.socket.on('error', (error) => {
      console.error('Socket error received:', error);
    });
  }

  // Add this helper method to process any incoming message
  private processIncomingMessage(message: any) {
    console.log('Processing message:', message);
    
    // Check if this message belongs to the active room
    const isCourseMessage = message.courseChatRoomId && this.activeRoomType === 'course';
    const isCohortMessage = message.cohortChatRoomId && this.activeRoomType === 'cohort';
    
    const messageRoomId = isCourseMessage ? message.courseChatRoomId : 
                          (isCohortMessage ? message.cohortChatRoomId : message.roomId);
    
    if ((isCourseMessage || isCohortMessage) && messageRoomId === this.activeRoomId) {
      // Transform message to your standard format
      const chatMessage: ChatMessage = {
        id: message.id || `msg-${Date.now()}`,
        roomId: messageRoomId,
        senderId: message.senderId,
        content: message.content,
        senderName: '', // Will be filled by your user service
        timestamp: message.sentAt || message.timestamp || new Date().toISOString(),
        isRead: false
      };
      
      // Get current messages
      const currentMessages = this.currentMessages.getValue();
      
      // Check if this is a duplicate (sometimes happens with socket broadcasts)
      const existingMessage = currentMessages.find(msg => 
        msg.id === chatMessage.id || 
        (msg.senderId === chatMessage.senderId && 
         msg.content === chatMessage.content && 
         msg.timestamp === chatMessage.timestamp)
      );
      
      // Only add if not already in the list
      if (!existingMessage) {
        console.log('Adding new received message to chat');
        this.currentMessages.next([...currentMessages, chatMessage]);
      } else {
        console.log('Message already exists in list, not adding duplicate');
      }
    } else {
      console.log('Message not for current room, ignoring');
    }
  }

  private addMessageToStream(message: ChatMessage): void {
    const currentMsgs = this.currentMessages.value;
    this.currentMessages.next([...currentMsgs, message]);
  }

  joinCourseRoom(roomId: string): void {
    console.log('Joining course room:', roomId);
    
    // First leave any current room
    this.leaveCurrentRoom();
    
    // Set active room
    this.activeRoomId = roomId;
    this.activeRoomType = 'course';
    
    // Then emit join event
    if (this.socket && this.socket.connected) {
      console.log('Emitting joinCourseRoom event for room:', roomId);
      this.socket.emit('joinCourseRoom', { roomId });
      
      // Load chat history 
      this.loadChatHistory(roomId, 'course');
    } else {
      console.error('Socket not connected, cannot join room');
      this.connect();
      // Try again after connection
      setTimeout(() => {
        if (this.socket && this.socket.connected) {
          this.socket.emit('joinCourseRoom', { roomId });
          this.loadChatHistory(roomId, 'course');
        }
      }, 1000);
    }
  }
  getCurrentMessages(): ChatMessage[] {
    return this.currentMessages.getValue();
  }
  
  joinCohortRoom(roomId: string): void {
    console.log('Joining cohort room:', roomId);
    
    if (!this.socket || !this.socket.connected) {
      console.log('Socket not connected, connecting now...');
      this.connect();
      
      // Wait until connected before joining
      const connectionCheck = setInterval(() => {
        if (this.socket?.connected) {
          clearInterval(connectionCheck);
          this._joinCohortRoom(roomId);
        }
      }, 500);
      
      // Timeout after 5 seconds
      setTimeout(() => clearInterval(connectionCheck), 5000);
      return;
    }
    
    this._joinCohortRoom(roomId);
  }
  
  private _joinCohortRoom(roomId: string): void {
    this.leaveCurrentRoom();
    this.activeRoomId = roomId;
    this.activeRoomType = 'cohort';
    
    console.log('Emitting joinCohortRoom event for room:', roomId);
    this.socket?.emit('joinCohortRoom', roomId, (response: any) => {
      console.log('Join cohort room response:', response);
    });
    
    this.loadChatHistory(roomId, 'cohort');
  }

  private leaveCurrentRoom(): void {
    if (this.activeRoomId) {
      console.log(`Leaving ${this.activeRoomType} room: ${this.activeRoomId}`);
      
      if (this.activeRoomType === 'course') {
        this.socket?.emit('leaveCourseRoom', this.activeRoomId);
      } else if (this.activeRoomType === 'cohort') {
        this.socket?.emit('leaveCohortRoom', this.activeRoomId);
      }
      
      this.currentMessages.next([]);
      this.activeRoomId = null;
      this.activeRoomType = null;
    }
  }

  sendMessage(content: string): void {
    if (!this.socket || !this.activeRoomId || !this.activeRoomType) {
      console.error('Cannot send message: no active room');
      return;
    }

    console.log(`Sending message to ${this.activeRoomType} room ${this.activeRoomId}: ${content}`);

    // Create a temporary local message
    const localMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      roomId: this.activeRoomId,
      senderId: this.getUserId(), // Add a method to get the current user ID
      content: content,
      senderName: 'You', // This will be overwritten by the processor
      timestamp: new Date().toISOString(),
      isRead: true
    };

    // Add the message to the current messages array immediately
    const currentMessages = this.currentMessages.getValue();
    this.currentMessages.next([...currentMessages, localMessage]);

    // Then send via socket
    if (this.activeRoomType === 'course') {
      this.socket.emit('courseChatMessage', {
        roomId: this.activeRoomId,
        content
      });
    } else {
      this.socket.emit('cohortChatMessage', {
        roomId: this.activeRoomId,
        content
      });
    }
  }

  // Helper method to extract user ID from token
  private getUserId(): string {
    try {
      const token = this.authService.getToken();
      if (token) {
        const decoded = jwtDecode<any>(token);
        return decoded.id || '';
      }
    } catch (e) {
      console.error('Error getting user ID', e);
    }
    return '';
  }

  private transformBackendMessage(message: any, type: 'course' | 'cohort'): ChatMessage {
    return {
      id: message.id,
      roomId: type === 'course' ? message.courseChatRoomId : message.cohortChatRoomId,
      senderId: message.senderId,
      senderName: message.senderName || 'Unknown User', // Fallback if missing
      content: message.content,
      timestamp: message.sentAt, // Use the sentAt field
      isRead: message.isRead || false // Default to false if not provided
    };
  }

  async loadChatHistory(roomId: string, type: 'course' | 'cohort'): Promise<void> {
    try {
      console.log(`Loading ${type} chat history for room ${roomId}`);
      
      const endpoint = type === 'course' 
        ? `/api/chat/course/${roomId}/messages`
        : `/api/chat/cohort/${roomId}/messages`;
      
      const fullUrl = `${environment.apiUrl}${endpoint}`;
      console.log('Fetching chat history from:', fullUrl);
      
      const token = this.authService.getToken();
      console.log('Using auth token:', token ? `${token.substring(0, 15)}...` : 'No token');
      
      const response = await fetch(fullUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Chat history response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`Failed to load chat history: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Chat history data:', data);
      
      if (data.success && Array.isArray(data.data)) {
        console.log(`Loaded ${data.data.length} messages`);
        // Transform messages before updating the BehaviorSubject
        const transformedMessages = data.data.map((msg: any) => this.transformBackendMessage(msg, type));
        this.currentMessages.next(transformedMessages);
      } else {
        console.error('Unexpected response format:', data);
        this.currentMessages.next([]);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      this.currentMessages.next([]);
    }
  }

  disconnect(): void {
    if (this.socket) {
      console.log('Disconnecting socket');
      this.socket.disconnect();
      this.socket = null;
      this.connected.next(false);
    }
  }

  get isConnected$(): Observable<boolean> {
    return this.connected.asObservable();
  }

  get messages$(): Observable<ChatMessage[]> {
    return this.currentMessages.asObservable();
  }
  
  // Add this method for debugging
  getSocketStatus(): { connected: boolean, id: string | null, transport?: string } {
    if (!this.socket) {
      return { connected: false, id: null };
    }
    
    return {
      connected: this.socket.connected,
      id: this.socket.id ?? null,
      transport: this.socket.io.engine?.transport?.name
    };
  }

  // Debug method to list all socket listeners
  debugSocketListeners(): void {
    if (!this.socket) {
      console.log('No socket connection');
      return;
    }
    
    console.log('Socket ID:', this.socket.id);
    console.log('Socket connected:', this.socket.connected);
    console.log('Socket rooms:', this.activeRoomType, this.activeRoomId);
    
    // List event handlers
    const listeners = (this.socket as any).hasListeners('course_message');
    console.log('Has course_message listeners:', listeners);
  }


  /**
 * Get all messages for an instructor across courses and cohorts
 * @returns Observable with instructor messages organized by conversation
 */
getInstructorMessages(): Observable<any> {
  const url = `${environment.apiUrl}/chat/instructor/messages`;
  const token = this.authService.getToken();
  
  return this.http.get<any>(url, {
    headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
  }).pipe(catchError(error => {
    console.error('Error fetching instructor messages:', error);
    return throwError(() => new Error('Failed to fetch instructor messages'));
  }));
}

/**
 * Mark multiple messages as read
 * @param messageIds Array of message IDs to mark as read
 * @returns Observable with confirmation
 */
markMessagesAsRead(messageIds: string[]): Observable<any> {
  const url = `${environment.apiUrl}/chat/instructor/mark-read`;
  const token = this.authService.getToken();
  
  return this.http.post<any>(url, { messageIds }, {
    headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
  }).pipe(catchError(error => {
    console.error('Error marking messages as read:', error);
    return throwError(() => new Error('Failed to mark messages as read'));
  }));
}
  
}