'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Circle,
  Loader2,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';
import { useCalendarTasks, CalendarTask } from '@/hooks/useCalendar';

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-emerald-500',
  MEDIUM: 'bg-amber-500',
  HIGH: 'bg-orange-500',
  URGENT: 'bg-rose-500',
};

const STATUS_COLORS: Record<string, string> = {
  TODO: 'text-muted-foreground',
  IN_PROGRESS: 'text-blue-400',
  IN_REVIEW: 'text-amber-400',
  DONE: 'text-emerald-400',
};

function TaskPill({ task }: { task: CalendarTask }) {
  return (
    <div
      title={`${task.title} — ${task.projectName}`}
      className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20 truncate cursor-pointer hover:bg-primary/20 transition-colors"
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIORITY_COLORS[task.priority] || 'bg-muted'}`} />
      <span className="truncate">{task.title}</span>
    </div>
  );
}

function DayCell({ date, tasks, isCurrentMonth, selectedDay, onSelect }: {
  date: Date;
  tasks: CalendarTask[];
  isCurrentMonth: boolean;
  selectedDay: Date | null;
  onSelect: (d: Date) => void;
}) {
  const today = isToday(date);
  const selected = selectedDay ? isSameDay(date, selectedDay) : false;
  const visible = tasks.slice(0, 3);
  const overflow = tasks.length - visible.length;

  return (
    <div
      onClick={() => onSelect(date)}
      className={`relative min-h-[100px] p-2 rounded-2xl border transition-all cursor-pointer group ${
        selected
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/40 hover:bg-secondary/30'
      } ${!isCurrentMonth ? 'opacity-30' : ''}`}
    >
      <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold mb-1 ${
        today
          ? 'bg-primary text-primary-foreground shadow-[0_0_12px_rgba(79,70,229,0.5)]'
          : 'text-foreground'
      }`}>
        {format(date, 'd')}
      </div>
      <div className="space-y-1">
        {visible.map((t) => <TaskPill key={t.id} task={t} />)}
        {overflow > 0 && (
          <div className="text-xs text-muted-foreground font-medium pl-1">+{overflow} more</div>
        )}
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const { data: tasks, isLoading } = useCalendarTasks();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const tasksByDate = useMemo(() => {
    const map: Record<string, CalendarTask[]> = {};
    tasks?.forEach((task) => {
      if (!task.dueDate) return;
      const key = format(new Date(task.dueDate), 'yyyy-MM-dd');
      if (!map[key]) map[key] = [];
      map[key].push(task);
    });
    return map;
  }, [tasks]);

  const selectedDayTasks = useMemo(() => {
    if (!selectedDay) return [];
    const key = format(selectedDay, 'yyyy-MM-dd');
    return tasksByDate[key] || [];
  }, [selectedDay, tasksByDate]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Calendar</h1>
          <p className="text-muted-foreground mt-1">View tasks with due dates across all your projects.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-2 rounded-xl bg-secondary/50 hover:bg-secondary border border-border transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 rounded-xl bg-secondary/50 hover:bg-secondary border border-border text-sm font-semibold transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-2 rounded-xl bg-secondary/50 hover:bg-secondary border border-border transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Month label */}
      <motion.h2
        key={format(currentDate, 'yyyy-MM')}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-foreground mb-6"
      >
        {format(currentDate, 'MMMM yyyy')}
      </motion.h2>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : (
        <div className="flex gap-6 flex-1 overflow-hidden">
          {/* Calendar Grid */}
          <div className="flex-1 flex flex-col">
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="text-center text-xs font-bold text-muted-foreground uppercase tracking-widest py-2">
                  {d}
                </div>
              ))}
            </div>
            {/* Day cells */}
            <motion.div
              key={format(currentDate, 'yyyy-MM')}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-7 gap-2 flex-1"
            >
              {calendarDays.map((day) => {
                const key = format(day, 'yyyy-MM-dd');
                return (
                  <DayCell
                    key={key}
                    date={day}
                    tasks={tasksByDate[key] || []}
                    isCurrentMonth={isSameMonth(day, currentDate)}
                    selectedDay={selectedDay}
                    onSelect={setSelectedDay}
                  />
                );
              })}
            </motion.div>
          </div>

          {/* Side Panel: Selected Day Tasks */}
          <AnimatePresence mode="wait">
            {selectedDay && (
              <motion.div
                key={format(selectedDay, 'yyyy-MM-dd')}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-72 shrink-0 bg-card border border-border rounded-3xl p-5 overflow-y-auto"
              >
                <h3 className="text-lg font-bold mb-1">{format(selectedDay, 'EEEE')}</h3>
                <p className="text-sm text-muted-foreground mb-5">{format(selectedDay, 'MMMM d, yyyy')}</p>
                
                {selectedDayTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarDays className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
                    <p className="text-sm text-muted-foreground">No tasks due on this day.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDayTasks.map((task) => (
                      <div key={task.id} className="p-3 bg-secondary/30 border border-border rounded-2xl">
                        <div className="flex items-start gap-2 mb-2">
                          <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${PRIORITY_COLORS[task.priority]}`} />
                          <p className="text-sm font-semibold leading-snug">{task.title}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{task.projectName}</span>
                          <span className={`text-[10px] font-bold uppercase ${STATUS_COLORS[task.status]}`}>
                            {task.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
