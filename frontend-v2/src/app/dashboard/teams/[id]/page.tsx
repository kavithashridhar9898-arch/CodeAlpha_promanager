'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  useTeam, 
  useUpdateTeam, 
  useDeleteTeam, 
  useAddTeamMember, 
  useRemoveTeamMember, 
  useUpdateTeamMemberRole 
} from '@/hooks/useTeams';
import { useAuthStore } from '@/store/authStore';
import { 
  ArrowLeft, Users, UserPlus, Settings, Trash2, 
  ShieldAlert, User, Shield, ShieldCheck, Mail, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function TeamDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  
  const { data: team, isLoading } = useTeam(id as string);
  const updateTeam = useUpdateTeam(id as string);
  const deleteTeam = useDeleteTeam(id as string);
  const addMember = useAddTeamMember(id as string);
  const removeMember = useRemoveTeamMember(id as string);
  const updateRole = useUpdateTeamMemberRole(id as string);

  const [activeTab, setActiveTab] = useState<'members' | 'settings'>('members');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [inviteError, setInviteError] = useState('');
  
  // Edit Team state
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h2 className="text-2xl font-bold mb-2">Team Not Found</h2>
        <p className="text-muted-foreground mb-6">This team may have been deleted or you don't have access.</p>
        <Link href="/dashboard/teams" className="px-6 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors">
          Back to Teams
        </Link>
      </div>
    );
  }

  const currentMember = team.members.find(m => m.user.id === currentUser?.id);
  const isOwner = currentMember?.role === 'OWNER' || team.members.length === 1;
  const isAdmin = currentMember?.role === 'ADMIN' || isOwner;
  const isManager = currentMember?.role === 'MANAGER' || isAdmin;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail) return;
    setInviteError('');
    try {
      await addMember.mutateAsync(newMemberEmail);
      setNewMemberEmail('');
    } catch (err: any) {
      setInviteError(err.response?.data?.message || 'Failed to add member.');
    }
  };

  const handleDeleteTeam = async () => {
    if (window.confirm(`Are you sure you want to delete the team "${team.name}"? This action cannot be undone.`)) {
      try {
        await deleteTeam.mutateAsync();
        router.push('/dashboard/teams');
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to delete team.');
      }
    }
  };

  const handleSaveSettings = async () => {
    try {
      await updateTeam.mutateAsync({ name: editName, description: editDesc });
      setIsEditing(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update team.');
    }
  };

  const toggleEdit = () => {
    if (isEditing) {
      setIsEditing(false);
    } else {
      setEditName(team.name);
      setEditDesc(team.description || '');
      setIsEditing(true);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER': return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      case 'ADMIN': return <ShieldCheck className="w-4 h-4 text-purple-500" />;
      case 'MANAGER': return <Shield className="w-4 h-4 text-blue-500" />;
      default: return <User className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard/teams" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Teams
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {team.avatarUrl ? (
              <img src={team.avatarUrl.startsWith('http') ? team.avatarUrl : `http://localhost:5000${team.avatarUrl}`} alt={team.name} className="w-16 h-16 rounded-2xl object-cover shadow-sm border border-border" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary shadow-sm border border-border/50">
                {team.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-extrabold text-foreground tracking-tight">{team.name}</h1>
              <p className="text-muted-foreground mt-1 max-w-xl line-clamp-1">{team.description || 'No description provided.'}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('members')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 ${activeTab === 'members' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/50'}`}
            >
              <Users className="w-4 h-4" /> Members
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 ${activeTab === 'settings' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/50'}`}
              >
                <Settings className="w-4 h-4" /> Settings
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <AnimatePresence mode="wait">
          {activeTab === 'members' ? (
            <motion.div
              key="members"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              {isManager && (
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-foreground mb-4">Add Member</h3>
                  <form onSubmit={handleInvite} className="flex gap-3">
                    <div className="relative flex-1 max-w-md">
                      <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input 
                        type="email"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        placeholder="Enter user email..."
                        className="w-full bg-secondary/50 border border-border rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                        required
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={addMember.isPending || !newMemberEmail}
                      className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {addMember.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                      Add to Team
                    </button>
                  </form>
                  {inviteError && <p className="text-sm text-destructive mt-3">{inviteError}</p>}
                </div>
              )}

              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-secondary/50 border-b border-border">
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">User</th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Role</th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {team.members.map((member) => (
                      <tr key={member.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {member.user.avatarUrl ? (
                              <img src={member.user.avatarUrl.startsWith('http') ? member.user.avatarUrl : `http://localhost:5000${member.user.avatarUrl}`} alt={member.user.name} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                                {member.user.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-foreground">{member.user.name}</div>
                              <div className="text-xs text-muted-foreground">{member.user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getRoleIcon(member.role)}
                            <span className="text-sm font-medium">{member.role}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isAdmin && member.role !== 'OWNER' && member.user.id !== currentUser?.id && (
                            <div className="flex items-center justify-end gap-3">
                              <select 
                                value={member.role}
                                onChange={(e) => updateRole.mutate({ memberId: member.user.id, role: e.target.value })}
                                className="bg-secondary border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-primary disabled:opacity-50"
                                disabled={updateRole.isPending}
                              >
                                {isOwner && <option value="ADMIN">Admin</option>}
                                <option value="MANAGER">Manager</option>
                                <option value="MEMBER">Member</option>
                              </select>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Remove ${member.user.name} from the team?`)) {
                                    removeMember.mutate(member.user.id);
                                  }
                                }}
                                disabled={removeMember.isPending}
                                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              {/* General Settings */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-foreground">General Settings</h3>
                  <button onClick={toggleEdit} className="text-sm font-medium text-primary hover:underline">
                    {isEditing ? 'Cancel' : 'Edit'}
                  </button>
                </div>
                
                {isEditing ? (
                  <div className="space-y-4 max-w-lg">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-muted-foreground">Team Name</label>
                      <input 
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary transition-colors text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-muted-foreground">Description</label>
                      <textarea 
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        rows={3}
                        className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary transition-colors text-sm resize-none"
                      />
                    </div>
                    <button
                      onClick={handleSaveSettings}
                      disabled={updateTeam.isPending || !editName}
                      className="px-6 py-2 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 flex items-center gap-2"
                    >
                      {updateTeam.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 max-w-lg">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Team Name</p>
                      <p className="text-foreground font-medium">{team.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                      <p className="text-foreground">{team.description || 'No description provided.'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Danger Zone */}
              {isOwner && (
                <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-destructive mb-2">Danger Zone</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Deleting this team will permanently remove it and all of its associations. This action cannot be undone.
                  </p>
                  <button 
                    onClick={handleDeleteTeam}
                    disabled={deleteTeam.isPending}
                    className="px-6 py-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground font-semibold rounded-xl transition-colors border border-destructive/20 flex items-center gap-2 disabled:opacity-50"
                  >
                    {deleteTeam.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Delete Team
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
