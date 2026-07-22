'use client';

import React, { useState } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog';
import { Plus, FolderOpen, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProjectsListPage() {
  const { data: projects, isLoading, error } = useProjects();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">Manage and track all your collaborative workspaces.</p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-2xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/25"
        >
          <Plus className="w-5 h-5" />
          <span>New Project</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex-1 flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive font-medium">
          Failed to load projects. Please try again.
        </div>
      ) : projects?.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex flex-col items-center justify-center p-16 bg-card/30 border border-border border-dashed rounded-[2rem] text-center"
        >
          <div className="w-20 h-20 bg-secondary rounded-3xl flex items-center justify-center mb-6 shadow-inner">
            <FolderOpen className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-2">No projects yet</h3>
          <p className="text-muted-foreground max-w-md mb-8">
            Get started by creating your first project space to collaborate with your team.
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="bg-secondary hover:bg-secondary/80 text-foreground px-8 py-3 rounded-2xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Create Project
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 pb-8">
          {projects?.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))}
        </div>
      )}

      <CreateProjectDialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
}
