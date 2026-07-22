'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Network, BatteryMedium, Users, Activity } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/axios';

export default function ResourcesPage() {
  const { user } = useAuthStore();

  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResourceData();
  }, []);

  const fetchResourceData = async () => {
    try {
      setLoading(true);
      // Fetch projects to get all team members and projects
      const res = await api.get('/projects');
      const projects = res.data?.data || [];
      
      const memberMap = new Map();
      
      for (const project of projects) {
        // Fetch time report for this project
        let timeReport: any = null;
        try {
          const reportRes = await api.get(`/time/report/project/${project.id}`);
          timeReport = reportRes.data;
        } catch (err) {}

        // Map members
        if (project.members) {
          project.members.forEach((m: any) => {
            const user = m.user;
            if (!memberMap.has(user.id)) {
              memberMap.set(user.id, {
                id: user.id,
                name: user.name || 'Unknown',
                capacity: 40, // Base capacity
                allocated: 0,
                status: 'Healthy'
              });
            }
            
            // Add logged hours if any
            if (timeReport && timeReport.userBreakdown[user.name]) {
              const current = memberMap.get(user.id);
              current.allocated += timeReport.userBreakdown[user.name];
            }
          });
        }
      }

      // Calculate status
      const processedMembers = Array.from(memberMap.values()).map(m => {
        m.allocated = Math.round(m.allocated * 100) / 100; // round to 2 decimals
        const pct = m.allocated / m.capacity;
        if (pct > 1) m.status = 'Overloaded';
        else if (pct < 0.6) m.status = 'Idle';
        else m.status = 'Healthy';
        return m;
      });

      setTeamMembers(processedMembers);
    } catch (error) {
      console.error('Failed to fetch resource data', error);
    } finally {
      setLoading(false);
    }
  };

  const overloadedCount = teamMembers.filter(m => m.status === 'Overloaded').length;
  const healthyCount = teamMembers.filter(m => m.status === 'Healthy').length;
  const idleCount = teamMembers.filter(m => m.status === 'Idle').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Resource Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage team capacity and workload balancing.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border p-5 rounded-xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-red-500/10 text-red-500 rounded-lg">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Overallocated</div>
            <div className="text-2xl font-bold text-foreground">{overloadedCount} Member{overloadedCount !== 1 && 's'}</div>
          </div>
        </div>
        
        <div className="bg-card border border-border p-5 rounded-xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-green-500/10 text-green-500 rounded-lg">
            <BatteryMedium className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Healthy Capacity</div>
            <div className="text-2xl font-bold text-foreground">{healthyCount} Member{healthyCount !== 1 && 's'}</div>
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-yellow-500/10 text-yellow-500 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Underutilized</div>
            <div className="text-2xl font-bold text-foreground">{idleCount} Member{idleCount !== 1 && 's'}</div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Network className="w-5 h-5 text-primary" /> Workload Heatmap
          </h3>
        </div>
        
        <div className="p-5 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-sm">
                <th className="pb-3 font-medium text-muted-foreground">Team Member</th>
                <th className="pb-3 font-medium text-muted-foreground">Capacity (hrs/wk)</th>
                <th className="pb-3 font-medium text-muted-foreground">Allocated (hrs/wk)</th>
                <th className="pb-3 font-medium text-muted-foreground">Status</th>
                <th className="pb-3 font-medium text-muted-foreground">Heatmap</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">Loading resource data...</td>
                </tr>
              ) : teamMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">No team members found.</td>
                </tr>
              ) : (
                teamMembers.map((member) => {
                  const percentage = (member.allocated / member.capacity) * 100;
                  let barColor = 'bg-green-500';
                  if (percentage > 100) barColor = 'bg-red-500';
                  else if (percentage < 60) barColor = 'bg-yellow-500';

                  return (
                    <tr key={member.id} className="text-sm hover:bg-muted/5">
                      <td className="py-4 font-medium text-foreground">{member.name}</td>
                      <td className="py-4 text-muted-foreground">{member.capacity}h</td>
                      <td className="py-4 text-foreground font-semibold">{member.allocated}h</td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          percentage > 100 ? 'bg-red-500/10 text-red-500' :
                          percentage < 60 ? 'bg-yellow-500/10 text-yellow-500' :
                          'bg-green-500/10 text-green-500'
                        }`}>
                          {member.status}
                        </span>
                      </td>
                      <td className="py-4 min-w-[200px]">
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${barColor} transition-all`} 
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
