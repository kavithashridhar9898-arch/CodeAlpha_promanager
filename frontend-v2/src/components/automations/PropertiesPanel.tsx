'use client';

import React from 'react';

interface PropertiesPanelProps {
  selectedNode: any;
  updateNodeConfig: (nodeId: string, config: any) => void;
}

export function PropertiesPanel({ selectedNode, updateNodeConfig }: PropertiesPanelProps) {
  if (!selectedNode) {
    return (
      <div className="w-80 bg-[var(--surface-color)] border-l border-[var(--border-color)] p-4 flex flex-col h-full text-gray-500">
        <p>Select a node to view properties.</p>
      </div>
    );
  }

  const { id, data } = selectedNode;
  const config = data.config || {};

  const handleConfigChange = (key: string, value: any) => {
    updateNodeConfig(id, { ...config, [key]: value });
  };

  return (
    <div className="w-80 bg-[var(--surface-color)] border-l border-[var(--border-color)] p-4 flex flex-col h-full overflow-y-auto">
      <h3 className="font-semibold mb-4 text-lg">Properties</h3>
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-1">Type</label>
        <div className="px-3 py-2 bg-[var(--background-color)] rounded border border-[var(--border-color)] font-mono text-sm">
          {data.subType}
        </div>
      </div>

      <div className="space-y-4">
        {data.type === 'TRIGGER' && data.subType === 'SCHEDULE' && (
          <div>
            <label className="block text-sm mb-1">Cron Expression</label>
            <input
              type="text"
              value={config.cronExpression || ''}
              onChange={(e) => handleConfigChange('cronExpression', e.target.value)}
              placeholder="* * * * *"
              className="w-full bg-[var(--background-color)] border border-[var(--border-color)] rounded p-2 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}

        {data.type === 'ACTION' && data.subType === 'ASSIGN_USER' && (
          <div>
            <label className="block text-sm mb-1">Assignee ID</label>
            <input
              type="text"
              value={config.assigneeId || ''}
              onChange={(e) => handleConfigChange('assigneeId', e.target.value)}
              placeholder="User ID"
              className="w-full bg-[var(--background-color)] border border-[var(--border-color)] rounded p-2 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}

        {data.type === 'ACTION' && data.subType === 'CHANGE_STATUS' && (
          <div>
            <label className="block text-sm mb-1">New Status</label>
            <select
              value={config.status || ''}
              onChange={(e) => handleConfigChange('status', e.target.value)}
              className="w-full bg-[var(--background-color)] border border-[var(--border-color)] rounded p-2 text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="">Select Status</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="DONE">Done</option>
            </select>
          </div>
        )}
        
        {/* We can add more generic form fields based on node type */}
        <div>
           <label className="block text-sm mb-1">Raw Config JSON</label>
           <textarea 
             value={JSON.stringify(config, null, 2)}
             onChange={(e) => {
               try {
                 const parsed = JSON.parse(e.target.value);
                 updateNodeConfig(id, parsed);
               } catch (err) {
                 // Ignore invalid JSON while typing
               }
             }}
             rows={10}
             className="w-full bg-[var(--background-color)] border border-[var(--border-color)] rounded p-2 text-sm font-mono focus:outline-none focus:border-indigo-500"
           />
        </div>
      </div>
    </div>
  );
}
