import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject, useArchiveProject, useRemoveMember } from '../hooks/useProjects';
import { useAuthStore } from '../store/authStore';
import { EditProjectDialog } from '../components/projects/EditProjectDialog';
import { DeleteConfirmationDialog } from '../components/projects/DeleteConfirmationDialog';
import { InviteMemberDialog } from '../components/projects/InviteMemberDialog';
import { Settings, Trash2, Archive, UserPlus, Shield, XCircle, ArrowLeft, Activity } from 'lucide-react';
import { Board } from '../components/board/Board';
import { ActivityTimeline } from '../components/activities/ActivityTimeline';

export const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  
  const { data: project, isLoading, error } = useProject(id!);
  const { mutateAsync: archiveProject } = useArchiveProject();
  const { mutateAsync: removeMember } = useRemoveMember();

  const [activeTab, setActiveTab] = useState<'overview' | 'board' | 'activity'>('overview');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="h-full bg-slate-950 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="h-full bg-slate-950 p-8 flex flex-col items-center justify-center text-center">
        <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 max-w-md">
          <h2 className="text-xl font-bold mb-2">Project Not Found</h2>
          <p className="mb-6">The project you are looking for does not exist or you don't have access.</p>
          <button onClick={() => navigate('/projects')} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl transition-colors">
            Go back to Projects
          </button>
        </div>
      </div>
    );
  }

  const isOwner = project.owner.id === currentUser?.id;
  const isAdmin = project.members.some(m => m.user.id === currentUser?.id && m.role === 'ADMIN') || isOwner;

  const handleArchive = async () => {
    if (confirm('Are you sure you want to archive this project?')) {
      await archiveProject(project.id);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (confirm('Are you sure you want to remove this member?')) {
      await removeMember({ projectId: project.id, memberId });
    }
  };

  return (
    <div className="h-full bg-slate-950 p-8 text-white">
      <div className="max-w-5xl mx-auto">
        <button 
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </button>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500"></div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-extrabold tracking-tight">{project.name}</h1>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  project.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' :
                  project.status === 'COMPLETED' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-slate-500/20 text-slate-400'
                }`}>
                  {project.status}
                </span>
              </div>
              <p className="text-gray-400 max-w-2xl text-lg">
                {project.description || 'No description provided.'}
              </p>
            </div>

            {isAdmin && (
              <div className="flex flex-wrap items-center gap-3">
                <button 
                  onClick={() => setIsEditOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors font-medium"
                >
                  <Settings className="w-4 h-4" /> Edit
                </button>
                {isOwner && project.status !== 'ARCHIVED' && (
                  <button 
                    onClick={handleArchive}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 rounded-xl transition-colors font-medium border border-amber-500/20"
                  >
                    <Archive className="w-4 h-4" /> Archive
                  </button>
                )}
                {isOwner && (
                  <button 
                    onClick={() => setIsDeleteOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl transition-colors font-medium border border-red-500/20"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex border-b border-slate-800 mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 font-semibold text-sm transition-colors relative ${
              activeTab === 'overview' ? 'text-indigo-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            Overview
            {activeTab === 'overview' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('board')}
            className={`px-6 py-3 font-semibold text-sm transition-colors relative ${
              activeTab === 'board' ? 'text-indigo-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            Kanban Board
            {activeTab === 'board' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-6 py-3 font-semibold text-sm transition-colors relative flex items-center gap-2 ${
              activeTab === 'activity' ? 'text-indigo-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" /> Activity
            {activeTab === 'activity' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 rounded-t-full" />
            )}
          </button>
        </div>

        {activeTab === 'overview' ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Shield className="w-6 h-6 text-indigo-400" />
                Team Members
              </h2>
              {isAdmin && (
                <button 
                  onClick={() => setIsInviteOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors font-semibold"
                >
                  <UserPlus className="w-4 h-4" /> Invite
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                  <div className="flex items-center gap-4">
                    {member.user.avatarUrl ? (
                      <img src={member.user.avatarUrl} alt={member.user.name} className="w-10 h-10 rounded-full" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-lg">
                        {member.user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-white">{member.user.name}</h3>
                      <p className="text-sm text-gray-500">{member.user.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                      member.role === 'OWNER' ? 'bg-purple-500/20 text-purple-400' :
                      member.role === 'ADMIN' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-slate-700 text-gray-300'
                    }`}>
                      {member.role}
                    </span>
                    
                    {isOwner && member.role !== 'OWNER' && (
                      <button 
                        onClick={() => handleRemoveMember(member.user.id)}
                        className="text-red-400 hover:text-red-300 transition-colors p-1"
                        title="Remove Member"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'board' ? (
          <div className="h-[600px] border border-slate-800 bg-slate-900 rounded-3xl p-6">
            <Board projectId={project.id} />
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Activity className="w-6 h-6 text-indigo-400" />
                Project Activity
              </h2>
            </div>
            <ActivityTimeline projectId={project.id} />
          </div>
        )}
      </div>

      <EditProjectDialog isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} project={project} />
      <DeleteConfirmationDialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} projectId={project.id} projectName={project.name} />
      <InviteMemberDialog isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} projectId={project.id} />
    </div>
  );
};
