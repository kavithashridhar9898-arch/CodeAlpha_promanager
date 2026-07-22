'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, Users, Folder, ArrowRight } from 'lucide-react';
import type { Project } from '@/hooks/useProjects';

export function ProjectCard({ project, index }: { project: Project, index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
      className="group relative flex flex-col bg-card/40 backdrop-blur-md border border-border/50 rounded-3xl overflow-hidden hover:bg-card hover:border-primary/50 transition-all duration-300"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="p-6 flex-1 relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
            <Folder className="w-6 h-6" />
          </div>
          <span className={`text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full ${
            project.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
            project.status === 'COMPLETED' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
            'bg-secondary text-muted-foreground border border-border'
          }`}>
            {project.status}
          </span>
        </div>
        
        <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-1">
          {project.name}
        </h3>
        
        <p className="text-muted-foreground text-sm line-clamp-2 mb-6 min-h-[40px]">
          {project.description || 'No description provided.'}
        </p>

        <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
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

      <div className="px-6 py-4 bg-secondary/30 border-t border-border/50 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-2">
          {project.owner.avatarUrl ? (
            <img src={project.owner.avatarUrl} alt={project.owner.name} className="w-6 h-6 rounded-full" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground">
              {project.owner.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-xs text-muted-foreground font-medium">By {project.owner.name}</span>
        </div>

        <Link
          href={`/dashboard/projects/${project.id}`}
          className="flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          Open <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </motion.div>
  );
}
