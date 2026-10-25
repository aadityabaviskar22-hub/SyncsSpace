import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { User, UserRole } from '../../types/index.js';
import { INITIAL_USERS } from '../../services/mockData.js';
import {
  Users,
  UserPlus,
  Search,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  Check,
  AlertCircle,
  Mail,
  Building,
} from 'lucide-react';

export const UserManagement: React.FC = () => {
  const { user: currentUser, currentRole, setRole } = useAuth();
  const { showToast } = useToast();

  const [usersList, setUsersList] = useState<User[]>(INITIAL_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // New user form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDepartment, setNewDepartment] = useState('Engineering');
  const [newRole, setNewRole] = useState<UserRole>('Member');

  // Filter users
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = (userId: string, targetRole: UserRole) => {
    if (currentRole !== 'Admin') {
      showToast('Access denied: Only Admins can modify user roles.', 'error');
      return;
    }

    setUsersList((prev) =>
      prev.map((u) => {
        if (u._id === userId) {
          return { ...u, role: targetRole };
        }
        return u;
      })
    );

    // If changing currently active user's role, sync global state
    if (currentUser?._id === userId) {
      setRole(targetRole);
    }

    showToast(`Successfully updated role for user to ${targetRole}.`, 'success');
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (currentRole !== 'Admin') {
      showToast('Access denied: Only Admins can delete users.', 'error');
      return;
    }

    if (currentUser?._id === userId) {
      showToast('Cannot delete the currently logged in Administrator.', 'warning');
      return;
    }

    if (confirm(`Are you sure you want to remove user "${userName}" from SyncSpace?`)) {
      setUsersList((prev) => prev.filter((u) => u._id !== userId));
      showToast(`User ${userName} has been removed.`, 'info');
    }
  };

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      showToast('Please provide a valid name and email address.', 'warning');
      return;
    }

    const newUser: User = {
      _id: `u_${Date.now()}`,
      name: newName.trim(),
      email: newEmail.trim(),
      department: newDepartment,
      role: newRole,
      avatar: `https://images.unsplash.com/photo-${1535713875002 + Math.floor(Math.random() * 1000)}?w=150&auto=format&fit=crop&q=80`,
      isOnline: true,
    };

    setUsersList((prev) => [newUser, ...prev]);
    setShowAddModal(false);
    setNewName('');
    setNewEmail('');
    showToast(`New ${newRole} "${newUser.name}" added successfully.`, 'success');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div>
          <div className="inline-flex items-center gap-2 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" /> Admin Access Only
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            User Management & Role Permissions
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage organization members, assign roles (Member, Manager, Admin), and review active access levels.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/25 transition cursor-pointer"
        >
          <UserPlus className="w-4 h-4" /> Add Team Member
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, email, department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400">Filter Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="ALL">All Roles ({usersList.length})</option>
            <option value="Admin">Admin</option>
            <option value="Manager">Manager</option>
            <option value="Member">Member</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4 font-semibold">User</th>
                <th className="py-3.5 px-4 font-semibold">Department</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold">Current Role</th>
                <th className="py-3.5 px-4 font-semibold">Change Role</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.map((u) => {
                const isCurrent = currentUser?._id === u._id;
                return (
                  <tr key={u._id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700"
                        />
                        {u.isOnline && (
                          <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-slate-900"></span>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                          {u.name}
                          {isCurrent && (
                            <span className="text-[9px] bg-slate-800 text-slate-400 px-1 rounded">You</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">{u.email}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-medium">{u.department || 'General'}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Active
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                          u.role === 'Admin'
                            ? 'bg-purple-950 text-purple-300 border border-purple-800/80'
                            : u.role === 'Manager'
                            ? 'bg-blue-950 text-blue-300 border border-blue-800/80'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800/80'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value as UserRole)}
                        className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:ring-2 focus:ring-purple-500 font-medium cursor-pointer"
                      >
                        <option value="Member">Member</option>
                        <option value="Manager">Manager</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteUser(u._id, u.name)}
                        disabled={isCurrent}
                        className={`p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition ${
                          isCurrent ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                        title={isCurrent ? 'Cannot delete yourself' : 'Remove user'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-purple-400" /> Add New Team Member
            </h3>

            <form onSubmit={handleAddUserSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rachel Adams"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="rachel@syncspace.io"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
                <select
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Frontend">Frontend</option>
                  <option value="Backend">Backend</option>
                  <option value="Product">Product</option>
                  <option value="Design">Design</option>
                  <option value="DevOps">DevOps</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Assigned Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                >
                  <option value="Member">Member (Tasks, Notes, Chat)</option>
                  <option value="Manager">Manager (Projects, Task Assignment, Analytics)</option>
                  <option value="Admin">Admin (Full Control, User Management, Audit)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/25 transition cursor-pointer"
                >
                  Confirm & Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
