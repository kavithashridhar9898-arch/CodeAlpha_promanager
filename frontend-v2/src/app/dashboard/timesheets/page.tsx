'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileSpreadsheet, Download, Filter, Calendar } from 'lucide-react';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';

export default function TimesheetsPage() {
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [totalHours, setTotalHours] = useState(0);

  useEffect(() => {
    if (user) {
      fetchTimesheet();
    }
  }, [user, startDate, endDate]);

  const fetchTimesheet = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/time/timesheet?startDate=${startDate}&endDate=${endDate}`);
      setEntries(res.data.entries || []);
      setTotalHours(res.data.totalHours || 0);
    } catch (error) {
      console.error('Failed to fetch timesheet', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    alert('Exporting timesheet to CSV...');
    // In a real app, generate CSV from `entries` and trigger download
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Timesheets</h1>
          <p className="text-muted-foreground mt-1">Review your logged hours and submit timesheets.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExport} className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:bg-secondary/80 transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" /> Filters
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Start Date</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">End Date</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-foreground"
                />
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-primary/10 rounded-lg border border-primary/20">
              <div className="text-sm font-medium text-primary mb-1">Total Hours Logged</div>
              <div className="text-3xl font-bold text-foreground">{totalHours.toFixed(2)}h</div>
            </div>
          </div>
        </div>

        <div className="md:col-span-3">
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/20 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">Time Entries</h3>
            </div>
            
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading timesheet...</div>
            ) : entries.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No time entries found for the selected date range.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/10 text-sm">
                      <th className="px-4 py-3 font-medium text-muted-foreground">Date</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">Project</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">Task</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">Duration</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-muted/5 transition-colors text-sm">
                        <td className="px-4 py-3 text-foreground whitespace-nowrap">
                          {new Date(entry.startTime).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-foreground">{entry.project?.name || 'N/A'}</td>
                        <td className="px-4 py-3 text-foreground">{entry.task?.title || 'N/A'}</td>
                        <td className="px-4 py-3 font-mono text-primary">
                          {((entry.duration || 0) / 3600).toFixed(2)}h
                        </td>
                        <td className="px-4 py-3 text-muted-foreground truncate max-w-[200px]" title={entry.description}>
                          {entry.description || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
