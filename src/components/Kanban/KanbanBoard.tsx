import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Task, TaskStatus } from '../../types/index.js';
import { useProject } from '../../context/ProjectContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { KanbanColumn } from './KanbanColumn.js';
import { TaskCard } from './TaskCard.js';
import { TaskModal } from './TaskModal.js';
import { Search, Plus, Filter, Sparkles, Radio, Lock } from 'lucide-react';

const COLUMNS: { id: TaskStatus; title: string; colorDot: string }[] = [
  { id: 'Todo', title: 'To Do', colorDot: 'bg-slate-400' },
  { id: 'InProgress', title: 'In Progress', colorDot: 'bg-blue-500' },
  { id: 'InReview', title: 'Review', colorDot: 'bg-amber-500' },
  { id: 'Done', title: 'Done', colorDot: 'bg-emerald-500' },
];

export const KanbanBoard: React.FC = () => {
  const { tasks, moveTask, createTask, updateTask, deleteTask, teamMembers } = useProject();
  const { currentRole, user } = useAuth();
  const { showToast } = useToast();

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialStatus, setModalInitialStatus] = useState<TaskStatus>('Todo');

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState('ALL');

  // Configure sensors for drag responsiveness
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px drag activation distance to allow clicks
      },
    })
  );

  // Filtered tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (task.tags && task.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesPriority = priorityFilter === 'ALL' || task.priority === priorityFilter;
    const matchesAssignee =
      assigneeFilter === 'ALL' || task.assignedTo?._id === assigneeFilter;

    return matchesSearch && matchesPriority && matchesAssignee;
  });

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t._id === active.id);
    if (!task) return;

    // Check Role permissions: Members can ONLY move tasks assigned to them
    if (currentRole === 'Member' && task.assignedTo?._id !== user?._id) {
      showToast('Access denied: Members can only move tasks assigned to them.', 'error');
      return;
    }

    setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === 'Task';
    const isOverTask = over.data.current?.type === 'Task';
    const isOverColumn = over.data.current?.type === 'Column';

    if (!isActiveTask) return;

    const activeTaskItem = tasks.find((t) => t._id === activeId);
    if (!activeTaskItem) return;

    // Verify role permissions
    if (currentRole === 'Member' && activeTaskItem.assignedTo?._id !== user?._id) {
      return;
    }

    // Dropping a task over another task in a different column
    if (isActiveTask && isOverTask) {
      const overTaskItem = tasks.find((t) => t._id === overId);

      if (activeTaskItem && overTaskItem && activeTaskItem.status !== overTaskItem.status) {
        moveTask(activeId, overTaskItem.status, overTaskItem.orderIndex);
      }
    }

    // Dropping a task over an empty column
    if (isActiveTask && isOverColumn) {
      const overColumnStatus = over.data.current?.status as TaskStatus;

      if (activeTaskItem && activeTaskItem.status !== overColumnStatus) {
        moveTask(activeId, overColumnStatus, 0);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const activeId = active.id as string;
    const activeTaskItem = tasks.find((t) => t._id === activeId);

    setActiveTask(null);

    if (!over || !activeTaskItem) return;

    // Verify role permissions
    if (currentRole === 'Member' && activeTaskItem.assignedTo?._id !== user?._id) {
      showToast('Access denied: Members can only move their assigned tasks.', 'error');
      return;
    }

    const overId = over.id as string;

    // Dropping over another task in the same column (reordering)
    if (over.data.current?.type === 'Task') {
      const overTaskItem = tasks.find((t) => t._id === overId);
      if (overTaskItem && activeTaskItem.status === overTaskItem.status) {
        const columnTasks = tasks.filter((t) => t.status === activeTaskItem.status);
        const oldIndex = columnTasks.findIndex((t) => t._id === activeId);
        const newIndex = columnTasks.findIndex((t) => t._id === overId);

        if (oldIndex !== newIndex) {
          moveTask(activeId, activeTaskItem.status, newIndex);
        }
      }
    }
  };

  const handleOpenCreateModal = (status: TaskStatus = 'Todo') => {
    if (currentRole === 'Member') {
      showToast('Access denied: Member role cannot create tasks. Only Managers and Admins have permission.', 'error');
      return;
    }
    setSelectedTask(null);
    setModalInitialStatus(status);
    setIsModalOpen(true);
  };

  const handleSelectTask = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Board Controls: Search & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm">
        
        {/* Left: Search & Quick stats */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search tasks, descriptions, #tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          >
            <option value="ALL">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Assignee Filter */}
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          >
            <option value="ALL">All Assignees</option>
            {teamMembers.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name} {m._id === user?._id ? '(You)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Right: Real-time broadcast pulse & New Task CTA */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-800/60">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            Socket Live Sync Active
          </div>

          {/* New Task Button - Hidden/Disabled for Members */}
          {currentRole !== 'Member' ? (
            <button
              onClick={() => handleOpenCreateModal('Todo')}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> New Task
            </button>
          ) : (
            <button
              onClick={() => showToast('Access denied: Members cannot create tasks. Only Managers and Admins have permission.', 'warning')}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/50 text-slate-500 text-xs font-semibold rounded-xl border border-slate-700/50 transition cursor-not-allowed"
              title="Task creation restricted to Manager and Admin"
            >
              <Lock className="w-3.5 h-3.5 text-slate-500" /> New Task (Restricted)
            </button>
          )}
        </div>

      </div>

      {/* Kanban Columns Drag and Drop Container */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex items-start gap-4 overflow-x-auto pb-6 scrollbar-thin">
          {COLUMNS.map((col) => {
            const columnTasks = filteredTasks
              .filter((t) => t.status === col.id)
              .sort((a, b) => a.orderIndex - b.orderIndex);

            return (
              <KanbanColumn
                key={col.id}
                id={col.id}
                title={col.title}
                colorDot={col.colorDot}
                tasks={columnTasks}
                onSelectTask={handleSelectTask}
                onAddTask={(status) => handleOpenCreateModal(status)}
              />
            );
          })}
        </div>

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} onSelect={() => {}} isOverlay /> : null}
        </DragOverlay>
      </DndContext>

      {/* Task Creation / Details Modal */}
      {isModalOpen && (
        <TaskModal
          task={selectedTask}
          initialStatus={modalInitialStatus}
          onClose={() => setIsModalOpen(false)}
          onSave={(taskData) => {
            if (selectedTask) {
              updateTask(selectedTask._id, taskData);
              showToast(`Task "${taskData.title || selectedTask.title}" updated.`, 'success');
            } else {
              createTask(taskData);
              showToast(`New task created.`, 'success');
            }
          }}
          onDelete={(taskId) => {
            if (currentRole === 'Member') {
              showToast('Access denied: Members cannot delete tasks.', 'error');
              return;
            }
            deleteTask(taskId);
            showToast('Task removed.', 'info');
          }}
        />
      )}
    </div>
  );
};
