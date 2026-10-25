import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, TaskPriority } from '../../types/index.js';
import { Calendar, Paperclip, MessageSquare, AlertCircle, GripVertical } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onSelect: (task: Task) => void;
  isOverlay?: boolean;
}

const getPriorityStyle = (priority: TaskPriority) => {
  switch (priority) {
    case 'Urgent':
      return 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-900';
    case 'High':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-900';
    case 'Medium':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300 dark:border-blue-900';
    case 'Low':
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700';
  }
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onSelect, isOverlay }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task._id,
    data: {
      type: 'Task',
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== 'Done';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-sm hover:shadow-md transition-all cursor-pointer ${
        isOverlay ? 'ring-2 ring-indigo-500 shadow-2xl rotate-1 scale-105' : ''
      }`}
      onClick={() => onSelect(task)}
    >
      {/* Drag handle & Priority */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider border ${getPriorityStyle(
              task.priority
            )}`}
          >
            {task.priority}
          </span>
          {task.tags?.map((tag, idx) => (
            <span
              key={idx}
              className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Drag Grab Grip */}
        <button
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded opacity-40 group-hover:opacity-100 transition"
          aria-label="Drag task"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Title */}
      <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-relaxed">
        {task.title}
      </h4>

      {/* Description Snippet */}
      {task.description && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-normal">
          {task.description}
        </p>
      )}

      {/* Card Footer: Due Date, Attachments, Comments, Assignee */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-3 text-slate-400">
          {task.dueDate && (
            <span
              className={`flex items-center gap-1 text-[10px] font-medium ${
                isOverdue
                  ? 'text-rose-600 dark:text-rose-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Calendar className="w-3 h-3" />
              {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </span>
          )}

          {task.attachments && task.attachments.length > 0 && (
            <span className="flex items-center gap-1 text-[10px]">
              <Paperclip className="w-3 h-3" />
              {task.attachments.length}
            </span>
          )}

          {task.comments && task.comments.length > 0 && (
            <span className="flex items-center gap-1 text-[10px]">
              <MessageSquare className="w-3 h-3" />
              {task.comments.length}
            </span>
          )}
        </div>

        {/* Assignee Avatar */}
        {task.assignedTo ? (
          <img
            src={task.assignedTo.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
            alt={task.assignedTo.name}
            title={`Assigned to ${task.assignedTo.name}`}
            className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
          />
        ) : (
          <span className="w-5 h-5 rounded-full border border-dashed border-slate-400 text-[10px] text-slate-400 flex items-center justify-center font-bold">
            ?
          </span>
        )}
      </div>
    </div>
  );
};
