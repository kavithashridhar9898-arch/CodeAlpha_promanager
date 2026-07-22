'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, XCircle, Clock } from 'lucide-react';
import { api } from '@/lib/axios';

export default function AutomationHistoryPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [executions, setExecutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExecution, setSelectedExecution] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchExecutions();
    }
  }, [id]);

  const fetchExecutions = async () => {
    try {
      const res = await api.get(`/automations/${id}/executions`);
      setExecutions(res.data);
      if (res.data.length > 0) {
        setSelectedExecution(res.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch executions', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading history...</div>;

  return (
    <div className="flex flex-col h-screen bg-[var(--background-color)]">
      <div className="h-16 border-b border-[var(--border-color)] flex items-center px-6 bg-[var(--surface-color)]">
        <button onClick={() => router.push(`/dashboard/automations/${id}`)} className="p-2 mr-4 hover:bg-[var(--border-color)] rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-semibold text-lg">Execution History</h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar List */}
        <div className="w-1/3 border-r border-[var(--border-color)] overflow-y-auto bg-[var(--surface-color)]">
          {executions.length === 0 ? (
            <div className="p-6 text-gray-500">No executions found.</div>
          ) : (
            executions.map((exec) => (
              <div 
                key={exec.id} 
                onClick={() => setSelectedExecution(exec)}
                className={`p-4 border-b border-[var(--border-color)] cursor-pointer hover:bg-[var(--background-color)] transition-colors ${selectedExecution?.id === exec.id ? 'bg-[var(--background-color)] border-l-4 border-l-indigo-500' : ''}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">
                    {new Date(exec.startedAt).toLocaleString()}
                  </span>
                  {exec.status === 'COMPLETED' ? (
                    <CheckCircle size={16} className="text-green-500" />
                  ) : exec.status === 'FAILED' ? (
                    <XCircle size={16} className="text-red-500" />
                  ) : (
                    <Clock size={16} className="text-yellow-500" />
                  )}
                </div>
                <div className="text-sm font-medium">Status: {exec.status}</div>
                {exec.durationMs && (
                  <div className="text-xs text-gray-500 mt-1">{exec.durationMs}ms</div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Details Panel */}
        <div className="w-2/3 p-6 overflow-y-auto">
          {selectedExecution ? (
            <div>
              <h2 className="text-xl font-bold mb-6">Execution Details</h2>
              <div className="bg-[var(--surface-color)] rounded-xl border border-[var(--border-color)] p-6 mb-6">
                <h3 className="font-semibold mb-4">Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400 block mb-1">Status</span>
                    <span className={`font-medium ${selectedExecution.status === 'FAILED' ? 'text-red-500' : 'text-green-500'}`}>
                      {selectedExecution.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-1">Duration</span>
                    <span>{selectedExecution.durationMs ? `${selectedExecution.durationMs} ms` : '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-1">Started</span>
                    <span>{new Date(selectedExecution.startedAt).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-1">Trigger Data</span>
                    <pre className="bg-[var(--background-color)] p-2 rounded text-xs mt-1 overflow-x-auto">
                      {JSON.stringify(selectedExecution.triggerData, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-semibold mb-4">Logs</h3>
              <div className="space-y-4">
                {(selectedExecution.logs || []).map((log: any) => (
                  <div key={log.id} className="bg-[var(--surface-color)] rounded border border-[var(--border-color)] p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        {log.status === 'SUCCESS' ? (
                          <CheckCircle size={16} className="text-green-500" />
                        ) : (
                          <XCircle size={16} className="text-red-500" />
                        )}
                        <span className="font-medium">{log.nodeId ? `Node: ${log.nodeId}` : 'System'}</span>
                      </div>
                      <span className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    {log.message && <div className="text-sm mt-2">{log.message}</div>}
                    {log.error && <div className="text-sm text-red-500 mt-2 bg-red-500/10 p-2 rounded">{log.error}</div>}
                  </div>
                ))}
                {(!selectedExecution.logs || selectedExecution.logs.length === 0) && (
                  <div className="text-gray-500 text-sm">No logs available for this execution.</div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-gray-500 flex h-full items-center justify-center">
              Select an execution to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
