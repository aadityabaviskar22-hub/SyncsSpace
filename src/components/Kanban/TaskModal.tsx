import React, { useState } from 'react';
import { Task, TaskStatus, TaskPriority, User, TaskAttachment } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';
import { useProject } from '../../context/ProjectContext.js';
import {
  X,
  Trash2,
  Calendar,
  Tag,
  Paperclip,
  MessageSquare,
  Upload,
  UserCheck,
  CheckCircle,
  FileText,
  Clock,
  Lock,
} from 'lucide-react';

interface TaskModalProps {
  task: Task | null;
  initialStatus?: TaskStatus;
  onClose: () => void;
  onSave: (taskData: Partial<Task>) => void;
  onDelete?: (taskId: string) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  task,
  initialStatus = 'Todo',
  onClose,
  onSave,
  onDelete,
}) => {
  const { user, currentRole } = useAuth();
  const { teamMembers } = useProject();

  const isMember = currentRole === 'Member';
  const isAssignedToUser = task?.assignedTo?._id === user?._id;
  const canEditDetails = !isMember || isAssignedToUser || !task;
  const canAssign = currentRole === 'Manager' || currentRole === 'Admin';
  const canDelete = currentRole === 'Manager' || currentRole === 'Admin';

  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [status, setStatus] = useState<TaskStatus>(task?.status || initialStatus);
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || 'Medium');
  const [assignedToId, setAssignedToId] = useState<string>(task?.assignedTo?._id || user?._id || '');
  const [dueDate, setDueDate] = useState<string>(
    task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
  );
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(task?.tags || ['Feature']);
  const [attachments, setAttachments] = useState<TaskAttachment[]>(task?.attachments || []);
  const [comments, setComments] = useState(task?.comments || []);
  const [newComment, setNewComment] = useState('');

  const isManager = user?.role === 'Manager' || user?.role === 'Admin';
  const isCreator = task?.createdBy?._id === user?._id;

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Simulated file upload for multer attachments
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newAttachments: TaskAttachment[] = Array.from(files).map((f) => ({
        filename: `${Date.now()}_${f.name}`,
        originalName: f.name,
        mimetype: f.type || 'application/octet-stream',
        size: f.size,
        uploadedAt: new Date(),
      }));
      setAttachments([...attachments, ...newAttachments]);
    }
  };

  const handleAddComment = () => {
    if (newComment.trim() && user) {
      const commentObj = {
        _id: `c_${Date.now()}`,
        user,
        text: newComment.trim(),
        createdAt: new Date(),
      };
      setComments([...comments, commentObj]);
      setNewComment('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const assignedUser = teamMembers.find((m) => m._id === assignedToId);

    onSave({
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      assignedTo: assignedUser,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      tags,
      attachments,
      comments,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <FileText className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {task ? 'Edit Task Details' : 'Create New Task'}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {task && onDelete && canDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this task?')) {
                    onDelete(task._id);
                    onClose();
                  }
                }}
                className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                title="Delete task (Manager/Admin)"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Read-Only Notice Banner for Member Role viewing other member's task */}
        {task && !canEditDetails && (
          <div className="px-6 py-2.5 bg-amber-950/70 border-b border-amber-800/80 text-amber-200 text-xs flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Read-Only View:</strong> As a Member, you can view this task and post comments, but only the assignee or Managers can modify details.
            </span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Task Title *
            </label>
            <input
              type="text"
              required
              disabled={!canEditDetails}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Integrate Redis Adapter for Socket.IO scaling"
              className={`w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                !canEditDetails ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            />
          </div>

          {/* Status & Priority Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Kanban Column (Status)
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Todo">To Do</option>
                <option value="InProgress">In Progress</option>
                <option value="InReview">In Review</option>
                <option value="Done">Done</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Assignee & Due Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Assignee</span>
                {!canAssign && <span className="text-[10px] text-amber-500 font-normal">Manager/Admin only</span>}
              </label>
              <select
                disabled={!canAssign}
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className={`w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  !canAssign ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              >
                <option value="">Unassigned</option>
                {teamMembers.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} ({m.role} - {m.department})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Task Description & Acceptance Criteria
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide technical context, steps to reproduce, or PR requirements..."
              className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Labels / Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Labels / Tags
            </label>
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-slate-400 hover:text-rose-500 ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add tag (e.g. Backend, Bug, UI) and press Enter"
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 transition"
              >
                Add
              </button>
            </div>
          </div>

          {/* File Attachments (Multer Upload) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              File Attachments (Multer max 10MB)
            </label>
            <div className="space-y-2">
              {attachments.map((att, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Paperclip className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                      {att.originalName}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ({Math.round(att.size / 1024)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                    className="text-rose-500 hover:text-rose-600 text-xs px-2"
                  >
                    Remove
                  </button>
                </div>
              ))}

              <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-xl cursor-pointer text-xs text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                <Upload className="w-4 h-4" />
                <span>Choose attachments to upload</span>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Activity / Comments Thread */}
          {task && (
            <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Comments & Discussion ({comments.length})
              </label>
              <div className="space-y-2.5 max-h-44 overflow-y-auto mb-3 pr-1">
                {comments.map((c) => (
                  <div key={c._id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <img
                          src={c.user.avatar}
                          alt={c.user.name}
                          className="w-4 h-4 rounded-full object-cover"
                        />
                        <span className="font-bold text-slate-800 dark:text-slate-200">{c.user.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 pl-6">{c.text}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                  placeholder="Leave a comment or question..."
                  className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddComment}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition"
                >
                  Post
                </button>
              </div>
            </div>
          )}

          {/* Footer Submit Buttons */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              {task ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
