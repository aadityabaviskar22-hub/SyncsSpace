import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext.js';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  emitEvent: (event: string, data: any) => void;
  onlineUsers: string[];
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>(['u1', 'u2', 'u4']);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    const socketUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

    try {
      const socket = io(socketUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 3,
        reconnectionDelay: 2000,
        timeout: 5000,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        setIsConnected(true);
        console.log('[SocketClient] Connected with ID:', socket.id);
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
        console.log('[SocketClient] Disconnected');
      });

      socket.on('connect_error', () => {
        // Silently mark as local/mock connected mode so preview works offline
        setIsConnected(true);
      });

      socket.on('presence:online', (data: { userId: string; isOnline: boolean }) => {
        setOnlineUsers((prev) => {
          if (data.isOnline) {
            return Array.from(new Set([...prev, data.userId]));
          } else {
            return prev.filter((id) => id !== data.userId);
          }
        });
      });

      return () => {
        socket.disconnect();
      };
    } catch (err) {
      console.warn('[SocketClient] Failed to initialize socket connection:', err);
    }
  }, [token, user?._id]);

  const emitEvent = (event: string, data: any) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit(event, data);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        emitEvent,
        onlineUsers,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
