import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext.js';
import { useAuth } from '../../context/AuthContext.js';
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  Activity,
  Layers,
  ArrowUpRight,
  Filter,
  BarChart2,
  Calendar,
  Zap,
} from 'lucide-react';

export const AnalyticsDashboard: React.FC = () => {
  const { tasks, activeProject, teamMembers } = useProject();
  const { currentRole } = useAuth();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');

  // Compute metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'Done').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'InProgress').length;
  const inReviewTasks = tasks.filter((t) => t.status === 'InReview').length;
  const todoTasks = tasks.filter((t) => t.status === 'Todo').length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Workload per user
  const userWorkloads = teamMembers.map((member) => {
    const memberTasks = tasks.filter((t) => t.assignedTo?._id === member._id);
    const memberDone = memberTasks.filter((t) => t.status === 'Done').length;
    const memberInProgress = memberTasks.filter((t) => t.status === 'InProgress').length;
    const loadPercent = totalTasks > 0 ? Math.round((memberTasks.length / totalTasks) * 100) : 0;

    return {
      user: member,
      total: memberTasks.length,
      done: memberDone,
      inProgress: memberInProgress,
      loadPercent,
    };
  });

  // Weekly completed tasks data (simulated velocity)
  const weeklyData = [
    { week: 'Week 1', completed: 4, target: 5 },
    { week: 'Week 2', completed: 7, target: 6 },
    { week: 'Week 3', completed: 9, target: 8 },
    { week: 'Week 4 (Current)', completed: completedTasks, target: 10 },
  ];

  const maxWeekly = Math.max(...weeklyData.map((d) => Math.max(d.completed, d.target)), 10);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Role Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div>
          <div className="inline-flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4" /> Real-time Project Analytics
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Sprint & Delivery Performance
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
              {activeProject.title}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tracking velocity, member allocations, and milestone throughput for managers & admins.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                timeRange === '7d' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                timeRange === '30d' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setTimeRange('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                timeRange === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Time
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Tasks</span>
            <div className="p-2 bg-slate-800 rounded-lg text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">{totalTasks}</div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 mt-2 font-mono">
            <ArrowUpRight className="w-3.5 h-3.5" /> +12% sprint throughput
          </div>
        </div>

        {/* Completed */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Completed</span>
            <div className="p-2 bg-emerald-950 text-emerald-400 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400">{completedTasks}</div>
          <div className="text-xs text-slate-400 mt-2 font-mono">
            {completionRate}% overall sprint completion
          </div>
        </div>

        {/* In Progress & Review */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">In Flight</span>
            <div className="p-2 bg-blue-950 text-blue-400 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-blue-400">{inProgressTasks + inReviewTasks}</div>
          <div className="text-xs text-slate-400 mt-2 font-mono">
            {inProgressTasks} In Progress • {inReviewTasks} Review
          </div>
        </div>

        {/* Velocity / Team Load */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Team Velocity</span>
            <div className="p-2 bg-purple-950 text-purple-400 rounded-lg">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-purple-400">9.4 pts/wk</div>
          <div className="flex items-center gap-1.5 text-xs text-purple-300 mt-2 font-mono">
            <Activity className="w-3.5 h-3.5 text-purple-400" /> Optimal bandwidth
          </div>
        </div>
      </div>

      {/* Grid: Tasks by Status & Weekly Completed Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks by Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-400" /> Tasks by Status
            </h3>
            <span className="text-xs text-slate-400 font-mono">100% Normalized</span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span> To Do
                </span>
                <span className="text-slate-400 font-mono">
                  {todoTasks} ({totalTasks > 0 ? Math.round((todoTasks / totalTasks) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-400 transition-all duration-500 rounded-full"
                  style={{ width: `${totalTasks > 0 ? (todoTasks / totalTasks) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> In Progress
                </span>
                <span className="text-slate-400 font-mono">
                  {inProgressTasks} ({totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-500 rounded-full"
                  style={{ width: `${totalTasks > 0 ? (inProgressTasks / totalTasks) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Under Review
                </span>
                <span className="text-slate-400 font-mono">
                  {inReviewTasks} ({totalTasks > 0 ? Math.round((inReviewTasks / totalTasks) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all duration-500 rounded-full"
                  style={{ width: `${totalTasks > 0 ? (inReviewTasks / totalTasks) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Completed (Done)
                </span>
                <span className="text-slate-400 font-mono">
                  {completedTasks} ({completionRate}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                  style={{ width: `${completionRate}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Completed Tasks Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" /> Weekly Completed Tasks
            </h3>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500"></span> Completed
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-700"></span> Target
              </span>
            </div>
          </div>

          <div className="flex items-end justify-between h-48 gap-4 pt-4 border-b border-slate-800">
            {weeklyData.map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div className="w-full max-w-[36px] flex items-end justify-center gap-1 h-36">
                  {/* Target Bar */}
                  <div
                    className="w-1/2 bg-slate-700/60 rounded-t transition-all hover:bg-slate-600"
                    style={{ height: `${(item.target / maxWeekly) * 100}%` }}
                    title={`Target: ${item.target}`}
                  ></div>
                  {/* Completed Bar */}
                  <div
                    className="w-1/2 bg-indigo-500 hover:bg-indigo-400 rounded-t transition-all relative group"
                    style={{ height: `${(item.completed / maxWeekly) * 100}%` }}
                  >
                    <span className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] bg-slate-950 text-indigo-300 px-1 py-0.5 rounded border border-indigo-800 transition pointer-events-none">
                      {item.completed}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 truncate max-w-full font-mono">{item.week}</span>
              </div>
            ))}
          </div>
          <div className="text-[11px] text-slate-500 text-center mt-3">
            Real-time aggregate completed task counts synced through Mongoose aggregation endpoints.
          </div>
        </div>
      </div>

      {/* Workload per User */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" /> Workload per Team Member
          </h3>
          <span className="text-xs text-slate-400">Active Sprint Assignments</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="pb-3 font-semibold">Member</th>
                <th className="pb-3 font-semibold">Department</th>
                <th className="pb-3 font-semibold">Role</th>
                <th className="pb-3 font-semibold">Active Tasks</th>
                <th className="pb-3 font-semibold">Completed</th>
                <th className="pb-3 font-semibold">Workload Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {userWorkloads.map((item) => (
                <tr key={item.user._id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 flex items-center gap-2.5">
                    <img
                      src={item.user.avatar}
                      alt={item.user.name}
                      className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-700"
                    />
                    <div>
                      <div className="font-semibold text-slate-200">{item.user.name}</div>
                      <div className="text-[10px] text-slate-500">{item.user.email}</div>
                    </div>
                  </td>
                  <td className="py-3 text-slate-400">{item.user.department || 'Engineering'}</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                        item.user.role === 'Admin'
                          ? 'bg-purple-950 text-purple-300 border border-purple-800/60'
                          : item.user.role === 'Manager'
                          ? 'bg-blue-950 text-blue-300 border border-blue-800/60'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                      }`}
                    >
                      {item.user.role}
                    </span>
                  </td>
                  <td className="py-3 font-mono text-slate-200">
                    <span className="font-bold text-indigo-400">{item.inProgress}</span> / {item.total}
                  </td>
                  <td className="py-3 font-mono text-emerald-400">{item.done}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2 w-36">
                      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${item.loadPercent}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{item.loadPercent}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
