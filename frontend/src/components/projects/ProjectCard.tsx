import React from 'react';
import { Link } from 'react-router-dom';
import type { Project } from '../../hooks/useProjects';
import { Calendar, Users } from 'lucide-react';

export const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
  return (
    <div className="flex flex-col bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all group">
      <div className="p-6 flex-1">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
            {project.name}
          </h3>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            project.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
            project.status === 'COMPLETED' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
            'bg-slate-500/10 text-slate-400 border border-slate-500/20'
          }`}>
            {project.status}
          </span>
        </div>
        
        <p className="text-gray-400 text-sm line-clamp-2 mb-6 min-h-[40px]">
          {project.description || 'No description provided.'}
        </p>

        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            <span>{project.members.length} members</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>{new Date(project.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-700/50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          {project.owner.avatarUrl ? (
            <img src={project.owner.avatarUrl} alt={project.owner.name} className="w-6 h-6 rounded-full" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white">
              {project.owner.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-xs text-gray-400">Owned by {project.owner.name}</span>
        </div>

        <Link
          to={`/projects/${project.id}`}
          className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Open Project →
        </Link>
      </div>
    </div>
  );
};
