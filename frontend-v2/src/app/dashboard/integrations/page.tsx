'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { GitPullRequest, Plus, RefreshCw, Trash2, ExternalLink, Link2, GitBranch, Star, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/axios';
import { LinkProjectModal } from '@/components/integrations/LinkProjectModal';

// Add to your lucide-react imports if you want GitLab/Bitbucket icons, but for now we'll stick to basic ones

interface IntegrationAccount {
  id: string;
  provider: string;
  username: string;
  avatarUrl: string;
  createdAt: string;
}

interface Repository {
  providerId: string;
  fullName: string;
  name: string;
  url: string;
  defaultBranch: string;
  stars: number;
  forks: number;
}

export default function IntegrationsPage() {
  const [accounts, setAccounts] = useState<IntegrationAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [availableRepos, setAvailableRepos] = useState<Repository[]>([]);
  const [selectedRepoToLink, setSelectedRepoToLink] = useState<Repository | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await api.get('/integrations/accounts');
      if (res.data.success) {
        setAccounts(res.data.data);
        
        // If GitHub connected, fetch available repos
        const githubConnected = res.data.data.some((a: IntegrationAccount) => a.provider === 'GITHUB');
        if (githubConnected) {
          fetchAvailableRepos();
        }
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableRepos = async () => {
    try {
      const res = await api.get('/integrations/github/repos');
      if (res.data.success) {
        setAvailableRepos(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch repositories:', error);
    }
  };

  const handleConnectGitHub = async () => {
    try {
      setConnecting(true);
      const res = await api.get('/integrations/github/url');
      if (res.data.success) {
        window.location.href = res.data.url;
      }
    } catch (error) {
      console.error('Failed to connect GitHub:', error);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background/50 overflow-y-auto p-8">
      <div className="max-w-4xl mx-auto w-full">
        
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Integrations</h1>
          <p className="text-muted-foreground">
            Connect ProManager to your developer tools to sync repositories, pull requests, issues, and deployments.
          </p>
        </header>

        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Link2 className="w-5 h-5 text-primary" />
            Connected Accounts
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* GitHub Card */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col items-start justify-between relative overflow-hidden group hover:border-primary/50 transition-colors">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-[#24292e] rounded-xl flex items-center justify-center text-white shadow-inner">
                  <GitPullRequest className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg leading-tight">GitHub</h3>
                  <p className="text-xs text-muted-foreground">Source Control</p>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Checking...
                </div>
              ) : accounts.find(a => a.provider === 'GITHUB') ? (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <img 
                      src={accounts.find(a => a.provider === 'GITHUB')?.avatarUrl} 
                      alt="GitHub Avatar" 
                      className="w-8 h-8 rounded-full border border-border"
                    />
                    <span className="text-sm font-medium">
                      @{accounts.find(a => a.provider === 'GITHUB')?.username}
                    </span>
                  </div>
                  <button className="text-muted-foreground hover:text-destructive transition-colors" title="Disconnect">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleConnectGitHub}
                  disabled={connecting}
                  className="w-full py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {connecting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Connect GitHub
                </button>
              )}
            </div>

            {/* Placeholder for others */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col items-start justify-between opacity-50 grayscale select-none">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-[#FC6D26] rounded-xl flex items-center justify-center text-white">
                  <span className="font-bold">GL</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg leading-tight">GitLab</h3>
                  <p className="text-xs text-muted-foreground">Coming Soon</p>
                </div>
              </div>
              <button disabled className="w-full py-2 bg-secondary text-muted-foreground rounded-lg text-sm font-medium cursor-not-allowed">
                Not Available
              </button>
            </div>
            
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col items-start justify-between opacity-50 grayscale select-none">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-white">
                  <span className="font-bold">▲</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg leading-tight">Vercel</h3>
                  <p className="text-xs text-muted-foreground">Coming Soon</p>
                </div>
              </div>
              <button disabled className="w-full py-2 bg-secondary text-muted-foreground rounded-lg text-sm font-medium cursor-not-allowed">
                Not Available
              </button>
            </div>

          </div>
        </section>

        {/* Repositories Section (Only shown if GitHub is connected) */}
        {accounts.some(a => a.provider === 'GITHUB') && (
          <section>
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-primary" />
              Available Repositories
            </h2>
            
            {availableRepos.length === 0 ? (
              <div className="text-center py-10 bg-card border border-dashed border-border rounded-xl text-muted-foreground">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3" />
                <p>Loading repositories from GitHub...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {availableRepos.slice(0, 10).map((repo) => (
                  <div key={repo.providerId} className="flex items-center justify-between bg-card border border-border p-4 rounded-xl hover:border-primary/40 transition-colors">
                    <div>
                      <h4 className="font-medium text-sm text-foreground truncate max-w-[200px]" title={repo.fullName}>
                        {repo.name}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1"><Star className="w-3 h-3" /> {repo.stars}</span>
                        <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" /> {repo.defaultBranch}</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => setSelectedRepoToLink(repo)}
                      className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium rounded-lg transition-colors border border-border"
                    >
                      Link to Project
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

      </div>

      <LinkProjectModal 
        isOpen={!!selectedRepoToLink} 
        onClose={() => setSelectedRepoToLink(null)} 
        repo={selectedRepoToLink}
        onLinked={fetchAvailableRepos}
      />
    </div>
  );
}
