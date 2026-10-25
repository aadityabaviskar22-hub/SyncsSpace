import React, { useState, useEffect } from 'react';
import {
  FolderTree,
  Database,
  Globe,
  Radio,
  ShieldCheck,
  Server,
  Layers,
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  Search,
  ExternalLink,
  Users,
  CheckCircle2,
  Lock,
  Cpu,
  FileCode,
  Tag,
  ArrowRight,
  Sparkles,
  BookOpen,
  FolderKanban,
  FileText,
  MessageSquare,
  TrendingUp,
  History,
  Shield,
  Clock,
  Plus,
} from 'lucide-react';
import { ToastProvider, useToast } from './context/ToastContext.js';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { SocketProvider } from './context/SocketContext.js';
import { ProjectProvider } from './context/ProjectContext.js';
import { KanbanBoard } from './components/Kanban/KanbanBoard.js';
import { NotesWorkspace } from './components/Notes/NotesWorkspace.js';
import { ChatDrawer } from './components/Chat/ChatDrawer.js';
import { AnalyticsDashboard } from './components/Analytics/AnalyticsDashboard.js';
import { UserManagement } from './components/Admin/UserManagement.js';
import { ActivityAuditLog } from './components/Admin/ActivityAuditLog.js';
import { UserRole } from './types/index.js';

// --- DATA STRUCTURES ---

interface SchemaField {
  name: string;
  type: string;
  required?: boolean;
  unique?: boolean;
  ref?: string;
  enum?: string[];
  default?: string;
  description: string;
}

interface MongoSchema {
  id: string;
  name: string;
  collection: string;
  description: string;
  relationships: string[];
  indexes: string[];
  fields: SchemaField[];
}

interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  role: 'Public' | 'Member' | 'Manager' | 'Admin' | 'Authenticated';
  purpose: string;
  category: 'Auth' | 'Users' | 'Projects' | 'Tasks' | 'Notes' | 'Messages' | 'Admin & Analytics' | 'Notifications';
  requestBody?: string;
  responseDesc: string;
}

interface SocketEvent {
  name: string;
  payload: string;
  emitter: 'React Client' | 'Angular Admin' | 'Node.js Backend';
  listeners: string;
  roomScope: string;
  purpose: string;
}

const MONOREPO_TREE = [
  {
    name: 'backend/',
    desc: 'Node.js + Express API & Socket.IO server',
    type: 'dir',
    children: [
      {
        name: 'src/',
        type: 'dir',
        children: [
          { name: 'config/', type: 'dir', desc: 'db.ts (Mongoose), jwt.ts, redis.ts (optional socket adapter)' },
          { name: 'controllers/', type: 'dir', desc: 'auth.controller, project.controller, task.controller, note.controller, chat.controller, analytics.controller' },
          { name: 'middlewares/', type: 'dir', desc: 'auth.middleware (verify JWT), role.middleware (check Role), validation.middleware (Joi/Zod), errorHandler.middleware' },
          { name: 'models/', type: 'dir', desc: 'User.ts, Project.ts, Task.ts, Note.ts, Message.ts, Activity.ts, Notification.ts' },
          { name: 'routes/', type: 'dir', desc: 'auth.routes, project.routes, task.routes, note.routes, chat.routes, admin.routes' },
          { name: 'sockets/', type: 'dir', desc: 'socketServer.ts, socketAuth.ts, handlers/ (taskEvents, chatEvents, noteEvents, presenceEvents)' },
          { name: 'utils/', type: 'dir', desc: 'logger.ts, apiResponse.ts, seedDatabase.ts' },
          { name: 'server.ts', type: 'file', desc: 'HTTP + Socket.IO server bootstrapping and graceful shutdown' },
          { name: 'app.ts', type: 'file', desc: 'Express app configuration, CORS, rate limiter, helmet, JSON parsers' }
        ]
      },
      { name: '.env.example', type: 'file', desc: 'PORT, MONGO_URI, JWT_SECRET, JWT_EXPIRES_IN, CLIENT_ORIGIN, ADMIN_ORIGIN' },
      { name: 'Dockerfile', type: 'file', desc: 'Multi-stage Node.js Alpine build' },
      { name: 'package.json', type: 'file', desc: 'Express, Mongoose, Socket.IO, bcryptjs, jsonwebtoken, cors, dotenv' },
      { name: 'tsconfig.json', type: 'file', desc: 'TypeScript compiler configuration' }
    ]
  },
  {
    name: 'react-client/',
    desc: 'Vite + React SPA for Team Members & Managers (Tasks, Notes, Real-time Chat & Boards)',
    type: 'dir',
    children: [
      {
        name: 'src/',
        type: 'dir',
        children: [
          { name: 'assets/', type: 'dir', desc: 'Logos, illustration SVGs, notification sound effects' },
          { name: 'components/', type: 'dir', desc: 'KanbanBoard/, TaskCard/, RichTextNote/, ChatDrawer/, PresenceAvatar/, Navbar/, Modal/' },
          { name: 'context/', type: 'dir', desc: 'AuthContext.tsx, SocketContext.tsx, ProjectContext.tsx' },
          { name: 'hooks/', type: 'dir', desc: 'useSocket.ts, useTasks.ts, useChat.ts, useDebounce.ts, usePresence.ts' },
          { name: 'pages/', type: 'dir', desc: 'Login.tsx, Register.tsx, Dashboard.tsx, ProjectView.tsx, TaskDetail.tsx, NotesWorkspace.tsx' },
          { name: 'services/', type: 'dir', desc: 'api.ts (Axios interceptor with JWT attach), socket.ts' },
          { name: 'types/', type: 'dir', desc: 'index.ts (TypeScript interfaces mirroring backend models)' },
          { name: 'App.tsx', type: 'file', desc: 'Client routing with ProtectedRoute and RoleRoute' },
          { name: 'main.tsx', type: 'file', desc: 'React root mounting with Context Providers' }
        ]
      },
      { name: 'Dockerfile', type: 'file', desc: 'Build with Vite, serve via Nginx' },
      { name: 'nginx.conf', type: 'file', desc: 'SPA rewrite rule to index.html and reverse proxy for /api and /socket.io' },
      { name: 'package.json', type: 'file', desc: 'React, Vite, Socket.io-client, Axios, Lucide-react, TailwindCSS' }
    ]
  },
  {
    name: 'angular-admin/',
    desc: 'Angular 18/19 SPA for System Administrators (User CRUD, Audit Logs, Analytics Charts, System Health)',
    type: 'dir',
    children: [
      {
        name: 'src/',
        type: 'dir',
        children: [
          {
            name: 'app/',
            type: 'dir',
            children: [
              { name: 'core/', type: 'dir', desc: 'Guards (admin.guard.ts), Interceptors (jwt.interceptor.ts, error.interceptor.ts), Services (auth.service.ts, socket.service.ts)' },
              { name: 'features/', type: 'dir', desc: 'dashboard/ (Analytics & Charts), users/ (CRUD table & role editor), projects/ (global list), audit-logs/' },
              { name: 'shared/', type: 'dir', desc: 'Components (stat-card, confirmation-dialog, data-table), Pipes, Directives' },
              { name: 'app.routes.ts', type: 'file', desc: 'Angular standalone routes with admin authentication guard' },
              { name: 'app.config.ts', type: 'file', desc: 'Application config with provideHttpClient and provideAnimations' }
            ]
          },
          { name: 'environments/', type: 'dir', desc: 'environment.ts, environment.prod.ts (API & Socket endpoints)' }
        ]
      },
      { name: 'Dockerfile', type: 'file', desc: 'Angular build and lightweight Nginx alpine container' },
      { name: 'angular.json', type: 'file', desc: 'Angular workspace CLI configuration' },
      { name: 'package.json', type: 'file', desc: '@angular/core, @angular/common, socket.io-client, chart.js / ng2-charts' }
    ]
  },
  {
    name: 'docker-compose.yml',
    type: 'file',
    desc: 'Multi-container orchestration for backend (5000), react-client (3000), angular-admin (4200), and mongo (27017)'
  },
  {
    name: '.gitignore',
    type: 'file',
    desc: 'node_modules, dist, .env, mongo_data volume mounts'
  },
  {
    name: 'README.md',
    type: 'file',
    desc: 'Monorepo setup guide, environment variables, architecture flow, and seed scripts'
  }
];

const MONGO_SCHEMAS: MongoSchema[] = [
  {
    id: 'user',
    name: 'User',
    collection: 'users',
    description: 'System user accounts with role-based access control, hashed passwords, and online presence tracking.',
    relationships: [
      '1 User -> Many Projects (as owner/manager or member)',
      '1 User -> Many Tasks (assignedTo, createdBy)',
      '1 User -> Many Messages (senderId)',
      '1 User -> Many Notes (authorId, collaborators)'
    ],
    indexes: ['email (unique)', 'role (filtering)', 'isOnline (presence)'],
    fields: [
      { name: '_id', type: 'ObjectId', required: true, description: 'Primary unique identifier' },
      { name: 'name', type: 'String', required: true, description: 'Full user display name' },
      { name: 'email', type: 'String', required: true, unique: true, description: 'Normalized lowercase email used for login' },
      { name: 'password', type: 'String', required: true, description: 'Bcrypt hashed password (select: false in queries)' },
      { name: 'role', type: 'String', required: true, enum: ['Admin', 'Manager', 'Member'], default: "'Member'", description: 'RBAC authorization level' },
      { name: 'avatar', type: 'String', description: 'URL or Gravatar link for user avatar' },
      { name: 'department', type: 'String', description: 'Engineering, Product, Design, QA' },
      { name: 'isOnline', type: 'Boolean', default: 'false', description: 'Real-time presence indicator updated via socket' },
      { name: 'lastActiveAt', type: 'Date', default: 'Date.now', description: 'Timestamp of last user ping or socket disconnect' },
      { name: 'createdAt', type: 'Date', default: 'Date.now', description: 'Mongoose timestamps' },
      { name: 'updatedAt', type: 'Date', default: 'Date.now', description: 'Mongoose timestamps' }
    ]
  },
  {
    id: 'project',
    name: 'Project',
    collection: 'projects',
    description: 'Central collaborative workspace containing tasks, notes, messages, and assigned team members.',
    relationships: [
      '1 Project -> 1 User (createdBy / manager)',
      '1 Project -> Many Users (members)',
      '1 Project -> Many Tasks (projectId)',
      '1 Project -> Many Notes (projectId)',
      '1 Project -> Many Messages (projectId room)'
    ],
    indexes: ['createdBy (manager lookup)', 'members (member lookup)', 'status'],
    fields: [
      { name: '_id', type: 'ObjectId', required: true, description: 'Primary unique identifier' },
      { name: 'title', type: 'String', required: true, description: 'Project name / title' },
      { name: 'description', type: 'String', description: 'Detailed project objectives and scope' },
      { name: 'status', type: 'String', required: true, enum: ['Planning', 'Active', 'On-Hold', 'Completed'], default: "'Active'", description: 'Project lifecycle phase' },
      { name: 'priority', type: 'String', enum: ['Low', 'Medium', 'High', 'Critical'], default: "'Medium'", description: 'Overall urgency' },
      { name: 'createdBy', type: 'ObjectId', ref: 'User', required: true, description: 'Manager or Admin who created the workspace' },
      { name: 'members', type: '[ObjectId]', ref: 'User', description: 'Array of user IDs who have access to project data & socket rooms' },
      { name: 'startDate', type: 'Date', description: 'Scheduled kickoff date' },
      { name: 'dueDate', type: 'Date', description: 'Target delivery deadline' },
      { name: 'createdAt', type: 'Date', default: 'Date.now', description: 'Creation timestamp' },
      { name: 'updatedAt', type: 'Date', default: 'Date.now', description: 'Last modification timestamp' }
    ]
  },
  {
    id: 'task',
    name: 'Task',
    collection: 'tasks',
    description: 'Work items tracked in Kanban boards (To-Do, In-Progress, Review, Done) with real-time drag-and-drop sync.',
    relationships: [
      'Many Tasks -> 1 Project (projectId)',
      'Many Tasks -> 1 User (assignedTo)',
      'Many Tasks -> 1 User (createdBy)'
    ],
    indexes: ['projectId, status', 'assignedTo', 'orderIndex (Kanban sequence)'],
    fields: [
      { name: '_id', type: 'ObjectId', required: true, description: 'Primary unique identifier' },
      { name: 'title', type: 'String', required: true, description: 'Task title / short summary' },
      { name: 'description', type: 'String', description: 'Markdown task details and acceptance criteria' },
      { name: 'status', type: 'String', required: true, enum: ['Todo', 'InProgress', 'InReview', 'Done'], default: "'Todo'", description: 'Kanban column' },
      { name: 'priority', type: 'String', enum: ['Low', 'Medium', 'High', 'Urgent'], default: "'Medium'", description: 'Task priority tag' },
      { name: 'orderIndex', type: 'Number', default: '0', description: 'Position order within the Kanban column for fluid drag-drop reordering' },
      { name: 'projectId', type: 'ObjectId', ref: 'Project', required: true, description: 'Foreign key to parent project' },
      { name: 'assignedTo', type: 'ObjectId', ref: 'User', description: 'Assigned team member' },
      { name: 'createdBy', type: 'ObjectId', ref: 'User', required: true, description: 'Creator (Member or Manager)' },
      { name: 'dueDate', type: 'Date', description: 'Task completion deadline' },
      { name: 'tags', type: '[String]', description: 'Custom labels (e.g., Bug, Feature, Frontend, API)' },
      { name: 'createdAt', type: 'Date', default: 'Date.now', description: 'Creation timestamp' }
    ]
  },
  {
    id: 'note',
    name: 'Note',
    collection: 'notes',
    description: 'Real-time synchronized project documentation, sprint meeting minutes, or scratchpads with versioning.',
    relationships: [
      'Many Notes -> 1 Project (projectId)',
      'Many Notes -> 1 User (authorId)',
      'Many Notes -> Many Users (lastModifiedBy)'
    ],
    indexes: ['projectId', 'authorId'],
    fields: [
      { name: '_id', type: 'ObjectId', required: true, description: 'Primary unique identifier' },
      { name: 'title', type: 'String', required: true, description: 'Document title' },
      { name: 'content', type: 'String', default: "''", description: 'Markdown or Delta rich text payload' },
      { name: 'projectId', type: 'ObjectId', ref: 'Project', required: true, description: 'Parent project association' },
      { name: 'authorId', type: 'ObjectId', ref: 'User', required: true, description: 'Creator of the note' },
      { name: 'lastModifiedBy', type: 'ObjectId', ref: 'User', description: 'Last user who edited note contents' },
      { name: 'isPinned', type: 'Boolean', default: 'false', description: 'Pinned to project dashboard header' },
      { name: 'version', type: 'Number', default: '1', description: 'Optimistic concurrency control counter' },
      { name: 'updatedAt', type: 'Date', default: 'Date.now', description: 'Auto-updated on socket patch' }
    ]
  },
  {
    id: 'message',
    name: 'Message',
    collection: 'messages',
    description: 'Live team chat messages scoped to project channels or global announcement stream.',
    relationships: [
      'Many Messages -> 1 Project (projectId)',
      'Many Messages -> 1 User (senderId)'
    ],
    indexes: ['projectId, createdAt (chronological feed)', 'senderId'],
    fields: [
      { name: '_id', type: 'ObjectId', required: true, description: 'Primary unique identifier' },
      { name: 'projectId', type: 'ObjectId', ref: 'Project', required: true, description: 'Channel room ID' },
      { name: 'senderId', type: 'ObjectId', ref: 'User', required: true, description: 'Message author' },
      { name: 'text', type: 'String', required: true, description: 'Sanitized chat text' },
      { name: 'attachments', type: '[String]', description: 'File/Image reference URLs if uploaded' },
      { name: 'isSystemMessage', type: 'Boolean', default: 'false', description: 'True for bot/system event messages (e.g. user joined, task resolved)' },
      { name: 'readBy', type: '[ObjectId]', ref: 'User', description: 'List of members who have viewed the message' },
      { name: 'createdAt', type: 'Date', default: 'Date.now', description: 'Message sent timestamp' }
    ]
  },
  {
    id: 'activity',
    name: 'Activity',
    collection: 'activities',
    description: 'Audit log entries capturing state mutations across the system for the Admin analytics panel and project timeline.',
    relationships: [
      'Many Activities -> 1 User (actorId)',
      'Many Activities -> 1 Project (projectId, optional)'
    ],
    indexes: ['createdAt (time-series analysis)', 'actorId', 'actionType'],
    fields: [
      { name: '_id', type: 'ObjectId', required: true, description: 'Primary unique identifier' },
      { name: 'actorId', type: 'ObjectId', ref: 'User', required: true, description: 'User who triggered the action' },
      { name: 'actionType', type: 'String', required: true, enum: ['USER_REGISTER', 'PROJECT_CREATED', 'TASK_MOVED', 'NOTE_EDITED', 'USER_ROLE_CHANGED', 'PROJECT_ARCHIVED'], description: 'Structured event category' },
      { name: 'entityType', type: 'String', required: true, enum: ['User', 'Project', 'Task', 'Note', 'Message'], description: 'Resource affected' },
      { name: 'entityId', type: 'ObjectId', required: true, description: 'Target document ID' },
      { name: 'projectId', type: 'ObjectId', ref: 'Project', description: 'Optional project scope' },
      { name: 'metadata', type: 'Object', description: 'JSON diff snapshot (e.g., { fromStatus: "Todo", toStatus: "InProgress" })' },
      { name: 'createdAt', type: 'Date', default: 'Date.now', description: 'Timestamp of the audit entry' }
    ]
  },
  {
    id: 'notification',
    name: 'Notification',
    collection: 'notifications',
    description: 'User-targeted alerts for task assignments, mentions, and project invitations.',
    relationships: [
      'Many Notifications -> 1 User (recipientId)',
      'Many Notifications -> 1 User (senderId)'
    ],
    indexes: ['recipientId, isRead', 'createdAt'],
    fields: [
      { name: '_id', type: 'ObjectId', required: true, description: 'Primary unique identifier' },
      { name: 'recipientId', type: 'ObjectId', ref: 'User', required: true, description: 'Target recipient' },
      { name: 'senderId', type: 'ObjectId', ref: 'User', description: 'User who initiated the notification' },
      { name: 'title', type: 'String', required: true, description: 'Alert title (e.g. New Task Assigned)' },
      { name: 'message', type: 'String', required: true, description: 'Detailed notification content' },
      { name: 'link', type: 'String', description: 'Direct URL to project or task' },
      { name: 'isRead', type: 'Boolean', default: 'false', description: 'Read receipt' },
      { name: 'createdAt', type: 'Date', default: 'Date.now', description: 'Timestamp' }
    ]
  }
];

const REST_ENDPOINTS: ApiEndpoint[] = [
  // Auth
  { method: 'POST', path: '/api/v1/auth/register', role: 'Public', category: 'Auth', purpose: 'Register new user account with default Member role', requestBody: '{ name, email, password, department }', responseDesc: '201 Created: { user, token }' },
  { method: 'POST', path: '/api/v1/auth/login', role: 'Public', category: 'Auth', purpose: 'Authenticate credentials, return JWT & user details', requestBody: '{ email, password }', responseDesc: '200 OK: { user, token }' },
  { method: 'GET', path: '/api/v1/auth/me', role: 'Authenticated', category: 'Auth', purpose: 'Fetch current logged-in user profile from JWT Bearer token', responseDesc: '200 OK: { user }' },
  { method: 'POST', path: '/api/v1/auth/logout', role: 'Authenticated', category: 'Auth', purpose: 'Invalidate presence and logout session', responseDesc: '200 OK: { message: "Logged out" }' },

  // Projects
  { method: 'GET', path: '/api/v1/projects', role: 'Member', category: 'Projects', purpose: 'List projects where current user is member or manager (Admins get all)', responseDesc: '200 OK: { projects: Project[] }' },
  { method: 'POST', path: '/api/v1/projects', role: 'Manager', category: 'Projects', purpose: 'Create a new project workspace and assign initial members', requestBody: '{ title, description, priority, dueDate, members }', responseDesc: '201 Created: { project: Project }' },
  { method: 'GET', path: '/api/v1/projects/:id', role: 'Member', category: 'Projects', purpose: 'Get detailed project data with member list and statistics', responseDesc: '200 OK: { project, taskCounts, activeMembers }' },
  { method: 'PUT', path: '/api/v1/projects/:id', role: 'Manager', category: 'Projects', purpose: 'Update project settings, deadline, status, or member list', requestBody: '{ title, description, status, priority, members }', responseDesc: '200 OK: { project }' },
  { method: 'DELETE', path: '/api/v1/projects/:id', role: 'Admin', category: 'Projects', purpose: 'Permanently remove or archive project and cascade cleanup', responseDesc: '200 OK: { message: "Project deleted" }' },

  // Tasks
  { method: 'GET', path: '/api/v1/projects/:projectId/tasks', role: 'Member', category: 'Tasks', purpose: 'Fetch all tasks for a project grouped by Kanban status', responseDesc: '200 OK: { tasks: Task[] }' },
  { method: 'POST', path: '/api/v1/projects/:projectId/tasks', role: 'Member', category: 'Tasks', purpose: 'Create a new task inside project (assigns to self or team)', requestBody: '{ title, description, priority, assignedTo, dueDate, tags }', responseDesc: '201 Created: { task: Task }' },
  { method: 'PATCH', path: '/api/v1/tasks/:id/status', role: 'Member', category: 'Tasks', purpose: 'Move task across Kanban columns (triggers real-time broadcast)', requestBody: '{ status: "InProgress", orderIndex: 2 }', responseDesc: '200 OK: { task: Task }' },
  { method: 'PUT', path: '/api/v1/tasks/:id', role: 'Member', category: 'Tasks', purpose: 'Update task details, description, priority, or assignee', requestBody: '{ title, description, priority, assignedTo, dueDate }', responseDesc: '200 OK: { task: Task }' },
  { method: 'DELETE', path: '/api/v1/tasks/:id', role: 'Manager', category: 'Tasks', purpose: 'Delete task (Managers & Admins only)', responseDesc: '200 OK: { message: "Task deleted" }' },

  // Notes
  { method: 'GET', path: '/api/v1/projects/:projectId/notes', role: 'Member', category: 'Notes', purpose: 'List all project notes and scratchpads', responseDesc: '200 OK: { notes: Note[] }' },
  { method: 'POST', path: '/api/v1/projects/:projectId/notes', role: 'Member', category: 'Notes', purpose: 'Create new project document or meeting note', requestBody: '{ title, content, isPinned }', responseDesc: '201 Created: { note: Note }' },
  { method: 'PUT', path: '/api/v1/notes/:id', role: 'Member', category: 'Notes', purpose: 'Save full note body with optimistic version check', requestBody: '{ title, content, version }', responseDesc: '200 OK: { note: Note }' },
  { method: 'DELETE', path: '/api/v1/notes/:id', role: 'Manager', category: 'Notes', purpose: 'Delete document', responseDesc: '200 OK: { message: "Note deleted" }' },

  // Messages / Chat
  { method: 'GET', path: '/api/v1/projects/:projectId/messages', role: 'Member', category: 'Messages', purpose: 'Fetch paginated chat history for project room (limit 50)', responseDesc: '200 OK: { messages: Message[], nextCursor }' },
  { method: 'POST', path: '/api/v1/projects/:projectId/messages', role: 'Member', category: 'Messages', purpose: 'Send message via HTTP fallback (Socket.IO preferred)', requestBody: '{ text, attachments }', responseDesc: '201 Created: { message: Message }' },

  // Notifications
  { method: 'GET', path: '/api/v1/notifications', role: 'Authenticated', category: 'Notifications', purpose: 'Get current user alerts and pending action items', responseDesc: '200 OK: { notifications: Notification[] }' },
  { method: 'PATCH', path: '/api/v1/notifications/:id/read', role: 'Authenticated', category: 'Notifications', purpose: 'Mark notification as read', responseDesc: '200 OK: { success: true }' },

  // Admin & Analytics (Angular Admin Frontend)
  { method: 'GET', path: '/api/v1/admin/analytics/overview', role: 'Admin', category: 'Admin & Analytics', purpose: 'Total users, active projects, task completion rate, 7-day velocity', responseDesc: '200 OK: { stats: { userCount, projectCount, taskStats, activeNow } }' },
  { method: 'GET', path: '/api/v1/admin/users', role: 'Admin', category: 'Admin & Analytics', purpose: 'Full paginated user list with role filters and activity status', responseDesc: '200 OK: { users: User[], total }' },
  { method: 'PATCH', path: '/api/v1/admin/users/:id/role', role: 'Admin', category: 'Admin & Analytics', purpose: 'Promote or demote user role (Admin, Manager, Member)', requestBody: '{ role: "Manager" }', responseDesc: '200 OK: { user: User }' },
  { method: 'DELETE', path: '/api/v1/admin/users/:id', role: 'Admin', category: 'Admin & Analytics', purpose: 'Deactivate or hard delete user account', responseDesc: '200 OK: { message: "User deleted" }' },
  { method: 'GET', path: '/api/v1/admin/activities', role: 'Admin', category: 'Admin & Analytics', purpose: 'Global audit logs with filters by date, actor, and actionType', responseDesc: '200 OK: { activities: Activity[] }' },
  { method: 'GET', path: '/api/v1/admin/health', role: 'Admin', category: 'Admin & Analytics', purpose: 'MongoDB connection state, memory usage, socket active connections', responseDesc: '200 OK: { status: "UP", uptime, mongo: "connected", sockets: 42 }' }
];

const SOCKET_EVENTS: SocketEvent[] = [
  // Authentication & Connection
  {
    name: 'connection',
    payload: '{ token: string } (in auth handshake headers)',
    emitter: 'React Client',
    listeners: 'Node.js Backend',
    roomScope: 'Global / Server',
    purpose: 'Client connects and JWT is verified by backend socket middleware; attaches socket.user'
  },
  {
    name: 'user:presence_update',
    payload: '{ userId: string, isOnline: boolean, lastActiveAt: string }',
    emitter: 'Node.js Backend',
    listeners: 'React Client, Angular Admin',
    roomScope: 'Global broadcast',
    purpose: 'Broadcasts when any user connects or disconnects, updating online indicator dots'
  },
  // Rooms
  {
    name: 'project:join',
    payload: '{ projectId: string }',
    emitter: 'React Client',
    listeners: 'Node.js Backend',
    roomScope: 'Project Room',
    purpose: 'Client enters a project page; joins Socket.IO room `project_${projectId}`'
  },
  {
    name: 'project:leave',
    payload: '{ projectId: string }',
    emitter: 'React Client',
    listeners: 'Node.js Backend',
    roomScope: 'Project Room',
    purpose: 'Client navigates away; leaves room `project_${projectId}`'
  },
  // Tasks Sync
  {
    name: 'task:moved',
    payload: '{ taskId: string, projectId: string, newStatus: string, newIndex: number, movedBy: UserRef }',
    emitter: 'React Client',
    listeners: 'React Client (all project peers)',
    roomScope: '`project_${projectId}`',
    purpose: 'Live Kanban drag-and-drop: updates all project members boards with zero-delay animation'
  },
  {
    name: 'task:created',
    payload: '{ task: TaskObject, projectId: string }',
    emitter: 'Node.js Backend',
    listeners: 'React Client, Angular Admin',
    roomScope: '`project_${projectId}`',
    purpose: 'Emitted after POST /tasks succeeds to insert new card on all active screens'
  },
  {
    name: 'task:updated',
    payload: '{ taskId: string, updates: Partial<Task>, updatedBy: string }',
    emitter: 'Node.js Backend',
    listeners: 'React Client',
    roomScope: '`project_${projectId}`',
    purpose: 'Syncs priority, deadline, or title edits in real-time modal or card'
  },
  // Notes Sync
  {
    name: 'note:typing',
    payload: '{ noteId: string, projectId: string, user: { id: string, name: string } }',
    emitter: 'React Client',
    listeners: 'React Client (peers)',
    roomScope: '`project_${projectId}`',
    purpose: 'Displays "Aditya is editing this note..." collaborative typing banner'
  },
  {
    name: 'note:patch',
    payload: '{ noteId: string, projectId: string, content: string, version: number }',
    emitter: 'React Client',
    listeners: 'React Client (peers)',
    roomScope: '`project_${projectId}`',
    purpose: 'Live document sync: pushes debounce-streamed text deltas to collaborative editors'
  },
  // Chat Sync
  {
    name: 'chat:send_message',
    payload: '{ projectId: string, text: string, attachments?: string[] }',
    emitter: 'React Client',
    listeners: 'Node.js Backend',
    roomScope: '`project_${projectId}`',
    purpose: 'Client posts a message to project room; server persists to MongoDB and broadcasts'
  },
  {
    name: 'chat:new_message',
    payload: '{ _id: string, projectId: string, sender: UserObj, text: string, createdAt: string }',
    emitter: 'Node.js Backend',
    listeners: 'React Client (all room members)',
    roomScope: '`project_${projectId}`',
    purpose: 'Pushes incoming message to chat drawer / message feed with audio ding'
  },
  // Notifications & Admin
  {
    name: 'notification:received',
    payload: '{ notification: NotificationObj }',
    emitter: 'Node.js Backend',
    listeners: 'React Client (individual user)',
    roomScope: '`user_${recipientId}` (Private room)',
    purpose: 'Instant push toast when a user is assigned a task or mentioned'
  },
  {
    name: 'admin:stats_tick',
    payload: '{ activeUsers: number, liveSockets: number, tasksToday: number }',
    emitter: 'Node.js Backend',
    listeners: 'Angular Admin',
    roomScope: '`admin_dashboard`',
    purpose: 'Pushes live metric pulses every 5 seconds to Angular Admin real-time charts'
  }
];

const ROLE_PERMISSIONS = [
  { module: 'Authentication', action: 'Sign Up / Register', member: true, manager: true, admin: true, note: 'Default assigned role is Member' },
  { module: 'Authentication', action: 'Login & Session Management', member: true, manager: true, admin: true, note: 'JWT stored in HTTP-only cookie or memory' },
  { module: 'Users', action: 'View Team Members List', member: true, manager: true, admin: true, note: 'Public profiles within project' },
  { module: 'Users', action: 'Change Roles (Admin/Manager/Member)', member: false, manager: false, admin: true, note: 'Admin Panel exclusive in Angular' },
  { module: 'Users', action: 'Delete or Ban User', member: false, manager: false, admin: true, note: 'Admin Panel only' },
  { module: 'Projects', action: 'View Assigned Projects', member: true, manager: true, admin: true, note: 'Admins view all projects system-wide' },
  { module: 'Projects', action: 'Create New Project Workspace', member: false, manager: true, admin: true, note: 'Managers create workspaces for teams' },
  { module: 'Projects', action: 'Manage Members in Project', member: false, manager: true, admin: true, note: 'Add or remove members' },
  { module: 'Projects', action: 'Delete / Archive Project', member: false, manager: false, admin: true, note: 'Admin destructive action' },
  { module: 'Tasks', action: 'View Project Tasks (Kanban)', member: true, manager: true, admin: true, note: 'Real-time drag and drop board' },
  { module: 'Tasks', action: 'Create Tasks', member: true, manager: true, admin: true, note: 'Any team member can file tasks' },
  { module: 'Tasks', action: 'Update Task Status & Order', member: true, manager: true, admin: true, note: 'Synchronized via Socket.IO' },
  { module: 'Tasks', action: 'Assign / Reassign Tasks', member: false, manager: true, admin: true, note: 'Members can only assign to themselves' },
  { module: 'Tasks', action: 'Delete Tasks', member: false, manager: true, admin: true, note: 'Manager & Admin governance' },
  { module: 'Notes', action: 'Create & Edit Project Notes', member: true, manager: true, admin: true, note: 'Collaborative real-time scratchpad' },
  { module: 'Notes', action: 'Pin / Delete Notes', member: false, manager: true, admin: true, note: 'Managers manage document pinned status' },
  { module: 'Team Chat', action: 'Send & Receive Live Messages', member: true, manager: true, admin: true, note: 'Socket.IO rooms per project' },
  { module: 'Team Chat', action: 'Delete Inappropriate Messages', member: false, manager: true, admin: true, note: 'Moderation privilege' },
  { module: 'Admin Panel', action: 'Access Angular Admin App', member: false, manager: false, admin: true, note: 'Guarded by AdminGuard in Angular' },
  { module: 'Analytics & Audit', action: 'View System Analytics & Logs', member: false, manager: false, admin: true, note: 'Audit trail, throughput & server health' }
];

type AppTab =
  | 'kanban'
  | 'notes'
  | 'chat'
  | 'analytics'
  | 'users'
  | 'activities'
  | 'overview'
  | 'folder'
  | 'schemas'
  | 'api'
  | 'socket'
  | 'rbac'
  | 'docker';

function SyncSpaceAppContent() {
  const { user, currentRole, setRole } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<AppTab>('kanban');
  const [selectedSchema, setSelectedSchema] = useState<string>('user');
  const [apiSearch, setApiSearch] = useState<string>('');
  const [apiRoleFilter, setApiRoleFilter] = useState<string>('ALL');
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const isTabRestricted = (tab: AppTab, role: UserRole): boolean => {
    if (role === 'Member') {
      return tab === 'analytics' || tab === 'users' || tab === 'activities';
    }
    if (role === 'Manager') {
      return tab === 'users' || tab === 'activities';
    }
    return false;
  };

  const getTabRestrictionMessage = (tab: AppTab, role: UserRole): string => {
    if (tab === 'analytics') {
      return 'Access denied: Analytics Dashboard requires Manager or Admin privileges.';
    }
    if (tab === 'users') {
      return 'Access denied: User Management & Role Configuration requires Admin privileges.';
    }
    if (tab === 'activities') {
      return 'Access denied: System Activity Audit Log requires Admin privileges.';
    }
    return `Access denied: ${role} role is not permitted to access this module.`;
  };

  // Route Guard: Redirect to dashboard if currently on a restricted tab
  useEffect(() => {
    if (isTabRestricted(activeTab, currentRole)) {
      showToast(getTabRestrictionMessage(activeTab, currentRole), 'error');
      setActiveTab('kanban');
    }
  }, [currentRole, activeTab, showToast]);

  const handleTabClick = (tab: AppTab) => {
    if (isTabRestricted(tab, currentRole)) {
      showToast(getTabRestrictionMessage(tab, currentRole), 'error');
      return;
    }
    setActiveTab(tab);
  };

  const handleRoleSwitch = (newRole: UserRole) => {
    if (newRole === currentRole) return;
    setRole(newRole);
    showToast(`Active role switched to ${newRole}. Workspace permissions updated.`, 'success');
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(label);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const filteredEndpoints = REST_ENDPOINTS.filter((ep) => {
    const matchesSearch =
      ep.path.toLowerCase().includes(apiSearch.toLowerCase()) ||
      ep.purpose.toLowerCase().includes(apiSearch.toLowerCase()) ||
      ep.category.toLowerCase().includes(apiSearch.toLowerCase());
    const matchesRole =
      apiRoleFilter === 'ALL' ||
      ep.role === apiRoleFilter ||
      (apiRoleFilter === 'Member' && ep.role === 'Authenticated');
    return matchesSearch && matchesRole;
  });

  const activeSchemaObj = MONGO_SCHEMAS.find((s) => s.id === selectedSchema) || MONGO_SCHEMAS[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
          {/* Logo & Brand Subtitle */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl shadow-lg shadow-indigo-500/20">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl tracking-tight">
                  <span className="font-extrabold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">Sync</span>
                  <span className="font-normal text-white">Space</span>
                </h1>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time tasks, notes and team chat in one workspace
              </p>
            </div>
          </div>

          {/* Right Section: Active User Profile & Functional Role Switcher Buttons */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            
            {/* User Profile Card with Current Role Badge */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={user?.name || 'User'}
                className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-700"
              />
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white leading-tight">
                    {user?.name || 'Aditya Baviskar'}
                  </span>
                  {/* Current role as a label next to the user's name in the header */}
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                      currentRole === 'Admin'
                        ? 'bg-purple-950 text-purple-300 border-purple-800/80'
                        : currentRole === 'Manager'
                        ? 'bg-blue-950 text-blue-300 border-blue-800/80'
                        : 'bg-emerald-950 text-emerald-300 border-emerald-800/80'
                    }`}
                  >
                    {currentRole}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 leading-none">
                  {user?.email || 'aditya@projecthub.io'}
                </span>
              </div>
            </div>

            {/* Quick Role Switcher Buttons */}
            <div className="flex items-center gap-1.5 text-xs relative z-10" role="group" aria-label="Role Switcher">
              {/* Member Button */}
              <button
                type="button"
                onClick={() => handleRoleSwitch('Member')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs cursor-pointer transition-all duration-150 ${
                  currentRole === 'Member'
                    ? 'bg-emerald-600 text-white border border-emerald-400 font-bold shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/50'
                    : 'bg-emerald-950/30 text-emerald-400/60 border border-emerald-900/40 hover:bg-emerald-950/80 hover:text-emerald-300 hover:border-emerald-700/60 opacity-60 hover:opacity-100'
                }`}
                title="Switch active role to Member"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    currentRole === 'Member' ? 'bg-emerald-300 animate-pulse ring-1 ring-white' : 'bg-emerald-500/40'
                  }`}
                ></span>
                Member
              </button>

              {/* Manager Button */}
              <button
                type="button"
                onClick={() => handleRoleSwitch('Manager')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs cursor-pointer transition-all duration-150 ${
                  currentRole === 'Manager'
                    ? 'bg-blue-600 text-white border border-blue-400 font-bold shadow-md shadow-blue-600/30 ring-1 ring-blue-400/50'
                    : 'bg-blue-950/30 text-blue-400/60 border border-blue-900/40 hover:bg-blue-950/80 hover:text-blue-300 hover:border-blue-700/60 opacity-60 hover:opacity-100'
                }`}
                title="Switch active role to Manager"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    currentRole === 'Manager' ? 'bg-blue-300 animate-pulse ring-1 ring-white' : 'bg-blue-500/40'
                  }`}
                ></span>
                Manager
              </button>

              {/* Admin Button */}
              <button
                type="button"
                onClick={() => handleRoleSwitch('Admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs cursor-pointer transition-all duration-150 ${
                  currentRole === 'Admin'
                    ? 'bg-purple-600 text-white border border-purple-400 font-bold shadow-md shadow-purple-600/30 ring-1 ring-purple-400/50'
                    : 'bg-purple-950/30 text-purple-400/60 border border-purple-900/40 hover:bg-purple-950/80 hover:text-purple-300 hover:border-purple-700/60 opacity-60 hover:opacity-100'
                }`}
                title="Switch active role to Admin"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    currentRole === 'Admin' ? 'bg-purple-300 animate-pulse ring-1 ring-white' : 'bg-purple-500/40'
                  }`}
                ></span>
                Admin
              </button>
            </div>

          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto mt-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {/* Workspace Tabs */}
          <div className="flex items-center gap-1 pr-2 border-r border-slate-800 shrink-0">
            <button
              onClick={() => handleTabClick('kanban')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'kanban'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FolderKanban className="w-3.5 h-3.5" /> Kanban Board
            </button>

            <button
              onClick={() => handleTabClick('notes')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'notes'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Notes Workspace
            </button>

            <button
              onClick={() => handleTabClick('chat')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> Team Chat
            </button>

            {/* Analytics Dashboard (Manager & Admin only) */}
            <button
              onClick={() => handleTabClick('analytics')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                isTabRestricted('analytics', currentRole)
                  ? 'opacity-40 text-slate-500 hover:text-slate-400 hover:bg-slate-900 cursor-not-allowed'
                  : activeTab === 'analytics'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 cursor-pointer'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 cursor-pointer'
              }`}
              title={isTabRestricted('analytics', currentRole) ? 'Analytics (Restricted to Manager and Admin)' : 'Analytics Dashboard'}
            >
              {isTabRestricted('analytics', currentRole) ? (
                <Lock className="w-3.5 h-3.5 text-amber-500/80" />
              ) : (
                <TrendingUp className="w-3.5 h-3.5" />
              )}
              Analytics {isTabRestricted('analytics', currentRole) && <span className="text-[9px] font-mono opacity-80">(Mgr+)</span>}
            </button>

            {/* User Management (Admin only) */}
            <button
              onClick={() => handleTabClick('users')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                isTabRestricted('users', currentRole)
                  ? 'opacity-40 text-slate-500 hover:text-slate-400 hover:bg-slate-900 cursor-not-allowed'
                  : activeTab === 'users'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 cursor-pointer'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 cursor-pointer'
              }`}
              title={isTabRestricted('users', currentRole) ? 'User Management (Restricted to Admin)' : 'User Management'}
            >
              {isTabRestricted('users', currentRole) ? (
                <Lock className="w-3.5 h-3.5 text-purple-400/80" />
              ) : (
                <Users className="w-3.5 h-3.5" />
              )}
              Users {isTabRestricted('users', currentRole) && <span className="text-[9px] font-mono opacity-80">(Admin)</span>}
            </button>

            {/* Activity Audit Log (Admin only) */}
            <button
              onClick={() => handleTabClick('activities')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                isTabRestricted('activities', currentRole)
                  ? 'opacity-40 text-slate-500 hover:text-slate-400 hover:bg-slate-900 cursor-not-allowed'
                  : activeTab === 'activities'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 cursor-pointer'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 cursor-pointer'
              }`}
              title={isTabRestricted('activities', currentRole) ? 'Activity Audit Log (Restricted to Admin)' : 'Activity Log'}
            >
              {isTabRestricted('activities', currentRole) ? (
                <Lock className="w-3.5 h-3.5 text-purple-400/80" />
              ) : (
                <History className="w-3.5 h-3.5" />
              )}
              Audit Log {isTabRestricted('activities', currentRole) && <span className="text-[9px] font-mono opacity-80">(Admin)</span>}
            </button>
          </div>

          {/* Architecture Spec Tabs */}
          <div className="flex items-center gap-1 pl-1 shrink-0">
            <button
              onClick={() => handleTabClick('overview')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> Blueprint
            </button>
            <button
              onClick={() => handleTabClick('folder')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'folder'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" /> Tree
            </button>
            <button
              onClick={() => handleTabClick('schemas')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'schemas'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Database className="w-3.5 h-3.5" /> Schemas ({MONGO_SCHEMAS.length})
            </button>
            <button
              onClick={() => handleTabClick('api')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'api'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Globe className="w-3.5 h-3.5" /> API ({REST_ENDPOINTS.length})
            </button>
            <button
              onClick={() => handleTabClick('socket')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'socket'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Radio className="w-3.5 h-3.5" /> Sockets ({SOCKET_EVENTS.length})
            </button>
            <button
              onClick={() => handleTabClick('rbac')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'rbac'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> RBAC
            </button>
            <button
              onClick={() => handleTabClick('docker')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'docker'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Server className="w-3.5 h-3.5" /> Docker
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6">
        {/* TAB: KANBAN BOARD */}
        {activeTab === 'kanban' && <KanbanBoard />}

        {/* TAB: NOTES WORKSPACE */}
        {activeTab === 'notes' && <NotesWorkspace />}

        {/* TAB: TEAM CHAT */}
        {activeTab === 'chat' && <ChatDrawer />}

        {/* TAB: ANALYTICS DASHBOARD (Manager & Admin only) */}
        {activeTab === 'analytics' && <AnalyticsDashboard />}

        {/* TAB: USER MANAGEMENT (Admin only) */}
        {activeTab === 'users' && <UserManagement />}

        {/* TAB: ACTIVITY AUDIT LOG (Admin only) */}
        {activeTab === 'activities' && <ActivityAuditLog />}

        {/* TAB: SYSTEM OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Hero / Executive Summary */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
                    <Sparkles className="w-4 h-4" /> Senior Architecture Specification
                  </div>
                  <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
                    SyncSpace
                  </h2>
                  <p className="text-slate-300 text-sm mt-2 max-w-3xl leading-relaxed">
                    A synchronized engineering collaboration platform engineered for academic evaluation in Advanced Web Programming. Features live WebSocket broadcast channels, optimistic UI state synchronizers, Mongoose ODM relational integrity, role-based token auth, and a dual-frontend micro-client layout running concurrently in Docker.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => copyToClipboard(JSON.stringify({ MONGO_SCHEMAS, REST_ENDPOINTS, SOCKET_EVENTS, ROLE_PERMISSIONS }, null, 2), 'spec-json')}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded-lg border border-slate-700 transition"
                  >
                    {copiedItem === 'spec-json' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    Copy Full Spec JSON
                  </button>
                </div>
              </div>

              {/* Architecture Topology Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/90 flex flex-col">
                  <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" /> React Client (Port 3000)
                  </div>
                  <div className="text-sm font-bold text-white">Members & Managers</div>
                  <p className="text-xs text-slate-400 mt-2 flex-1">
                    Kanban boards, real-time rich notes, project chat drawer, live member presence avatars, Vite + Tailwind.
                  </p>
                  <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
                    Socket.io-client, Lucide, Axios
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/90 flex flex-col">
                  <div className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" /> Angular Admin (Port 4200)
                  </div>
                  <div className="text-sm font-bold text-white">System Administrators</div>
                  <p className="text-xs text-slate-400 mt-2 flex-1">
                    System CRUD management, user role promotion/demotion, real-time server throughput analytics, audit log queries.
                  </p>
                  <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
                    Angular 18+, Signals, NgRx/Services
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/90 flex flex-col">
                  <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5" /> Node.js + Express (Port 5000)
                  </div>
                  <div className="text-sm font-bold text-white">REST API + Socket.IO</div>
                  <p className="text-xs text-slate-400 mt-2 flex-1">
                    Single server mounting Express routes and Socket.IO server on HTTP listener. JWT auth middleware, room scoping.
                  </p>
                  <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
                    Express 4/5, Socket.IO 4, Bcrypt, JWT
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/90 flex flex-col">
                  <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5" /> MongoDB (Port 27017)
                  </div>
                  <div className="text-sm font-bold text-white">Mongoose 8 ODM</div>
                  <p className="text-xs text-slate-400 mt-2 flex-1">
                    7 normalized collections: Users, Projects, Tasks, Notes, Messages, Activities, Notifications with composite indexes.
                  </p>
                  <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
                    Replica/Standalone, Mongo Volume
                  </div>
                </div>
              </div>
            </div>

            {/* Architecture Highlights & Professor / Defense Key Talking Points */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                  Key Academic Innovations for Viva / Presentation
                </h3>
                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <span className="p-1 rounded bg-indigo-500/10 text-indigo-400 font-mono text-[10px] mt-0.5">01</span>
                    <div>
                      <strong className="text-white">Dual-Frontend Separation of Concerns:</strong> React offers dynamic, fluid UX for active collaborative workers; Angular offers strict type-safety, reactive RxJS/Signals, and modular forms for enterprise administrative oversight.
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="p-1 rounded bg-indigo-500/10 text-indigo-400 font-mono text-[10px] mt-0.5">02</span>
                    <div>
                      <strong className="text-white">Room Scoped WebSocket Isolation:</strong> Instead of broadcasting every task move or note keystroke globally, Socket.IO dynamically assigns connected clients to project rooms (`project_&lt;id&gt;`) upon project entry and cleans up on leave.
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="p-1 rounded bg-indigo-500/10 text-indigo-400 font-mono text-[10px] mt-0.5">03</span>
                    <div>
                      <strong className="text-white">Optimistic UI + Server Authority:</strong> React clients update drag-and-drop Kanban positions immediately in local state for 0ms lag, firing a socket event concurrently. The server writes to MongoDB and rebroadcasts to all other active peers.
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="p-1 rounded bg-indigo-500/10 text-indigo-400 font-mono text-[10px] mt-0.5">04</span>
                    <div>
                      <strong className="text-white">Audit Logging (Activity Collection):</strong> Every major mutation (role changes, task moves, project creations) logs an immutable time-series record used by the Angular dashboard for analytics.
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                  <Lock className="w-5 h-5 text-purple-400" />
                  Security & Token Lifecycle Architecture
                </h3>
                <div className="space-y-3 text-xs text-slate-300">
                  <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                    <div className="font-semibold text-slate-200">1. JWT Payload Schema</div>
                    <code className="text-[11px] font-mono text-indigo-300 block mt-1">
                      {'{ userId: "671aa...", email: "user@hub.com", role: "Manager", iat: 1729..., exp: 1729... }'}
                    </code>
                  </div>
                  <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                    <div className="font-semibold text-slate-200">2. Socket.IO Authentication Handshake</div>
                    <p className="text-slate-400 text-[11px] mt-1">
                      Middleware verifies <code className="text-slate-300">socket.handshake.auth.token</code> before connection accepts. Invalid tokens trigger immediate socket connection rejection with 401 Unauthorized.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                    <div className="font-semibold text-slate-200">3. Role-Based Access Control (RBAC) Middleware</div>
                    <p className="text-slate-400 text-[11px] mt-1">
                      Express route guard: <code className="text-slate-300">verifyToken, authorizeRole('Admin', 'Manager')</code>. Ensures members cannot tamper with project settings, and managers cannot view audit telemetry.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: MONOREPO TREE */}
        {activeTab === 'folder' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 p-5 rounded-xl border border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <FolderTree className="w-5 h-5 text-indigo-400" />
                  Monorepo Directory Layout
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Root layout encapsulating backend microservices, React worker app, Angular admin portal, and Docker composition.
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(`project-hub-monorepo/
├── backend/
│   ├── src/
│   │   ├── config/ (db.ts, jwt.ts)
│   │   ├── controllers/ (auth, project, task, note, chat, analytics)
│   │   ├── middlewares/ (auth, role, validate, error)
│   │   ├── models/ (User, Project, Task, Note, Message, Activity, Notification)
│   │   ├── routes/ (auth, project, task, note, chat, admin)
│   │   ├── sockets/ (socketServer.ts, socketAuth.ts, handlers/)
│   │   ├── utils/ (logger, seedDatabase)
│   │   ├── server.ts
│   │   └── app.ts
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
├── react-client/
│   ├── src/
│   │   ├── components/ (KanbanBoard, TaskCard, RichTextNote, ChatDrawer)
│   │   ├── context/ (AuthContext, SocketContext, ProjectContext)
│   │   ├── hooks/ (useSocket, useTasks, usePresence)
│   │   ├── pages/ (Login, Dashboard, ProjectView, NotesWorkspace)
│   │   ├── services/ (api.ts, socket.ts)
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── angular-admin/
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/ (guards, interceptors, services)
│   │   │   ├── features/ (dashboard, users, projects, audit-logs)
│   │   │   └── shared/ (stat-card, data-table)
│   │   └── environments/
│   ├── Dockerfile
│   ├── angular.json
│   └── package.json
└── docker-compose.yml`, 'monorepo-tree')}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-mono rounded-lg border border-slate-700 transition"
              >
                {copiedItem === 'monorepo-tree' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                Copy ASCII Tree
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Directory Viewer */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 font-mono text-xs overflow-x-auto">
                <div className="text-slate-400 mb-3 pb-2 border-b border-slate-800 flex items-center justify-between">
                  <span>/project-hub-root</span>
                  <span className="text-[10px] text-indigo-400">Production Monorepo Standard</span>
                </div>
                <div className="space-y-4">
                  {MONOREPO_TREE.map((node, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm bg-slate-800/40 px-2 py-1.5 rounded">
                        <FolderTree className="w-4 h-4 text-indigo-400" />
                        <span>{node.name}</span>
                        {node.desc && <span className="text-xs text-slate-400 font-sans font-normal ml-auto">({node.desc})</span>}
                      </div>
                      {node.children && (
                        <div className="pl-6 border-l border-slate-800 space-y-1.5">
                          {node.children.map((child, j) => (
                            <div key={j}>
                              <div className="flex items-center gap-2 text-slate-200">
                                {child.type === 'dir' ? (
                                  <FolderTree className="w-3.5 h-3.5 text-cyan-400" />
                                ) : (
                                  <FileCode className="w-3.5 h-3.5 text-slate-400" />
                                )}
                                <span className={child.type === 'dir' ? 'font-semibold text-cyan-300' : 'text-slate-300'}>{child.name}</span>
                                {child.desc && <span className="text-[11px] text-slate-500 font-sans ml-2">// {child.desc}</span>}
                              </div>
                              {child.children && (
                                <div className="pl-5 border-l border-slate-800/80 my-1 space-y-1">
                                  {child.children.map((sub, k) => (
                                    <div key={k} className="flex items-start gap-2 text-slate-400 text-[11px]">
                                      <span className="text-slate-600">├─</span>
                                      <span className={sub.type === 'dir' ? 'text-cyan-200 font-medium' : 'text-slate-300'}>{sub.name}</span>
                                      {sub.desc && <span className="text-slate-500 font-sans text-[10px]">// {sub.desc}</span>}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Monorepo Architecture Guide */}
              <div className="space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                    <Server className="w-4 h-4 text-emerald-400" /> Backend Module Architecture
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Controller-Service-Model architecture with separate Express route files. Socket handlers mirror controllers, ensuring shared validation rules between HTTP endpoints and WebSocket events.
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" /> React Client Scope
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Designed for high velocity. Uses React Contexts for global authentication and real-time Socket.IO listeners. Kanban drag-and-drop broadcasts optimistic position swaps immediately.
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-rose-400" /> Angular Admin Scope
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Strict Angular standalone components with routing guards (`AdminGuard`). Connects to `/api/v1/admin/*` and listens on `admin:stats_tick` for live operational monitoring.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MONGODB SCHEMAS */}
        {activeTab === 'schemas' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header & Schema Selector */}
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-400" />
                  MongoDB (Mongoose) Schemas & Relationships
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  7 relational documents structured for high read throughput, real-time index searches, and referential integrity.
                </p>
              </div>

              {/* Selector Tabs */}
              <div className="flex flex-wrap gap-1.5">
                {MONGO_SCHEMAS.map(schema => (
                  <button
                    key={schema.id}
                    onClick={() => setSelectedSchema(schema.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium font-mono transition-all ${
                      selectedSchema === schema.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {schema.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Schema Detail */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-white font-mono">{activeSchemaObj.name} Schema</h3>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      Collection: "{activeSchemaObj.collection}"
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{activeSchemaObj.description}</p>
                </div>

                <button
                  onClick={() => copyToClipboard(`// ${activeSchemaObj.name}.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface I${activeSchemaObj.name} extends Document {
${activeSchemaObj.fields.map(f => `  ${f.name}: ${f.type === 'ObjectId' ? 'mongoose.Types.ObjectId' : f.type === '[ObjectId]' ? 'mongoose.Types.ObjectId[]' : f.type.toLowerCase()};`).join('\n')}
}

const ${activeSchemaObj.name}Schema = new Schema<I${activeSchemaObj.name}>({
${activeSchemaObj.fields.filter(f => f.name !== '_id').map(f => `  ${f.name}: {
    type: ${f.ref ? 'Schema.Types.ObjectId' : f.type === '[ObjectId]' ? '[Schema.Types.ObjectId]' : f.type === '[String]' ? '[String]' : f.type},
    ${f.required ? 'required: true,' : ''}
    ${f.unique ? 'unique: true,' : ''}
    ${f.ref ? `ref: '${f.ref}',` : ''}
    ${f.enum ? `enum: [${f.enum.join(', ')}],` : ''}
    ${f.default ? `default: ${f.default},` : ''}
  },`).join('\n')}
}, { timestamps: true });

export default mongoose.model<I${activeSchemaObj.name}>('${activeSchemaObj.name}', ${activeSchemaObj.name}Schema);`, `${activeSchemaObj.id}-code`)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-mono rounded-lg border border-slate-700 transition"
                >
                  {copiedItem === `${activeSchemaObj.id}-code` ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  Copy Mongoose Model
                </button>
              </div>

              {/* Relationships & Indexes Badges */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800">
                  <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-400" /> Model Relationships
                  </div>
                  <ul className="space-y-1 text-xs text-slate-400 font-mono">
                    {activeSchemaObj.relationships.map((rel, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span> {rel}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800">
                  <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-cyan-400" /> Database Indexes
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeSchemaObj.indexes.map((idxStr, idx) => (
                      <span key={idx} className="px-2 py-1 rounded bg-slate-800 text-cyan-300 font-mono text-xs border border-slate-700">
                        {idxStr}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Schema Fields Table */}
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px] bg-slate-950/40">
                      <th className="py-2.5 px-3">Field Name</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Constraints</th>
                      <th className="py-2.5 px-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {activeSchemaObj.fields.map((field, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition">
                        <td className="py-2.5 px-3 font-bold text-indigo-300">
                          {field.name}
                          {field.required && <span className="text-rose-400 ml-1">*</span>}
                        </td>
                        <td className="py-2.5 px-3 text-cyan-300">
                          {field.type}
                          {field.ref && <span className="text-slate-400 text-[10px] ml-1">→ ref: {field.ref}</span>}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                          {field.unique && <span className="mr-1.5 text-amber-300 bg-amber-950/40 px-1 py-0.5 rounded border border-amber-900">unique</span>}
                          {field.enum && (
                            <span className="text-emerald-300 bg-emerald-950/40 px-1 py-0.5 rounded border border-emerald-900">
                              enum: [{field.enum.join(', ')}]
                            </span>
                          )}
                          {field.default && <span className="ml-1 text-slate-500">def: {field.default}</span>}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300 font-sans">{field.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: REST API ENDPOINTS */}
        {activeTab === 'api' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Filter & Search Bar */}
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-indigo-400" />
                  REST API Specification
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  JSON-based REST endpoints categorized with explicit RBAC role guards and payload expectations.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                {/* Search */}
                <div className="relative flex-1 md:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search route or purpose..."
                    value={apiSearch}
                    onChange={(e) => setApiSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Role Filter */}
                <select
                  value={apiRoleFilter}
                  onChange={(e) => setApiRoleFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                >
                  <option value="ALL">All Roles</option>
                  <option value="Public">Public</option>
                  <option value="Member">Member</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
                </select>

                <button
                  onClick={() => copyToClipboard(JSON.stringify(REST_ENDPOINTS, null, 2), 'api-json')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-mono rounded-lg border border-slate-700 transition"
                >
                  {copiedItem === 'api-json' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  Copy JSON
                </button>
              </div>
            </div>

            {/* Endpoints Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px] bg-slate-950/60">
                      <th className="py-3 px-4">Method & Route</th>
                      <th className="py-3 px-4">Role Access</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Purpose</th>
                      <th className="py-3 px-4">Request / Response Schema</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredEndpoints.map((ep, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-mono">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                                ep.method === 'GET'
                                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                  : ep.method === 'POST'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : ep.method === 'PUT'
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  : ep.method === 'PATCH'
                                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {ep.method}
                            </span>
                            <span className="text-slate-200 font-semibold">{ep.path}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 text-[11px] rounded font-mono font-medium ${
                              ep.role === 'Admin'
                                ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                : ep.role === 'Manager'
                                ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                : ep.role === 'Member' || ep.role === 'Authenticated'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {ep.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{ep.category}</td>
                        <td className="py-3 px-4 text-slate-300 font-sans">{ep.purpose}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                          {ep.requestBody && (
                            <div className="text-slate-300">
                              <span className="text-slate-500">Body:</span> {ep.requestBody}
                            </div>
                          )}
                          <div className="text-slate-400">
                            <span className="text-slate-500">Res:</span> {ep.responseDesc}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SOCKET.IO EVENTS */}
        {activeTab === 'socket' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Radio className="w-5 h-5 text-indigo-400" />
                  Socket.IO Real-Time Event Architecture
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Full duplex WebSocket event communication channels, channel room isolation, and payload schemas.
                </p>
              </div>

              <button
                onClick={() => copyToClipboard(JSON.stringify(SOCKET_EVENTS, null, 2), 'sockets-json')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-mono rounded-lg border border-slate-700 transition"
              >
                {copiedItem === 'sockets-json' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                Copy Event Specs
              </button>
            </div>

            {/* Socket Flow Overview Banner */}
            <div className="bg-slate-900/60 border border-indigo-900/40 rounded-xl p-5">
              <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Radio className="w-4 h-4 animate-pulse text-indigo-400" /> WebSocket Room Partitioning Strategy
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
                  <span className="font-mono text-cyan-400 font-semibold">1. Global Presence Room</span>
                  <p className="text-slate-400 mt-1 text-[11px]">
                    Tracks connected user IDs and fires <code className="text-slate-300">user:presence_update</code> whenever any socket connects or disconnects.
                  </p>
                </div>
                <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
                  <span className="font-mono text-emerald-400 font-semibold">2. Project Rooms (`project_&#123;id&#125;`)</span>
                  <p className="text-slate-400 mt-1 text-[11px]">
                    Kanban drag-and-drop, typing indicators, live notes editing delta patches, and real-time project chat are strictly confined to project members.
                  </p>
                </div>
                <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
                  <span className="font-mono text-purple-400 font-semibold">3. Admin Telemetry Room (`admin_dashboard`)</span>
                  <p className="text-slate-400 mt-1 text-[11px]">
                    Exclusive to Angular Admin clients with Admin JWTs. Receives 5-second health ticks and global audit notifications.
                  </p>
                </div>
              </div>
            </div>

            {/* Socket Events Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px] bg-slate-950/60">
                      <th className="py-3 px-4">Event Name</th>
                      <th className="py-3 px-4">Payload Schema</th>
                      <th className="py-3 px-4">Emitted By</th>
                      <th className="py-3 px-4">Listeners / Target Room</th>
                      <th className="py-3 px-4">Operational Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {SOCKET_EVENTS.map((evt, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-mono font-bold text-indigo-300">
                          {evt.name}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-cyan-300 max-w-xs break-words">
                          {evt.payload}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 text-[10px] rounded font-mono font-medium ${
                              evt.emitter === 'React Client'
                                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                                : evt.emitter === 'Angular Admin'
                                ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            }`}
                          >
                            {evt.emitter}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px]">
                          <div className="text-slate-200">{evt.listeners}</div>
                          <div className="text-slate-500 text-[10px]">Scope: {evt.roomScope}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-300 font-sans">{evt.purpose}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: ROLE-PERMISSION MATRIX */}
        {activeTab === 'rbac' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  Role-Based Access Control (RBAC) Permission Matrix
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Hierarchical permission grid for Member, Manager, and Admin roles across all application modules.
                </p>
              </div>

              <button
                onClick={() => copyToClipboard(JSON.stringify(ROLE_PERMISSIONS, null, 2), 'rbac-json')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-mono rounded-lg border border-slate-700 transition"
              >
                {copiedItem === 'rbac-json' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                Copy Matrix
              </button>
            </div>

            {/* Role Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-emerald-900/40">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400 font-mono text-sm">Role: Member</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800">React Client</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Standard team contributor. Can view assigned projects, create tasks, move Kanban cards, write notes, and chat in project rooms.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-blue-900/40">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-400 font-mono text-sm">Role: Manager</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-blue-950 text-blue-300 border border-blue-800">React Client</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Project leader. Can create project workspaces, add/remove members, assign tasks to any team member, pin notes, and moderate chat.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-purple-900/40">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-400 font-mono text-sm">Role: Admin</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-purple-950 text-purple-300 border border-purple-800">Angular Admin</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  System governor. Manages users (role change, deactivation), inspects audit activities, monitors live server throughput & health.
                </p>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px] bg-slate-950/60">
                      <th className="py-3 px-4">System Module</th>
                      <th className="py-3 px-4">Action / Capability</th>
                      <th className="py-3 px-4 text-center">Member</th>
                      <th className="py-3 px-4 text-center">Manager</th>
                      <th className="py-3 px-4 text-center">Admin</th>
                      <th className="py-3 px-4">Operational Rule / Context</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {ROLE_PERMISSIONS.map((perm, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-mono font-semibold text-slate-300">{perm.module}</td>
                        <td className="py-3 px-4 text-white font-medium">{perm.action}</td>
                        <td className="py-3 px-4 text-center">
                          {perm.member ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400">✓</span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 text-slate-600">✕</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {perm.manager ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/20 text-blue-400">✓</span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 text-slate-600">✕</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {perm.admin ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-purple-500/20 text-purple-400">✓</span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 text-slate-600">✕</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">{perm.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: DOCKER ARCHITECTURE */}
        {activeTab === 'docker' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Server className="w-5 h-5 text-indigo-400" />
                  Docker Multi-Container Orchestration (`docker-compose.yml`)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Isolated network bridges connecting backend, React client, Angular admin, and persistent MongoDB database volume.
                </p>
              </div>

              <button
                onClick={() => copyToClipboard(`version: '3.8'

services:
  # MongoDB Service with Persistent Volume
  mongo:
    image: mongo:7.0
    container_name: hub_mongo
    restart: always
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_DATABASE: project_hub
    volumes:
      - mongo_data:/data/db
    networks:
      - hub_net

  # Node.js + Express + Socket.IO Backend
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: hub_backend
    restart: always
    ports:
      - "5000:5000"
    environment:
      PORT: 5000
      MONGO_URI: mongodb://mongo:27017/project_hub
      JWT_SECRET: super_secure_jwt_secret_for_awp_2026
      JWT_EXPIRES_IN: 7d
      CLIENT_ORIGIN: http://localhost:3000
      ADMIN_ORIGIN: http://localhost:4200
    depends_on:
      - mongo
    networks:
      - hub_net

  # React Client for Members & Managers
  react-client:
    build:
      context: ./react-client
      dockerfile: Dockerfile
    container_name: hub_react_client
    restart: always
    ports:
      - "3000:80"
    depends_on:
      - backend
    networks:
      - hub_net

  # Angular Admin for System Administrators
  angular-admin:
    build:
      context: ./angular-admin
      dockerfile: Dockerfile
    container_name: hub_angular_admin
    restart: always
    ports:
      - "4200:80"
    depends_on:
      - backend
    networks:
      - hub_net

volumes:
  mongo_data:

networks:
  hub_net:
    driver: bridge`, 'docker-compose-yml')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-mono rounded-lg border border-slate-700 transition"
              >
                {copiedItem === 'docker-compose-yml' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                Copy docker-compose.yml
              </button>
            </div>

            {/* Docker Compose Code Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 font-mono text-xs overflow-x-auto text-slate-300">
                <div className="text-slate-500 pb-2 mb-3 border-b border-slate-800 flex items-center justify-between">
                  <span>docker-compose.yml</span>
                  <span className="text-indigo-400">4 Services | 1 Network | 1 Volume</span>
                </div>
                <pre className="text-indigo-200">
{`version: '3.8'

services:
  # 1. MongoDB Database
  mongo:
    image: mongo:7.0
    container_name: hub_mongo
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_DATABASE: project_hub
    volumes:
      - mongo_data:/data/db
    networks:
      - hub_net

  # 2. Node.js + Express API & Socket.IO
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: hub_backend
    ports:
      - "5000:5000"
    environment:
      PORT: 5000
      MONGO_URI: mongodb://mongo:27017/project_hub
      JWT_SECRET: super_secure_jwt_secret_for_awp_2026
      CLIENT_ORIGIN: http://localhost:3000
      ADMIN_ORIGIN: http://localhost:4200
    depends_on:
      - mongo
    networks:
      - hub_net

  # 3. React SPA (Members & Managers)
  react-client:
    build:
      context: ./react-client
      dockerfile: Dockerfile
    container_name: hub_react_client
    ports:
      - "3000:80"
    depends_on:
      - backend
    networks:
      - hub_net

  # 4. Angular SPA (Admin Panel & Analytics)
  angular-admin:
    build:
      context: ./angular-admin
      dockerfile: Dockerfile
    container_name: hub_angular_admin
    ports:
      - "4200:80"
    depends_on:
      - backend
    networks:
      - hub_net

volumes:
  mongo_data:

networks:
  hub_net:
    driver: bridge`}
                </pre>
              </div>

              {/* Startup & Lifecycle Commands */}
              <div className="space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                    <Server className="w-4 h-4 text-emerald-400" /> CLI Spin-up Commands
                  </h4>
                  <div className="space-y-2 font-mono text-[11px]">
                    <div className="p-2 bg-slate-950 rounded border border-slate-800 text-slate-300">
                      <span className="text-emerald-400">$</span> docker-compose up --build -d
                    </div>
                    <div className="p-2 bg-slate-950 rounded border border-slate-800 text-slate-300">
                      <span className="text-emerald-400">$</span> docker-compose logs -f backend
                    </div>
                    <div className="p-2 bg-slate-950 rounded border border-slate-800 text-slate-300">
                      <span className="text-emerald-400">$</span> docker-compose down -v
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-cyan-400" /> Service Port Mapping
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex justify-between items-center p-1.5 rounded bg-slate-950/60 border border-slate-800/80">
                      <span>React Client:</span>
                      <span className="font-mono text-cyan-400">http://localhost:3000</span>
                    </li>
                    <li className="flex justify-between items-center p-1.5 rounded bg-slate-950/60 border border-slate-800/80">
                      <span>Angular Admin:</span>
                      <span className="font-mono text-rose-400">http://localhost:4200</span>
                    </li>
                    <li className="flex justify-between items-center p-1.5 rounded bg-slate-950/60 border border-slate-800/80">
                      <span>Express + Sockets:</span>
                      <span className="font-mono text-emerald-400">http://localhost:5000</span>
                    </li>
                    <li className="flex justify-between items-center p-1.5 rounded bg-slate-950/60 border border-slate-800/80">
                      <span>MongoDB:</span>
                      <span className="font-mono text-amber-400">mongodb://localhost:27017</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/60 px-6 py-4 text-center text-xs text-slate-500">
        SyncSpace • Real-time tasks, notes and team chat in one workspace
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <SocketProvider>
          <ProjectProvider>
            <SyncSpaceAppContent />
          </ProjectProvider>
        </SocketProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

