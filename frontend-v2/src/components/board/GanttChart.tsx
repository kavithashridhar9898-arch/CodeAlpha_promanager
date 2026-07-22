'use client';

import React, { useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { format, differenceInDays, startOfDay, min, max, addDays, isToday } from 'date-fns';
import { Task } from '@/hooks/useBoard';

interface GanttProps {
  tasks: Task[];
}

const PRIORITY_BAR_COLORS: Record<string, string> = {
  LOW: 'bg-emerald-500',
  MEDIUM: 'bg-amber-500',
  HIGH: 'bg-orange-500',
  URGENT: 'bg-rose-500',
};

const STATUS_OPACITY: Record<string, string> = {
  TODO: 'opacity-50',
  IN_PROGRESS: 'opacity-80',
  IN_REVIEW: 'opacity-90',
  DONE: 'opacity-100',
};

const ROW_HEIGHT = 48;
const DAY_WIDTH = 48;

export function GanttChart({ tasks }: GanttProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Only show tasks that have a due date
  const tasksWithDates = useMemo(
    () => tasks.filter((t) => !!t.dueDate),
    [tasks]
  );

  const { startDate, totalDays, days } = useMemo(() => {
    if (tasksWithDates.length === 0) {
      const start = startOfDay(new Date());
      const ds = Array.from({ length: 30 }, (_, i) => addDays(start, i));
      return { startDate: start, totalDays: 30, days: ds };
    }

    const dates = tasksWithDates.map((t) => startOfDay(new Date(t.dueDate!)));
    const earliest = subDays(min(dates), 3);
    const latest = addDays(max(dates), 5);
    const total = differenceInDays(latest, earliest) + 1;
    const ds = Array.from({ length: total }, (_, i) => addDays(earliest, i));
    return { startDate: earliest, totalDays: total, days: ds };
  }, [tasksWithDates]);

  const todayOffset = differenceInDays(startOfDay(new Date()), startDate);

  if (tasksWithDates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-xl font-bold text-foreground mb-2">No tasks with due dates</p>
        <p className="text-muted-foreground">Set due dates on tasks to see them in the Gantt view.</p>
      </div>
    );
  }

  return (
    <div className="overflow-auto rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex" style={{ minWidth: `${240 + totalDays * DAY_WIDTH}px` }}>
        {/* Left: Task list */}
        <div className="w-60 shrink-0 border-r border-border z-10 bg-card sticky left-0">
          <div className="h-12 flex items-center px-4 border-b border-border bg-secondary/40">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Task</span>
          </div>
          {tasksWithDates.map((task) => (
            <div
              key={task.id}
              className="h-12 flex items-center px-4 border-b border-border gap-2"
              style={{ height: ROW_HEIGHT }}
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_BAR_COLORS[task.priority] || 'bg-muted'}`}
              />
              <span className="text-sm font-medium truncate text-foreground">{task.title}</span>
            </div>
          ))}
        </div>

        {/* Right: Timeline grid */}
        <div className="flex-1 relative" ref={containerRef}>
          {/* Day headers */}
          <div className="flex h-12 border-b border-border bg-secondary/30 sticky top-0 z-10">
            {days.map((day, i) => {
              const weekend = day.getDay() === 0 || day.getDay() === 6;
              const today = isToday(day);
              return (
                <div
                  key={i}
                  className={`shrink-0 h-full flex flex-col items-center justify-center border-r border-border/50 ${
                    weekend ? 'bg-secondary/60' : ''
                  } ${today ? 'bg-primary/10' : ''}`}
                  style={{ width: DAY_WIDTH }}
                >
                  <span className={`text-[10px] font-bold uppercase ${today ? 'text-primary' : 'text-muted-foreground'}`}>
                    {format(day, 'EEE')}
                  </span>
                  <span className={`text-xs font-semibold ${today ? 'text-primary' : 'text-foreground'}`}>
                    {format(day, 'd')}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Rows */}
          <div className="relative">
            {tasksWithDates.map((task, rowIdx) => {
              const due = startOfDay(new Date(task.dueDate!));
              // Treat task as spanning from (due - 1) to due so it's visible
              const startOffset = Math.max(0, differenceInDays(due, startDate) - 1);
              const barWidth = DAY_WIDTH * 2; // 2-day width for visibility

              return (
                <div
                  key={task.id}
                  className="relative flex border-b border-border/50"
                  style={{ height: ROW_HEIGHT }}
                >
                  {/* Grid columns */}
                  {days.map((day, i) => {
                    const weekend = day.getDay() === 0 || day.getDay() === 6;
                    const today = isToday(day);
                    return (
                      <div
                        key={i}
                        className={`shrink-0 h-full border-r border-border/20 ${
                          weekend ? 'bg-secondary/20' : ''
                        } ${today ? 'bg-primary/5' : ''}`}
                        style={{ width: DAY_WIDTH }}
                      />
                    );
                  })}

                  {/* Bar */}
                  <motion.div
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{ delay: rowIdx * 0.05, duration: 0.4 }}
                    className={`absolute top-2.5 h-7 rounded-lg shadow-md flex items-center px-2 gap-1.5 text-white text-xs font-semibold select-none cursor-pointer hover:brightness-110 transition-all origin-left ${
                      PRIORITY_BAR_COLORS[task.priority] || 'bg-primary'
                    } ${STATUS_OPACITY[task.status] || ''}`}
                    style={{
                      left: startOffset * DAY_WIDTH + 4,
                      width: barWidth - 8,
                    }}
                    title={`${task.title} — Due: ${format(due, 'MMM d')}`}
                  >
                    <span className="truncate text-[11px]">{task.title}</span>
                  </motion.div>
                </div>
              );
            })}

            {/* Today line */}
            {todayOffset >= 0 && todayOffset < totalDays && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-primary z-20 pointer-events-none"
                style={{ left: todayOffset * DAY_WIDTH + DAY_WIDTH / 2 }}
              >
                <div className="w-3 h-3 rounded-full bg-primary -translate-x-1/2 -mt-1.5 shadow-[0_0_8px_rgba(79,70,229,0.6)]" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function subDays(date: Date, days: number): Date {
  return addDays(date, -days);
}
