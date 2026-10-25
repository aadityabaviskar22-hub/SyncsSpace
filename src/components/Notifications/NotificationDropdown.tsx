import React from 'react';
import { useProject } from '../../context/ProjectContext.js';
import { CheckCheck, Bell, ExternalLink } from 'lucide-react';

interface NotificationDropdownProps {
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onClose }) => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useProject();

  return (
    <div className="absolute right-0 top-12 w-80 md:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-fadeIn">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-indigo-500" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
            Notifications
          </h4>
        </div>
        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={markAllNotificationsAsRead}
            className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No notifications yet
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif._id}
              onClick={() => markNotificationAsRead(notif._id)}
              className={`p-3.5 flex items-start gap-3 transition cursor-pointer ${
                notif.isRead
                  ? 'bg-transparent opacity-75 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  : 'bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/30'
              }`}
            >
              <div className="mt-0.5 relative">
                {notif.senderId?.avatar ? (
                  <img
                    src={notif.senderId.avatar}
                    alt={notif.senderId.name}
                    className="w-7 h-7 rounded-full object-cover ring-2 ring-white dark:ring-slate-900"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center font-bold">
                    {notif.title[0]}
                  </div>
                )}
                {!notif.isRead && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-white dark:ring-slate-900"></span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h5 className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {notif.title}
                  </h5>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">
                  {notif.message}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 bg-slate-50 dark:bg-slate-950/70 border-t border-slate-200 dark:border-slate-800 text-center">
        <button
          onClick={onClose}
          className="text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
        >
          Close
        </button>
      </div>
    </div>
  );
};
