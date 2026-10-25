import React, { useState, useRef, useEffect } from 'react';
import { useProject } from '../../context/ProjectContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { useSocket } from '../../context/SocketContext.js';
import { Send, Users, Paperclip, MessageSquare, Sparkles, Smile } from 'lucide-react';

export const ChatDrawer: React.FC = () => {
  const { messages, sendMessage, setTyping, typingUsers, teamMembers } = useProject();
  const { user } = useAuth();
  const { onlineUsers } = useSocket();

  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    sendMessage(inputMessage.trim());
    setInputMessage('');
    setTyping(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
    setTyping(e.target.value.length > 0);
  };

  const typingNames = Object.values(typingUsers).filter((name) => name !== user?.name);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-160px)] animate-fadeIn">
      
      {/* Left: Online Project Members Sidebar */}
      <div className="hidden lg:flex lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex-col overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Team Channel Members
            </h3>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
            {onlineUsers.length} Online
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {teamMembers.map((member) => {
            const isOnline = onlineUsers.includes(member._id);
            return (
              <div
                key={member._id}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
              >
                <div className="relative">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-white dark:ring-slate-800"
                  />
                  <span
                    className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                      isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                    }`}
                  ></span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {member.name}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-semibold ${
                        member.role === 'Manager'
                          ? 'text-blue-500'
                          : member.role === 'Admin'
                          ? 'text-purple-500'
                          : 'text-slate-500'
                      }`}
                    >
                      {member.role}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                    {member.department}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 text-center">
          Socket.IO channel: <code className="text-indigo-400 font-mono">project_p1</code>
        </div>
      </div>

      {/* Right: Real-time Message Stream */}
      <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-sm">
        
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <MessageSquare className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                # General Project Stream
              </h3>
              <p className="text-[11px] text-slate-400">
                Persistent WebSocket room for live team discussion and task status alerts
              </p>
            </div>
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => {
            const isMe = msg.senderId._id === user?._id;
            return (
              <div
                key={msg._id}
                className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <img
                  src={msg.senderId.avatar}
                  alt={msg.senderId.name}
                  className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-slate-200 dark:ring-slate-700"
                />

                <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 mb-1 text-[11px]">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {isMe ? 'You' : msg.senderId.name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      isMe
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>

        {/* Typing indicator */}
        {typingNames.length > 0 && (
          <div className="px-4 py-1.5 text-[11px] text-indigo-500 font-medium italic animate-pulse flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"></span>
            {typingNames.join(', ')} {typingNames.length === 1 ? 'is' : 'are'} typing...
          </div>
        )}

        {/* Message Input Box */}
        <form onSubmit={handleSend} className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={handleInputChange}
            placeholder={`Message #general as ${user?.name}...`}
            className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl transition shadow-md shadow-indigo-600/20"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>

    </div>
  );
};
