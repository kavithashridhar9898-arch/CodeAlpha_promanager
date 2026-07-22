'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/axios';
import { WorkflowCanvas } from '@/components/automations/WorkflowCanvas';

export default function AutomationBuilderPage() {
  const params = useParams();
  const id = params.id as string;
  const [automation, setAutomation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchAutomation();
    }
  }, [id]);

  const fetchAutomation = async () => {
    try {
      const res = await api.get(`/automations/${id}`);
      setAutomation(res.data);
    } catch (error) {
      console.error('Failed to fetch automation', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!automation) {
    return <div className="h-screen flex items-center justify-center">Automation not found</div>;
  }

  // Map backend nodes to ReactFlow nodes
  const initialNodes = (automation.nodes || []).map((n: any, idx: number) => ({
    id: n.id || `node_${idx}`,
    type: 'default',
    position: { x: n.positionX || 100, y: n.positionY || 100 },
    data: { 
      label: (
        <div className="flex flex-col items-center">
          <div className={`w-3 h-3 rounded-full ${n.type === 'TRIGGER' ? 'bg-green-500' : n.type === 'CONDITION' ? 'bg-yellow-500' : 'bg-blue-500'} mb-2`} />
          <div className="font-semibold text-xs">{n.subType}</div>
        </div>
      ),
      type: n.type, 
      subType: n.subType, 
      config: n.config 
    },
    style: {
      background: 'var(--surface-color)',
      color: 'var(--foreground-color)',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      padding: '10px',
      minWidth: '120px'
    }
  }));

  const initialEdges = (automation.edges || []).map((e: any, idx: number) => ({
    id: e.id || `edge_${idx}`,
    source: e.sourceId,
    target: e.targetId,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
    type: 'smoothstep',
    animated: true
  }));

  return (
    <WorkflowCanvas 
      automationId={id} 
      automationName={automation.name} 
      initialNodes={initialNodes} 
      initialEdges={initialEdges} 
    />
  );
}
