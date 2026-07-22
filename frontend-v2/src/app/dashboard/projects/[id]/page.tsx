'use client';

import React, { useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { Task } from '@/components/board/KanbanBoard';
import { TaskDrawer } from '@/components/board/TaskDrawer';
import { ActivityTimeline } from '@/components/activities/ActivityTimeline';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, LayoutDashboard, Settings, Users, Activity, Shield, UserPlus, Trash2, Archive, Loader2, XCircle, Download, GitBranch } from 'lucide-react';
import { useProject, useArchiveProject, useRemoveMember } from '@/hooks/useProjects';
import { useAuthStore } from '@/store/authStore';
import { EditProjectDialog } from '@/components/projects/EditProjectDialog';
import { DeleteConfirmationDialog } from '@/components/projects/DeleteConfirmationDialog';
import { InviteMemberDialog } from '@/components/projects/InviteMemberDialog';
import { ProjectIntegrationsTab } from '@/components/projects/ProjectIntegrationsTab';
import { useBoard } from '@/hooks/useBoard';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';

const KanbanBoard = dynamic(() => import('@/components/board/KanbanBoard').then(mod => mod.KanbanBoard), { 
  loading: () => <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>,
  ssr: false 
});

const GanttChart = dynamic(() => import('@/components/board/GanttChart').then(mod => mod.GanttChart), { 
  loading: () => <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>,
  ssr: false 
});

function ProjectDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTaskId = searchParams.get('taskId');
  const projectId = params.id as string;
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'board' | 'activity' | 'gantt' | 'integrations'>('board');
  
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const currentUser = useAuthStore((s) => s.user);
  
  const { data: project, isLoading, error } = useProject(projectId);
  const { data: board } = useBoard(projectId);
  const allTasks = board?.columns.flatMap((c) => c.tasks) || [];
  const { mutateAsync: archiveProject, isPending: isArchiving } = useArchiveProject();
  const { mutateAsync: removeMember } = useRemoveMember();

  const { data: urlTask } = useQuery({
    queryKey: ['task', urlTaskId],
    queryFn: async () => {
      const { data } = await api.get(`/tasks/${urlTaskId}`);
      return data.data as Task;
    },
    enabled: !!urlTaskId,
  });

  React.useEffect(() => {
    if (urlTask && !selectedTask) {
      setSelectedTask(urlTask);
      router.replace(`/dashboard/projects/${projectId}`, undefined);
    }
  }, [urlTask, projectId, router, selectedTask]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-8 rounded-3xl max-w-md">
          <h2 className="text-xl font-bold mb-2">Project Not Found</h2>
          <p className="mb-6 opacity-80">This project may have been deleted, or you don't have access.</p>
          <button onClick={() => router.push('/dashboard/projects')} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground px-6 py-2.5 rounded-xl font-semibold transition-colors">
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  const isOwner = project.owner.id === currentUser?.id;
  const isAdmin = project.members.some((m: any) => m.user.id === currentUser?.id && m.role === 'ADMIN') || isOwner;

  const handleArchive = async () => {
    if (confirm('Are you sure you want to archive this project?')) {
      await archiveProject(project.id);
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const response = await api.get(`/projects/${project.id}/export/${format}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${project.name.replace(/\s+/g, '_')}_export.${format}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export project data');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (confirm('Are you sure you want to remove this member?')) {
      await removeMember({ projectId: project.id, memberId });
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="w-full h-1 bg-gradient-to-r from-primary via-indigo-500 to-emerald-500 absolute top-0 left-0"></div>

      <div className="mb-6">
        <button 
          onClick={() => router.push('/dashboard/projects')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-fit text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </button>
      </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 bg-card border border-border p-8 rounded-3xl shadow-sm relative overflow-hidden">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-extrabold text-foreground tracking-tight">{project.name}</h1>
              <span className={`text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full ${
                project.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                project.status === 'COMPLETED' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                'bg-secondary text-muted-foreground border border-border'
              }`}>
                {project.status}
              </span>
            </div>
            <p className="text-muted-foreground">{project.description || 'No description provided.'}</p>
          </div>
          
          {isAdmin && (
            <div className="flex flex-wrap items-center gap-3">
              {/* Export dropdown */}
              <div className="relative group">
                <button className="flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-foreground px-4 py-2 rounded-xl transition-colors font-medium border border-border">
                  <Download className="w-4 h-4" /> Export
                </button>
                <div className="absolute right-0 top-full mt-1 w-40 bg-card border border-border rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 overflow-hidden">
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full px-4 py-2.5 text-sm text-left hover:bg-secondary font-medium transition-colors"
                  >
                    Export as CSV
                  </button>
                  <button
                    onClick={() => handleExport('json')}
                    className="w-full px-4 py-2.5 text-sm text-left hover:bg-secondary font-medium transition-colors border-t border-border"
                  >
                    Export as JSON
                  </button>
                </div>
              </div>
              <button 
                onClick={() => setIsEditOpen(true)}
                className="flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-foreground px-4 py-2 rounded-xl transition-colors font-medium border border-border"
              >
                <Settings className="w-4 h-4" /> Edit
              </button>
              {isOwner && project.status !== 'ARCHIVED' && (
                <button 
                  onClick={handleArchive}
                  disabled={isArchiving}
                  className="flex items-center gap-2 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 px-4 py-2 rounded-xl transition-colors font-medium border border-amber-500/20 disabled:opacity-50"
                >
                  {isArchiving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />} Archive
                </button>
              )}
              {isOwner && (
                <button 
                  onClick={() => setIsDeleteOpen(true)}
                  className="flex items-center gap-2 bg-destructive/10 text-destructive hover:bg-destructive/20 px-4 py-2 rounded-xl transition-colors font-medium border border-destructive/20"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              )}
            </div>
          )}
        </div>


      <div className="flex border-b border-border mb-6">
        {[
          { id: 'board', label: 'Kanban Board', icon: LayoutDashboard },
          { id: 'gantt', label: 'Gantt Timeline', icon: Activity },
          { id: 'overview', label: 'Overview', icon: Users },
          { id: 'activity', label: 'Activity', icon: Activity },
          { id: 'integrations', label: 'Integrations', icon: GitBranch },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-colors relative ${
              activeTab === tab.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
            {activeTab === tab.id && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeTab === 'board' && (
            <motion.div 
              key="board"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="h-full"
            >
              <KanbanBoard projectId={projectId} onTaskClick={(task) => setSelectedTask(task)} />
            </motion.div>
          )}

          {activeTab === 'gantt' && (
            <motion.div
              key="gantt"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="h-full overflow-auto pb-4"
            >
              <GanttChart tasks={allTasks} />
            </motion.div>
          )}
          
          {activeTab === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="bg-card border border-border rounded-3xl p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                  <Shield className="w-5 h-5 text-primary" /> Team Members
                </h2>
                {isAdmin && (
                  <button 
                    onClick={() => setIsInviteOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-colors font-semibold shadow-lg shadow-primary/20"
                  >
                    <UserPlus className="w-4 h-4" /> Invite
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {project.members.map((member: any) => (
                  <div key={member.id} className="flex items-center justify-between p-4 bg-secondary/30 border border-border rounded-2xl">
                    <div className="flex items-center gap-4">
                      {member.user.avatarUrl ? (
                         <img src={member.user.avatarUrl.startsWith('http') ? member.user.avatarUrl : `http://localhost:5000${member.user.avatarUrl}`} alt={member.user.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                         <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                           {member.user.name.charAt(0).toUpperCase()}
                         </div>
                      )}
                      <div>
                        <h3 className="font-bold text-foreground">{member.user.name}</h3>
                        <p className="text-sm text-muted-foreground">{member.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-md ${
                        member.role === 'OWNER' ? 'bg-purple-500/10 text-purple-400' :
                        member.role === 'ADMIN' ? 'bg-blue-500/10 text-blue-400' :
                        'bg-secondary text-muted-foreground'
                      }`}>
                        {member.role}
                      </span>
                      
                      {isOwner && member.role !== 'OWNER' && (
                        <button 
                          onClick={() => handleRemoveMember(member.user.id)}
                          className="text-destructive/70 hover:text-destructive transition-colors p-1"
                          title="Remove Member"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'activity' && (
            <motion.div 
              key="activity"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="bg-card border border-border rounded-3xl p-6 h-[calc(100vh-16rem)] flex flex-col"
            >
              <div className="flex justify-between items-center mb-6 shrink-0">
                <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                  <Activity className="w-5 h-5 text-primary" /> Project Activity
                </h2>
              </div>
              <div className="flex-1 overflow-hidden">
                <ActivityTimeline projectId={projectId} />
              </div>
            </motion.div>
          )}

          {activeTab === 'integrations' && (
            <motion.div 
              key="integrations"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="h-full overflow-auto pb-4"
            >
              <ProjectIntegrationsTab projectId={projectId} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <TaskDrawer 
        projectId={project.id}
        task={selectedTask} 
        isOpen={!!selectedTask} 
        onClose={() => setSelectedTask(null)} 
      />

      <EditProjectDialog isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} project={project} />
      <DeleteConfirmationDialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} projectId={project.id} projectName={project.name} />
      <InviteMemberDialog isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} projectId={project.id} />
    </div>
  );
}

export default function ProjectDetailPage() {
  return (
    <Suspense fallback={
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    }>
      <ProjectDetailContent />
    </Suspense>
  );
}
