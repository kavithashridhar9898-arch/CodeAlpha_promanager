import React, { useState, useEffect, useRef } from 'react';
import { Search, Folder, CheckSquare, MessageSquare, User, Loader2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '../../hooks/useSearch';

export const GlobalSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: results, isLoading } = useSearch(debouncedQuery);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = (path: string) => {
    navigate(path);
    setIsOpen(false);
    setQuery('');
  };

  const hasResults = results && (
    results.projects.length > 0 ||
    results.tasks.length > 0 ||
    results.users.length > 0 ||
    results.comments.length > 0
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative flex items-center w-64 md:w-80">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-10 py-2 border border-slate-700 rounded-lg leading-5 bg-slate-800 text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
          placeholder="Search projects, tasks, comments..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim().length > 0) setIsOpen(true);
          }}
        />
        {query && (
          <button
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
          >
            <X className="h-4 w-4 text-gray-400 hover:text-white" />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && query.trim().length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 max-h-[80vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-6 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Searching...
            </div>
          ) : !hasResults ? (
            <div className="p-6 text-center text-gray-500 text-sm">
              No results found for "{query}"
            </div>
          ) : (
            <div className="py-2">
              {results.projects.length > 0 && (
                <div className="px-2">
                  <h3 className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Projects</h3>
                  {results.projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => handleResultClick(`/projects/${project.id}`)}
                      className="w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-slate-700/50 rounded-lg transition-colors group"
                    >
                      <div className="w-8 h-8 rounded bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                        <Folder className="w-4 h-4" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium text-white truncate">{project.name}</p>
                        {project.description && (
                          <p className="text-xs text-gray-500 truncate">{project.description}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.tasks.length > 0 && (
                <div className="px-2 mt-2">
                  <h3 className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Tasks</h3>
                  {results.tasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => handleResultClick(`/projects/${task.column.board.projectId}`)}
                      className="w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-slate-700/50 rounded-lg transition-colors group"
                    >
                      <div className="w-8 h-8 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center">
                        <CheckSquare className="w-4 h-4" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium text-white truncate">{task.title}</p>
                        <p className="text-xs text-gray-500 truncate">in {task.column.board.project.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.comments.length > 0 && (
                <div className="px-2 mt-2">
                  <h3 className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Comments</h3>
                  {results.comments.map((comment) => (
                    <button
                      key={comment.id}
                      onClick={() => handleResultClick(`/projects/${comment.task.column.board.projectId}`)}
                      className="w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-slate-700/50 rounded-lg transition-colors group"
                    >
                      <div className="w-8 h-8 rounded bg-teal-500/20 text-teal-400 flex items-center justify-center">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm text-gray-300 truncate italic">"{comment.content}"</p>
                        <p className="text-xs text-gray-500 truncate">on {comment.task.title}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.users.length > 0 && (
                <div className="px-2 mt-2">
                  <h3 className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Users</h3>
                  {results.users.map((u) => (
                    <div
                      key={u.id}
                      className="w-full text-left px-3 py-2 flex items-center gap-3 rounded-lg"
                    >
                      <div className="flex-shrink-0">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium text-white truncate">{u.name}</p>
                        <p className="text-xs text-gray-500 truncate">{u.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
