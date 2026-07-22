'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { PieChart, TrendingUp, DollarSign, Clock } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Time & Cost Reports</h1>
          <p className="text-muted-foreground mt-1">Analytics on billable hours, project costs, and time distribution.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card border border-border p-5 rounded-xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-primary/10 text-primary rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Total Hours (MTD)</div>
            <div className="text-2xl font-bold text-foreground">342.5h</div>
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-green-500/10 text-green-500 rounded-lg">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Billable Amount</div>
            <div className="text-2xl font-bold text-foreground">$14,500</div>
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-orange-500/10 text-orange-500 rounded-lg">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Non-billable Hours</div>
            <div className="text-2xl font-bold text-foreground">42.0h</div>
          </div>
        </div>
        
        <div className="bg-card border border-border p-5 rounded-xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg">
            <PieChart className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Top Project</div>
            <div className="text-2xl font-bold text-foreground">Website Redesign</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm min-h-[300px] flex flex-col items-center justify-center text-center">
          <PieChart className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium text-foreground">Hours per Project Chart</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm">
            In a full implementation, Recharts or Chart.js would render the breakdown here.
          </p>
        </div>
        
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm min-h-[300px] flex flex-col items-center justify-center text-center">
          <TrendingUp className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium text-foreground">Burn Rate vs Estimated</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm">
            Visualizing the WorkloadReports variance data.
          </p>
        </div>
      </div>
    </div>
  );
}
