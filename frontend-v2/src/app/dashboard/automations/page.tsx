'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Play, Pause, Trash2, Edit } from 'lucide-react';
import { api } from '@/lib/axios';
import { useProjects } from '@/hooks/useProjects';

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<any[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId'); // Assuming we pass projectId

  const { data: projects, isLoading: projectsLoading } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '');

  useEffect(() => {
    if (selectedProjectId) {
      fetchAutomations(selectedProjectId);
    }
  }, [selectedProjectId]);

  const fetchAutomations = async (id: string) => {
    try {
      const res = await api.get(`/automations?projectId=${id}`);
      setAutomations(res.data);
    } catch (error) {
      console.error('Failed to fetch automations', error);
    }
  };

  const createAutomation = async () => {
    if (!selectedProjectId) return alert('Select a project first');
    try {
      const res = await api.post('/automations', {
        name: 'New Automation',
        projectId: selectedProjectId,
        nodes: [],
        edges: []
      });
      router.push(`/dashboard/automations/${res.data.id}`);
    } catch (error) {
      console.error('Error creating automation', error);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await api.put(`/automations/${id}`, { isActive: !currentStatus });
      if (selectedProjectId) fetchAutomations(selectedProjectId);
    } catch (error) {
      console.error('Error toggling status', error);
    }
  };

  const deleteAutomation = async (id: string) => {
    try {
      await api.delete(`/automations/${id}`);
      if (selectedProjectId) fetchAutomations(selectedProjectId);
    } catch (error) {
      console.error('Error deleting automation', error);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Workflow Automations</h1>
          <select 
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-background text-foreground border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
            disabled={projectsLoading}
          >
            <option value="" className="bg-background text-foreground">Select a Project</option>
            {projects?.map(p => (
              <option key={p.id} value={p.id} className="bg-background text-foreground">{p.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={createAutomation}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Create Automation
        </button>
      </div>

      {!selectedProjectId && (
        <div className="p-4 bg-yellow-500/20 text-yellow-500 rounded-lg">
          Please select a project to view its automations.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {automations.map((automation) => (
          <div key={automation.id} className="bg-[var(--surface-color)] p-6 rounded-xl border border-[var(--border-color)]">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-semibold text-lg">{automation.name}</h3>
              <button
                onClick={() => toggleStatus(automation.id, automation.isActive)}
                className={`p-2 rounded-full ${automation.isActive ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'}`}
              >
                {automation.isActive ? <Play size={16} /> : <Pause size={16} />}
              </button>
            </div>
            <p className="text-sm text-gray-400 mb-6 line-clamp-2">
              {automation.description || 'No description provided.'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => router.push(`/dashboard/automations/${automation.id}`)}
                className="flex-1 bg-[var(--background-color)] hover:bg-[var(--border-color)] px-4 py-2 rounded-lg text-sm transition-colors flex justify-center items-center gap-2"
              >
                <Edit size={16} /> Edit Flow
              </button>
              <button
                onClick={() => deleteAutomation(automation.id)}
                className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
