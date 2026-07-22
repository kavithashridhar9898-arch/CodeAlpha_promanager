'use client';

import React, { useState, useCallback, useRef } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Connection,
  Edge,
  Node
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { NodeLibrary } from './NodeLibrary';
import { PropertiesPanel } from './PropertiesPanel';
import { Save, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/axios';

interface WorkflowCanvasProps {
  automationId: string;
  initialNodes: any[];
  initialEdges: any[];
  automationName: string;
}

let idCounter = 0;
const getId = () => `node_${idCounter++}`;

function WorkflowBuilder({ automationId, initialNodes, initialEdges, automationName }: WorkflowCanvasProps) {
  const router = useRouter();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const rawData = event.dataTransfer.getData('application/reactflow');
      if (!rawData) return;
      
      const { type, subType } = JSON.parse(rawData);

      // check if the dropped element is valid
      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      let bgColor = 'bg-gray-500';
      if (type === 'TRIGGER') bgColor = 'bg-green-500';
      if (type === 'CONDITION') bgColor = 'bg-yellow-500';
      if (type === 'ACTION') bgColor = 'bg-blue-500';

      const newNode: Node = {
        id: getId(),
        type: 'default', // Custom nodes can be added later
        position,
        data: { 
          label: (
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full ${bgColor} mb-2`} />
              <div className="font-semibold text-xs">{subType}</div>
            </div>
          ),
          type, 
          subType, 
          config: {} 
        },
        style: {
          background: 'var(--surface-color)',
          color: 'var(--foreground-color)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '10px',
          minWidth: '120px'
        }
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  };

  const updateNodeConfig = (nodeId: string, config: any) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === nodeId) {
          const updatedNode = { ...n, data: { ...n.data, config } };
          if (selectedNode?.id === nodeId) {
             setSelectedNode(updatedNode);
          }
          return updatedNode;
        }
        return n;
      })
    );
  };

  const saveWorkflow = async () => {
    setIsSaving(true);
    try {
      const payload = {
        nodes: nodes.map(n => ({
          type: n.data.type,
          subType: n.data.subType,
          config: n.data.config,
          positionX: n.position.x,
          positionY: n.position.y
        })),
        edges: edges.map(e => ({
          sourceId: e.source,
          targetId: e.target,
          sourceHandle: e.sourceHandle,
          targetHandle: e.targetHandle
        }))
      };

      await api.put(`/automations/${automationId}`, payload);
      alert('Workflow saved successfully!');
    } catch (error) {
      console.error('Failed to save workflow', error);
      alert('Failed to save workflow');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[var(--background-color)]">
      {/* Header */}
      <div className="h-16 border-b border-[var(--border-color)] flex items-center justify-between px-6 bg-[var(--surface-color)]">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard/automations')} className="p-2 hover:bg-[var(--border-color)] rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-semibold text-lg">{automationName}</h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => router.push(`/dashboard/automations/${automationId}/history`)} className="text-sm text-gray-400 hover:text-white transition-colors">
            View History
          </button>
          <button
            onClick={saveWorkflow}
            disabled={isSaving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Save size={18} />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <NodeLibrary />
        
        <div className="flex-1 h-full" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            fitView
            defaultEdgeOptions={{ type: 'smoothstep', animated: true }}
          >
            <Controls />
            <Background color="#ccc" gap={16} />
          </ReactFlow>
        </div>

        <PropertiesPanel selectedNode={selectedNode} updateNodeConfig={updateNodeConfig} />
      </div>
    </div>
  );
}

export function WorkflowCanvas(props: WorkflowCanvasProps) {
  return (
    <ReactFlowProvider>
      <WorkflowBuilder {...props} />
    </ReactFlowProvider>
  );
}
