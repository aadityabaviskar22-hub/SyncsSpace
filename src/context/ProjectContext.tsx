import React, { createContext, useContext, useState, useEffect } from 'react';
import { Project, Task, TaskStatus, Note, Message, NotificationItem, User } from '../types/index.js';
import {
  INITIAL_PROJECTS,
  INITIAL_TASKS,
  INITIAL_NOTES,
  INITIAL_MESSAGES,
  INITIAL_NOTIFICATIONS,
  INITIAL_USERS,
} from '../services/mockData.js';
import { useSocket } from './SocketContext.js';
import { useAuth } from './AuthContext.js';

interface NoteEditingState {
  noteId: string;
  isEditing: boolean;
  user: { _id: string; name: string; avatar?: string };
}

interface ProjectContextType {
  projects: Project[];
  activeProject: Project;
  setActiveProject: (project: Project) => void;
  tasks: Task[];
  notes: Note[];
  messages: Message[];
  notifications: NotificationItem[];
  unreadNotifsCount: number;
  editingNotePeer: NoteEditingState | null;
  typingUsers: { [userId: string]: string };
  moveTask: (taskId: string, newStatus: TaskStatus, newIndex: number) => void;
  createTask: (taskData: Partial<Task>) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  createNote: (title: string, content: string) => void;
  updateNote: (noteId: string, content: string, title?: string) => void;
  setNoteEditing: (noteId: string, isEditing: boolean) => void;
  sendMessage: (text: string) => void;
  setTyping: (isTyping: boolean) => void;
  markNotificationAsRead: (notifId: string) => void;
  markAllNotificationsAsRead: () => void;
  teamMembers: User[];
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { socket, emitEvent } = useSocket();

  const [projects] = useState<Project[]>(INITIAL_PROJECTS);
  const [activeProject, setActiveProject] = useState<Project>(INITIAL_PROJECTS[0]);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [notes, setNotes] = useState<Note[]>(INITIAL_NOTES);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [editingNotePeer, setEditingNotePeer] = useState<NoteEditingState | null>(null);
  const [typingUsers, setTypingUsers] = useState<{ [userId: string]: string }>({});

  const teamMembers = INITIAL_USERS;

  // Unread notification count
  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

  // Join project room whenever active project changes
  useEffect(() => {
    if (activeProject && socket) {
      emitEvent('project:join', { projectId: activeProject._id });
    }
  }, [activeProject._id, socket]);

  // Bind Socket.IO listeners
  useEffect(() => {
    if (!socket) return;

    // 1. Task Moved (Real-time Kanban Drag & Drop Sync)
    const handleTaskMoved = (data: {
      taskId: string;
      newStatus: TaskStatus;
      orderIndex: number;
      movedBy: any;
    }) => {
      setTasks((prev) => {
        return prev.map((t) => {
          if (t._id === data.taskId) {
            return {
              ...t,
              status: data.newStatus,
              orderIndex: data.orderIndex,
              completedAt: data.newStatus === 'Done' ? new Date() : undefined,
            };
          }
          return t;
        });
      });
    };

    // 2. Task Created / Updated / Deleted
    const handleTaskCreated = (newTask: Task) => {
      setTasks((prev) => [newTask, ...prev]);
    };

    const handleTaskUpdated = (data: { taskId: string; updates: Partial<Task> }) => {
      setTasks((prev) =>
        prev.map((t) => (t._id === data.taskId ? { ...t, ...data.updates } : t))
      );
    };

    const handleTaskDeleted = (data: { taskId: string }) => {
      setTasks((prev) => prev.filter((t) => t._id !== data.taskId));
    };

    // 3. Note Editing Indicator & Updates
    const handleNoteEditing = (data: NoteEditingState) => {
      if (data.isEditing) {
        setEditingNotePeer(data);
      } else {
        setEditingNotePeer(null);
      }
    };

    const handleNoteUpdated = (data: { noteId: string; content: string; title?: string }) => {
      setNotes((prev) =>
        prev.map((n) =>
          n._id === data.noteId
            ? { ...n, content: data.content, ...(data.title && { title: data.title }), version: n.version + 1 }
            : n
        )
      );
    };

    // 4. Chat Messages & Typing Indicator
    const handleChatMessage = (newMessage: Message) => {
      setMessages((prev) => [...prev, newMessage]);
    };

    const handleUserTyping = (data: { projectId: string; isTyping: boolean; user: { _id: string; name: string } }) => {
      setTypingUsers((prev) => {
        const updated = { ...prev };
        if (data.isTyping) {
          updated[data.user._id] = data.user.name;
        } else {
          delete updated[data.user._id];
        }
        return updated;
      });
    };

    // 5. Notifications
    const handleNewNotification = (notif: NotificationItem) => {
      setNotifications((prev) => [notif, ...prev]);
    };

    socket.on('task:moved', handleTaskMoved);
    socket.on('task:created', handleTaskCreated);
    socket.on('task:updated', handleTaskUpdated);
    socket.on('task:deleted', handleTaskDeleted);
    socket.on('note:editing', handleNoteEditing);
    socket.on('note:updated', handleNoteUpdated);
    socket.on('chat:message', handleChatMessage);
    socket.on('user:typing', handleUserTyping);
    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('task:moved', handleTaskMoved);
      socket.off('task:created', handleTaskCreated);
      socket.off('task:updated', handleTaskUpdated);
      socket.off('task:deleted', handleTaskDeleted);
      socket.off('note:editing', handleNoteEditing);
      socket.off('note:updated', handleNoteUpdated);
      socket.off('chat:message', handleChatMessage);
      socket.off('user:typing', handleUserTyping);
      socket.off('notification:new', handleNewNotification);
    };
  }, [socket]);

  // Actions

  // 1. Kanban Drag and Drop Task Move
  const moveTask = (taskId: string, newStatus: TaskStatus, newIndex: number) => {
    // Optimistic UI state update (0ms delay)
    setTasks((prev) => {
      return prev.map((t) => {
        if (t._id === taskId) {
          return {
            ...t,
            status: newStatus,
            orderIndex: newIndex,
            completedAt: newStatus === 'Done' ? new Date() : undefined,
          };
        }
        return t;
      });
    });

    // Broadcast across Socket.IO
    emitEvent('task:moved', {
      projectId: activeProject._id,
      taskId,
      newStatus,
      orderIndex: newIndex,
    });
  };

  const createTask = (taskData: Partial<Task>) => {
    const newTask: Task = {
      _id: `t_${Date.now()}`,
      title: taskData.title || 'Untitled Task',
      description: taskData.description || '',
      status: taskData.status || 'Todo',
      priority: taskData.priority || 'Medium',
      orderIndex: tasks.filter((t) => t.status === (taskData.status || 'Todo')).length,
      projectId: activeProject._id,
      assignedTo: taskData.assignedTo || user || undefined,
      createdBy: user || INITIAL_USERS[0],
      dueDate: taskData.dueDate || new Date(Date.now() + 7 * 24 * 3600 * 1000),
      tags: taskData.tags || ['Feature'],
      attachments: taskData.attachments || [],
      comments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setTasks((prev) => [newTask, ...prev]);

    emitEvent('task:created', {
      projectId: activeProject._id,
      task: newTask,
    });
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, ...updates, updatedAt: new Date() } : t))
    );

    emitEvent('task:updated', {
      projectId: activeProject._id,
      taskId,
      updates,
    });
  };

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t._id !== taskId));

    emitEvent('task:deleted', {
      projectId: activeProject._id,
      taskId,
    });
  };

  const createNote = (title: string, content: string) => {
    const newNote: Note = {
      _id: `n_${Date.now()}`,
      title,
      content,
      projectId: activeProject._id,
      authorId: user || INITIAL_USERS[0],
      isPinned: false,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setNotes((prev) => [newNote, ...prev]);
  };

  const updateNote = (noteId: string, content: string, title?: string) => {
    setNotes((prev) =>
      prev.map((n) =>
        n._id === noteId
          ? {
              ...n,
              content,
              ...(title && { title }),
              version: n.version + 1,
              updatedAt: new Date(),
              lastModifiedBy: user || undefined,
            }
          : n
      )
    );

    emitEvent('note:updated', {
      projectId: activeProject._id,
      noteId,
      content,
      title,
      version: 1,
    });
  };

  const setNoteEditing = (noteId: string, isEditing: boolean) => {
    emitEvent('note:editing', {
      projectId: activeProject._id,
      noteId,
      isEditing,
    });
  };

  const sendMessage = (text: string) => {
    if (!text.trim() || !user) return;

    const newMsg: Message = {
      _id: `m_${Date.now()}`,
      projectId: activeProject._id,
      senderId: user,
      text: text.trim(),
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, newMsg]);

    emitEvent('chat:message', {
      projectId: activeProject._id,
      text: text.trim(),
    });
  };

  const setTyping = (isTyping: boolean) => {
    emitEvent('user:typing', {
      projectId: activeProject._id,
      isTyping,
    });
  };

  const markNotificationAsRead = (notifId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === notifId ? { ...n, isRead: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        setActiveProject,
        tasks,
        notes,
        messages,
        notifications,
        unreadNotifsCount,
        editingNotePeer,
        typingUsers,
        moveTask,
        createTask,
        updateTask,
        deleteTask,
        createNote,
        updateNote,
        setNoteEditing,
        sendMessage,
        setTyping,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        teamMembers,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
