import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment.js';
import { AuthService } from './auth.service.js';
import { Activity } from '../models/activity.model.js';

@Injectable({
  providedIn: 'root',
})
export class AdminSocketService {
  private socket: Socket | null = null;
  private readonly activitySubject = new Subject<Activity>();
  private readonly presenceSubject = new Subject<any>();

  readonly isConnected = signal<boolean>(false);
  readonly onlineUsersCount = signal<number>(0);

  constructor(private authService: AuthService) {}

  connect(): void {
    if (this.socket && this.socket.connected) return;

    const token = this.authService.getAccessToken();
    if (!token) return;

    this.socket = io(environment.socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      this.isConnected.set(true);
      console.log('[AdminSocket] Connected successfully with ID:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      this.isConnected.set(false);
      console.log('[AdminSocket] Disconnected from real-time stream.');
    });

    // Listen to real-time activity events broadcast from backend
    this.socket.on('activity:logged', (activity: Activity) => {
      this.activitySubject.next(activity);
    });

    // Listen to global presence updates
    this.socket.on('presence:online', (data: any) => {
      this.presenceSubject.next(data);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected.set(false);
    }
  }

  onActivityLogged(): Observable<Activity> {
    return this.activitySubject.asObservable();
  }

  onPresenceUpdate(): Observable<any> {
    return this.presenceSubject.asObservable();
  }
}
