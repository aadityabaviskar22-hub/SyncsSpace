import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import {
  FileText,
  Clock,
  Filter,
  CheckCircle2,
  Edit3,
  Trash2,
  UserCheck,
  ShieldAlert,
  ArrowRight,
  Search,
} from 'lucide-react';

interface AuditItem {
  id: string;
  action: 'task:created' | 'task:moved' | 'task:deleted' | 'note:updated' | 'role:changed' | 'user:login';
  actor: string;
  actorEmail: string;
  actorRole: string;
  target: string;
  details: string;
  timestamp: string;
}

const INITIAL_AUDIT_LOGS: AuditItem[] = [
  {
    id: 'a1',
    action: 'role:changed',
    actor: 'Sarah Connor',
    actorEmail: 'sarah@projecthub.io',
    actorRole: 'Admin',
    target: 'Elena Rostova',
    details: 'Promoted role from Member to Manager',
    timestamp: '2 minutes ago',
  },
  {
    id: 'a2',
    action: 'task:moved',
    actor: 'Aditya Baviskar',
    actorEmail: 'aditya@projecthub.io',
    actorRole: 'Manager',
    target: 'Task: Redis Pub/Sub cluster',
    details: 'Moved from InProgress to InReview',
    timestamp: '14 minutes ago',
  },
  {
    id: 'a3',
    action: 'note:updated',
    actor: 'Marcus Chen',
    actorEmail: 'marcus@projecthub.io',
    actorRole: 'Member',
    target: 'Note: Sprint Architecture Specs',
    details: 'Updated paragraph 4 and collaborator locks',
    timestamp: '1 hour ago',
  },
  {
    id: 'a4',
    action: 'task:created',
    actor: 'Aditya Baviskar',
    actorEmail: 'aditya@projecthub.io',
    actorRole: 'Manager',
    target: 'Task: Rate Limiting & Helmet',
    details: 'Created with priority Urgent and assigned to Marcus Chen',
    timestamp: '3 hours ago',
  },
  {
    id: 'a5',
    action: 'user:login',
    actor: 'Sarah Connor',
    actorEmail: 'sarah@projecthub.io',
    actorRole: 'Admin',
    target: 'System Auth',
    details: 'JWT Handshake successful via Web Client (IP: 192.168.1.10)',
    timestamp: '4 hours ago',
  },
  {
    id: 'a6',
    action: 'task:deleted',
    actor: 'Sarah Connor',
    actorEmail: 'sarah@projecthub.io',
    actorRole: 'Admin',
    target: 'Task: Deprecated Legacy API shim',
    details: 'Deleted work item from Kanban board',
    timestamp: '5 hours ago',
  },
];

export const ActivityAuditLog: React.FC = () => {
  const [filterAction, setFilterAction] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = INITIAL_AUDIT_LOGS.filter((log) => {
    const matchesAction = filterAction === 'ALL' || log.action === filterAction;
    const matchesSearch =
      log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAction && matchesSearch;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'task:created':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">CREATE_TASK</span>;
      case 'task:moved':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-950 text-blue-400 border border-blue-800">MOVE_TASK</span>;
      case 'task:deleted':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950 text-rose-400 border border-rose-800">DELETE_TASK</span>;
      case 'note:updated':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-400 border border-amber-800">UPDATE_NOTE</span>;
      case 'role:changed':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950 text-purple-400 border border-purple-800">ROLE_CHANGE</span>;
      case 'user:login':
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">USER_AUTH</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="inline-flex items-center gap-2 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <Clock className="w-4 h-4" /> Compliance & Security Audit
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">System Activity Audit Trail</h2>
        <p className="text-xs text-slate-400 mt-1">
          Immutable stream of user mutations, task modifications, note collaborative edits, and role adjustments.
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search action, actor, target..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400">Action Type:</span>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="ALL">All Actions</option>
            <option value="task:created">Task Created</option>
            <option value="task:moved">Task Moved</option>
            <option value="task:deleted">Task Deleted</option>
            <option value="note:updated">Note Updated</option>
            <option value="role:changed">Role Changed</option>
            <option value="user:login">User Auth</option>
          </select>
        </div>
      </div>

      {/* Logs List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/60">
        {filteredLogs.map((log) => (
          <div key={log.id} className="p-4 hover:bg-slate-800/30 transition flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="mt-1">{getActionBadge(log.action)}</div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">{log.actor}</span>
                  <span className="text-[10px] text-slate-500 font-mono">({log.actorRole})</span>
                  <ArrowRight className="w-3 h-3 text-slate-600" />
                  <span className="text-xs font-semibold text-indigo-300">{log.target}</span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">{log.details}</div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 shrink-0">
              <Clock className="w-3 h-3" /> {log.timestamp}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
