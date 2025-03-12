import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage } from '../../services/chat.service';
import { Subject, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap, takeUntil } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-chat-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-drawer.component.html',
  styleUrl: './chat-drawer.component.css'
})
export class ChatDrawerComponent implements OnInit, OnDestroy, OnChanges {
  @Input() roomId: string | null = null;
  @Input() roomType: 'course' | 'cohort' | null = null;
  @Input() roomName = '';
  @Input() isOpen = false;
  @Input() messageDelay: number = 100;
  @Output() close = new EventEmitter<void>();

  messages: ChatMessage[] = [];
  newMessage = '';
  isConnecting = false;
  userId = '';
  private destroy$ = new Subject<void>();

  // Add a cache for user names
  private userNameCache: Map<string, string> = new Map();

  constructor(
    private chatService: ChatService, 
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    // Get user ID from the JWT token instead of localStorage
    const token = this.authService.getToken();
    if (token) {
      try {
        // Use jwtDecode or a similar method to decode the token
        const decoded = jwtDecode<any>(token);
        this.userId = decoded.id || '';
        console.log('Decoded user ID:', this.userId);
      } catch (e) {
        console.error('Error parsing JWT token', e);
      }
    }
    
    // Subscribe to messages and fetch user names
    this.chatService.messages$
      .pipe(takeUntil(this.destroy$))
      .subscribe(messages => {
        // Process each message and fetch user names
        this.processMessagesWithUserNames(messages);
      });

    this.chatService.isConnected$
      .pipe(takeUntil(this.destroy$))
      .subscribe(connected => {
        this.isConnecting = !connected;
      });

    if (this.roomId && this.roomType) {
      this.joinRoom();
    }

    // Debug socket status after a small delay
    setTimeout(() => this.debugSocketStatus(), 2000);

    // Debug socket messages
    this.chatService.messages$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(messages => {
      console.log(`Messages updated - count: ${messages.length}`);
    });

    // Add this after your existing socket status debug code
    setTimeout(() => {
      console.log('DEBUG: Manually triggering message refresh');
      // Force a refresh of the messages
      const currentMessages = this.chatService.getCurrentMessages();
      this.processMessagesWithUserNames(currentMessages);
    }, 3000);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Check if roomId or roomType changed and if both are available
    if ((changes['roomId'] || changes['roomType']) && this.roomId && this.roomType) {
      console.log(`Room data changed, joining ${this.roomType} room ${this.roomId}`);
      this.joinRoom();
    }
  }

  joinRoom(): void {
    if (!this.roomId || !this.roomType) {
      console.error('Cannot join room: missing roomId or roomType');
      return;
    }

    console.log(`Joining ${this.roomType} room ${this.roomId}`);
    
    if (this.roomType === 'course') {
      this.chatService.joinCourseRoom(this.roomId);
    } else {
      this.chatService.joinCohortRoom(this.roomId);
    }
  }

  debugConnection(): void {
    this.chatService.debugSocketListeners();
  }

  

  sendMessage(): void {
    if (!this.newMessage.trim()) return;
    
    console.log('Sending message:', this.newMessage);
    this.chatService.sendMessage(this.newMessage.trim());
    this.newMessage = '';
    
    // Debug messages
    setTimeout(() => this.logMessages(), 500);
  }

  closeDrawer(): void {
    this.close.emit();
  }

  private scrollToBottom(): void {
    const chatContainer = document.querySelector('.chat-messages');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }

  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatDate(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  }

  // Fix the debugSocketStatus method to not blindly attempt joining a room
  debugSocketStatus(): void {
    const status = this.chatService.getSocketStatus();
    console.log('Socket status:', status);
    
    if (!status.connected) {
      // Try reconnecting but don't auto-join room
      this.chatService.connect();
      
      // Only attempt to join if we have roomId and roomType
      if (this.roomId && this.roomType) {
        setTimeout(() => {
          console.log('Reconnection check:', this.chatService.getSocketStatus());
          this.joinRoom();
        }, 1000);
      }
    }
  }

  // Add this new method to process messages and fetch user names
  private processMessagesWithUserNames(messages: ChatMessage[]): void {
    if (!messages.length) {
      this.messages = [];
      return;
    }
    
    // First, set messages with cached names or placeholders
    this.messages = messages.map(msg => {
      const isMine = msg.senderId === this.userId;
      
      // If it's the current user's message
      if (isMine) {
        return {
          ...msg,
          content: `${msg.content}`,
          senderName: 'You'
        };
      }
      
      // If we have the name cached
      if (this.userNameCache.has(msg.senderId)) {
        return {
          ...msg,
          senderName: this.userNameCache.get(msg.senderId)!
        };
      }
      
      // Default to "User" until we get the name
      return {
        ...msg,
        senderName: 'Loading...'
      };
    });
    
    // Then fetch missing names
    const uniqueSenderIds = [...new Set(
      messages
        .filter(msg => msg.senderId !== this.userId && !this.userNameCache.has(msg.senderId))
        .map(msg => msg.senderId)
    )];
    
    // Fetch names for each unique sender
    uniqueSenderIds.forEach(senderId => {
      this.userService.getUserNameById(senderId)
        .pipe(
          takeUntil(this.destroy$),
          catchError(() => of({ success: false, data: 'Unknown User' }))
        )
        .subscribe(response => {
          if (response.success && response.data) {
            // Update the cache
            this.userNameCache.set(senderId, response.data);
            
            // Update messages with the new name
            this.messages = this.messages.map(msg => {
              if (msg.senderId === senderId) {
                return {
                  ...msg,
                  senderName: response.data
                };
              }
              return msg;
            });
          }
        });
    });
    
    // After setting this.messages, scroll to bottom
    setTimeout(() => this.scrollToBottom(), 100);
  }

  // Add to your ChatDrawerComponent
  logMessages(): void {
    console.log('Current message count:', this.messages.length);
    console.log('Messages:', this.messages);
  }
}