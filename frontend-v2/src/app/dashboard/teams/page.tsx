'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTeams } from '@/hooks/useTeams';
import { Users, Plus, Shield, ShieldCheck } from 'lucide-react';
import { CreateTeamDialog } from '@/components/teams/CreateTeamDialog';
import { motion } from 'framer-motion';

export default function TeamsPage() {
  const { data: teams, isLoading } = useTeams();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Teams</h1>
          <p className="text-muted-foreground mt-1">Manage your teams and collaborate across multiple projects.</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-colors shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" /> New Team
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-secondary/50 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : teams?.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-card border border-border rounded-3xl border-dashed">
          <div className="w-20 h-20 bg-primary/10 flex items-center justify-center rounded-full mb-6">
            <Users className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No Teams Yet</h2>
          <p className="text-muted-foreground max-w-sm mx-auto mb-8">
            Create a team to easily manage members across multiple projects.
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-colors shadow-lg shadow-primary/20"
          >
            <Plus className="w-5 h-5" /> Create Your First Team
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams?.map((team, idx) => (
            <Link key={team.id} href={`/dashboard/teams/${team.id}`}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-card border border-border rounded-3xl p-6 hover:border-primary/50 transition-colors group cursor-pointer h-full"
              >
                <div className="flex items-center gap-4 mb-4">
                {team.avatarUrl ? (
                  <img src={team.avatarUrl.startsWith('http') ? team.avatarUrl : `http://localhost:5000${team.avatarUrl}`} alt={team.name} className="w-12 h-12 rounded-xl object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-xl font-bold text-primary">
                    {team.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{team.name}</h3>
                  <p className="text-sm text-muted-foreground">{team.members.length} member{team.members.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <p className="text-muted-foreground text-sm line-clamp-2 mb-6 min-h-[40px]">
                {team.description || 'No description provided.'}
              </p>
              <div className="flex -space-x-2">
                {team.members.slice(0, 5).map((m) => (
                  <div key={m.id} className="relative">
                    {m.user.avatarUrl ? (
                      <img src={m.user.avatarUrl.startsWith('http') ? m.user.avatarUrl : `http://localhost:5000${m.user.avatarUrl}`} alt={m.user.name} className="w-8 h-8 rounded-full border-2 border-card object-cover" title={m.user.name} />
                    ) : (
                      <div className="w-8 h-8 rounded-full border-2 border-card bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold" title={m.user.name}>
                        {m.user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                ))}
                {team.members.length > 5 && (
                  <div className="w-8 h-8 rounded-full border-2 border-card bg-secondary text-muted-foreground flex items-center justify-center text-[10px] font-bold z-10">
                    +{team.members.length - 5}
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-border flex justify-end">
                <span className="text-sm font-semibold text-primary group-hover:underline flex items-center gap-1">
                  Manage Team &rarr;
                </span>
              </div>
            </motion.div>
          </Link>
          ))}
        </div>
      )}

      <CreateTeamDialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
}
