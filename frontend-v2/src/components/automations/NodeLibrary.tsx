'use client';

import React from 'react';

const NODE_TYPES = [
  { type: 'TRIGGER', subType: 'TASK_CREATED', label: 'Task Created', color: 'bg-green-500' },
  { type: 'TRIGGER', subType: 'SCHEDULE', label: 'Schedule', color: 'bg-green-500' },
  { type: 'CONDITION', subType: 'FIELD_MATCH', label: 'Condition', color: 'bg-yellow-500' },
  { type: 'ACTION', subType: 'ASSIGN_USER', label: 'Assign User', color: 'bg-blue-500' },
  { type: 'ACTION', subType: 'CHANGE_STATUS', label: 'Change Status', color: 'bg-blue-500' },
  { type: 'ACTION', subType: 'SEND_NOTIFICATION', label: 'Send Notification', color: 'bg-blue-500' },
];

export function NodeLibrary() {
  const onDragStart = (event: React.DragEvent, nodeType: string, subType: string) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ type: nodeType, subType }));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-64 bg-[var(--surface-color)] border-r border-[var(--border-color)] p-4 flex flex-col h-full overflow-y-auto">
      <h3 className="font-semibold mb-4">Node Library</h3>
      <div className="space-y-4">
        <div>
          <h4 className="text-sm text-gray-400 mb-2">Triggers</h4>
          {NODE_TYPES.filter(n => n.type === 'TRIGGER').map(node => (
            <div
              key={node.subType}
              className={`p-3 rounded border border-[var(--border-color)] mb-2 cursor-grab active:cursor-grabbing hover:bg-[var(--background-color)] transition-colors`}
              onDragStart={(e) => onDragStart(e, node.type, node.subType)}
              draggable
            >
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${node.color}`} />
                <span className="text-sm">{node.label}</span>
              </div>
            </div>
          ))}
        </div>

        <div>
          <h4 className="text-sm text-gray-400 mb-2">Conditions</h4>
          {NODE_TYPES.filter(n => n.type === 'CONDITION').map(node => (
            <div
              key={node.subType}
              className={`p-3 rounded border border-[var(--border-color)] mb-2 cursor-grab active:cursor-grabbing hover:bg-[var(--background-color)] transition-colors`}
              onDragStart={(e) => onDragStart(e, node.type, node.subType)}
              draggable
            >
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${node.color}`} />
                <span className="text-sm">{node.label}</span>
              </div>
            </div>
          ))}
        </div>

        <div>
          <h4 className="text-sm text-gray-400 mb-2">Actions</h4>
          {NODE_TYPES.filter(n => n.type === 'ACTION').map(node => (
            <div
              key={node.subType}
              className={`p-3 rounded border border-[var(--border-color)] mb-2 cursor-grab active:cursor-grabbing hover:bg-[var(--background-color)] transition-colors`}
              onDragStart={(e) => onDragStart(e, node.type, node.subType)}
              draggable
            >
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${node.color}`} />
                <span className="text-sm">{node.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
