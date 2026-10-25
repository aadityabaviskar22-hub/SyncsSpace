import React, { useState, useEffect } from 'react';
import { useProject } from '../../context/ProjectContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { Note } from '../../types/index.js';
import {
  FileText,
  Pin,
  Plus,
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  Quote,
  Code,
  Check,
  Clock,
  Sparkles,
  Radio,
  Search,
} from 'lucide-react';

export const NotesWorkspace: React.FC = () => {
  const { notes, createNote, updateNote, setNoteEditing, editingNotePeer } = useProject();
  const { user } = useAuth();

  const [activeNoteId, setActiveNoteId] = useState<string>(notes[0]?._id || '');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const activeNote = notes.find((n) => n._id === activeNoteId) || notes[0];

  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title);
      setContent(activeNote.content);
    }
  }, [activeNote?._id]);

  // Handle live editing notification to peers
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    if (activeNote) {
      updateNote(activeNote._id, newContent, title);
      setNoteEditing(activeNote._id, true);

      // Debounce clearance of editing status
      const timeout = setTimeout(() => {
        setNoteEditing(activeNote._id, false);
      }, 1500);
      return () => clearTimeout(timeout);
    }
  };

  const insertFormatting = (prefix: string, suffix: string = '') => {
    setContent((prev) => `${prev}\n${prefix} `);
  };

  const handleCreateNewNote = () => {
    const newTitle = `Meeting Notes - ${new Date().toLocaleDateString()}`;
    const newContent = `## Agenda\n- Real-time sprint sync\n- Blockers and deliverables\n\n### Action Items\n- [ ] Task assignments`;
    createNote(newTitle, newContent);
  };

  const filteredNotes = notes.filter((n) =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-160px)] animate-fadeIn">
      
      {/* Left Sidebar: Notes Roster */}
      <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-sm">
        
        {/* Search & New Note CTA */}
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-500" />
              Project Docs & Scratchpads
            </h3>
            <button
              onClick={handleCreateNewNote}
              className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
              title="Create note"
            >
              <Plus className="w-3.5 h-3.5" /> New
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Note List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2 space-y-1">
          {filteredNotes.map((note) => {
            const isSelected = note._id === activeNote?._id;
            return (
              <div
                key={note._id}
                onClick={() => setActiveNoteId(note._id)}
                className={`p-3 rounded-xl cursor-pointer transition ${
                  isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5 truncate">
                    {note.isPinned && <Pin className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />}
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {note.title}
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    v{note.version}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {note.content.replace(/[#*`_\[\]]/g, '')}
                </p>

                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Author: {note.authorId.name.split(' ')[0]}</span>
                  <span>{new Date(note.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Right Pane: Note Editor & Live Collaboration */}
      <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-sm">
        
        {/* Peer Live Editing Indicator Banner */}
        {editingNotePeer && editingNotePeer.noteId === activeNote?._id && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-semibold">
              <Radio className="w-4 h-4 animate-ping" />
              <span>
                {editingNotePeer.user.name} is editing this document in real-time...
              </span>
            </div>
            <span className="text-[10px] font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
              Syncing
            </span>
          </div>
        )}

        {/* Note Header & Title Editor */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (activeNote) updateNote(activeNote._id, content, e.target.value);
            }}
            placeholder="Document Title"
            className="text-base font-bold text-slate-900 dark:text-white bg-transparent border-none focus:outline-none w-full"
          />

          <div className="flex items-center gap-3 shrink-0 text-xs text-slate-400">
            <span className="flex items-center gap-1 font-mono text-[11px]">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              v{activeNote?.version || 1}
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(content);
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
              }}
              className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 text-xs"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : null}
              {isCopied ? 'Copied' : 'Copy Markdown'}
            </button>
          </div>
        </div>

        {/* Rich Formatting Toolbar */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-1 text-slate-600 dark:text-slate-300">
          <button
            onClick={() => insertFormatting('**', '**')}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition"
            title="Bold"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('*', '*')}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition"
            title="Italic"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('~~', '~~')}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition"
            title="Strikethrough"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-4 bg-slate-300 dark:bg-slate-800 mx-1"></span>

          <button
            onClick={() => insertFormatting('# ')}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition"
            title="Heading 1"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('## ')}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition"
            title="Heading 2"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('- ')}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition"
            title="Bullet list"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('> ')}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition"
            title="Blockquote"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('```ts\n', '\n```')}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition"
            title="Code block"
          >
            <Code className="w-3.5 h-3.5" />
          </button>

          {/* Peer Simulation Button (Allows user to test peer editing banner on demand) */}
          <button
            onClick={() => {
              setNoteEditing(activeNote?._id || '', true);
            }}
            className="ml-auto text-[10px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-1 rounded border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 hover:bg-indigo-100"
          >
            <Sparkles className="w-3 h-3" /> Simulate Peer Typing
          </button>
        </div>

        {/* Textarea Editor Area */}
        <div className="flex-1 p-5 overflow-y-auto">
          <textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Start typing your rich notes, Markdown headings, checklists, code snippets..."
            className="w-full h-full bg-transparent border-none resize-none focus:outline-none text-slate-800 dark:text-slate-100 font-mono text-xs sm:text-sm leading-relaxed"
          />
        </div>

        {/* Editor Footer Status */}
        <div className="px-5 py-2 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Auto-saved with optimistic version check
          </span>
          <span>Last modified by: {activeNote?.lastModifiedBy?.name || user?.name}</span>
        </div>

      </div>

    </div>
  );
};
