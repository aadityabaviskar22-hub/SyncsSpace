import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task, TaskStatus } from '../../types/index.js';
import { TaskCard } from './TaskCard.js';
import { Plus } from 'lucide-react';

interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
  colorDot: string;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  id,
  title,
  tasks,
  onSelectTask,
  onAddTask,
  colorDot,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: 'Column',
      status: id,
    },
  });

  const taskIds = tasks.map((t) => t._id);

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col w-80 shrink-0 bg-slate-100/70 dark:bg-slate-950/60 rounded-2xl p-3 border transition-colors ${
        isOver
          ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 ring-2 ring-indigo-500/20'
          : 'border-slate-200/80 dark:border-slate-800/80'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-2 py-1.5 mb-2">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${colorDot}`}></span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            {title}
          </h3>
          <span className="text-[11px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {tasks.length}
          </span>
        </div>

        <button
          onClick={() => onAddTask(id)}
          className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          title={`Add task to ${title}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Task List (Sortable Area) */}
      <div className="flex-1 overflow-y-auto space-y-2.5 min-h-[400px] max-h-[calc(100vh-230px)] pr-1 scrollbar-thin">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task._id} task={task} onSelect={onSelectTask} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="h-32 border-2 border-dashed border-slate-200 dark:border-slate-800/80 rounded-xl flex items-center justify-center text-xs text-slate-400">
            Drop tasks here
          </div>
        )}
      </div>

      {/* Add Task Footer Button */}
      <button
        onClick={() => onAddTask(id)}
        className="mt-2.5 w-full py-2 px-3 border border-dashed border-slate-300 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 rounded-xl text-xs font-medium text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-center gap-1.5 transition"
      >
        <Plus className="w-3.5 h-3.5" /> Add Task
      </button>
    </div>
  );
};
