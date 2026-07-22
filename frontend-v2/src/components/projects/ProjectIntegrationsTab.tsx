import React, { useEffect, useState } from 'react';
import { api } from '@/lib/axios';
import { Loader2, GitBranch, Star, GitPullRequest, RefreshCw, Activity, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface Repository {
  id: string;
  provider: string;
  fullName: string;
  name: string;
  url: string;
  defaultBranch: string;
  stars: number;
  forks: number;
  _count?: {
    commits: number;
    pullRequests: number;
    issues: number;
  };
}

interface Deployment {
  id: string;
  environment: string;
  status: string;
  url: string | null;
  logsUrl: string | null;
  createdAt: string;
}

interface CodeMetric {
  leadTimeMinutes: number | null;
  deployFrequencyPerDay: number | null;
}

export function ProjectIntegrationsTab({ projectId }: { projectId: string }) {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [metrics, setMetrics] = useState<CodeMetric | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reposRes, depsRes, metricsRes] = await Promise.all([
        api.get(`/integrations/projects/${projectId}/repos`),
        api.get(`/integrations/projects/${projectId}/deployments`),
        api.get(`/integrations/projects/${projectId}/metrics`)
      ]);
      
      if (reposRes.data.success) setRepos(reposRes.data.data);
      if (depsRes.data.success) setDeployments(depsRes.data.data);
      if (metricsRes.data.success) setMetrics(metricsRes.data.data);
    } catch (error) {
      console.error('Failed to fetch integrations data', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (repos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-card border border-border rounded-2xl text-center shadow-sm">
        <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mb-4">
          <GitPullRequest className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-bold mb-2">No Repositories Linked</h3>
        <p className="text-muted-foreground text-sm max-w-md">
          You haven't linked any code repositories to this project yet. Go to the global Integrations page to link your GitHub repos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Repositories */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Linked Repositories</h2>
          <button 
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/80 rounded-lg transition-colors font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {repos.map((repo) => (
            <motion.div
              key={repo.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#24292e] rounded-xl flex items-center justify-center text-white shrink-0">
                  <GitPullRequest className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-base truncate" title={repo.fullName}>{repo.name}</h4>
                  <a 
                    href={repo.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline truncate block"
                  >
                    {repo.fullName}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-6">
                <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" /> {repo.defaultBranch}</span>
                <span className="flex items-center gap-1"><Star className="w-3 h-3" /> {repo.stars} stars</span>
              </div>

              <div className="mt-auto grid grid-cols-3 gap-2 border-t border-border pt-4">
                <div className="text-center">
                  <div className="text-lg font-bold">{repo._count?.commits || 0}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Commits</div>
                </div>
                <div className="text-center border-x border-border">
                  <div className="text-lg font-bold">{repo._count?.pullRequests || 0}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">PRs</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">{repo._count?.issues || 0}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Issues</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CI/CD & Metrics */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Deployment History */}
        <section className="xl:col-span-2">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Deployment History
          </h3>
          
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            {deployments.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Activity className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p>No deployments recorded yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {deployments.map(dep => (
                  <div key={dep.id} className="p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors">
                    <div className="flex items-center gap-4">
                      {dep.status === 'SUCCESS' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : dep.status === 'FAILED' ? (
                        <XCircle className="w-5 h-5 text-destructive" />
                      ) : (
                        <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">Deployed to {dep.environment}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            dep.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-500' :
                            dep.status === 'FAILED' ? 'bg-destructive/10 text-destructive' :
                            'bg-blue-500/10 text-blue-500'
                          }`}>
                            {dep.status}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(dep.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    {dep.logsUrl && (
                      <a 
                        href={dep.logsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-primary hover:underline bg-primary/10 px-3 py-1.5 rounded-lg"
                      >
                        View Logs
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Code Metrics */}
        <section>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Code Metrics
          </h3>
          
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
            {!metrics ? (
              <div className="text-center text-muted-foreground py-4">
                <p>Not enough data yet.</p>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Deploy Frequency</span>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-extrabold text-foreground">{metrics.deployFrequencyPerDay?.toFixed(1) || 0}</span>
                    <span className="text-sm font-medium text-muted-foreground mb-1">per day</span>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full mt-2 overflow-hidden">
                    <div className="bg-primary h-full" style={{ width: `${Math.min((metrics.deployFrequencyPerDay || 0) * 10, 100)}%` }} />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Lead Time for Changes</span>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-extrabold text-foreground">{metrics.leadTimeMinutes || 0}</span>
                    <span className="text-sm font-medium text-muted-foreground mb-1">minutes</span>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full mt-2 overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: `${Math.max(100 - (metrics.leadTimeMinutes || 0), 10)}%` }} />
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
        
      </div>
    </div>
  );
}
