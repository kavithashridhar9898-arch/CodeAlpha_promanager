'use client';

import React, { useState } from 'react';
import { CheckSquare, Plus, Trash2, X, Loader2 } from 'lucide-react';
import { 
  useChecklists, 
  useCreateChecklist, 
  useDeleteChecklist, 
  useAddChecklistItem, 
  useUpdateChecklistItem, 
  useDeleteChecklistItem,
  Checklist
} from '@/hooks/useChecklist';
import { motion, AnimatePresence } from 'framer-motion';

export function ChecklistSection({ taskId }: { taskId: string }) {
  const { data: checklists, isLoading } = useChecklists(taskId);
  const { mutateAsync: createChecklist, isPending: isCreating } = useCreateChecklist(taskId);
  
  const [isAddingList, setIsAddingList] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await createChecklist(newTitle);
    setNewTitle('');
    setIsAddingList(false);
  };

  return (
    <div className="space-y-6 mt-8 border-t border-border pt-8">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
          <CheckSquare className="w-5 h-5 text-primary" /> Checklists
        </h3>
        {!isAddingList && (
          <button 
            onClick={() => setIsAddingList(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-sm font-semibold rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Add List
          </button>
        )}
      </div>

      {isAddingList && (
        <form onSubmit={handleCreateList} className="flex gap-2 items-center bg-secondary/30 p-2 rounded-xl border border-border">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Checklist title..."
            className="flex-1 bg-transparent px-3 py-1.5 outline-none text-sm font-medium placeholder:text-muted-foreground/60"
            autoFocus
          />
          <button type="submit" disabled={isCreating || !newTitle.trim()} className="px-4 py-1.5 bg-primary text-primary-foreground font-semibold rounded-lg text-sm">
            {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
          </button>
          <button type="button" onClick={() => setIsAddingList(false)} className="p-1.5 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </form>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => <div key={i} className="h-24 bg-secondary/50 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-6">
          {checklists?.map((list) => (
            <ChecklistBlock key={list.id} list={list} taskId={taskId} />
          ))}
        </div>
      )}
    </div>
  );
}

function ChecklistBlock({ list, taskId }: { list: Checklist; taskId: string }) {
  const { mutateAsync: deleteChecklist } = useDeleteChecklist(taskId);
  const { mutateAsync: addItem, isPending: isAdding } = useAddChecklistItem(taskId);
  const { mutateAsync: updateItem } = useUpdateChecklistItem(taskId);
  const { mutateAsync: deleteItem } = useDeleteChecklistItem(taskId);

  const [newItem, setNewItem] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    await addItem({ checklistId: list.id, content: newItem });
    setNewItem('');
  };

  const completedCount = list.items.filter((i) => i.isCompleted).length;
  const progress = list.items.length === 0 ? 0 : Math.round((completedCount / list.items.length) * 100);

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-foreground">{list.title}</h4>
        <button onClick={() => deleteChecklist(list.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded hover:bg-destructive/10">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs font-semibold text-muted-foreground w-8">{progress}%</span>
        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className={`h-full ${progress === 100 ? 'bg-emerald-500' : 'bg-primary'}`} 
          />
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <AnimatePresence>
          {list.items.map((item) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-3 group"
            >
              <button 
                onClick={() => updateItem({ checklistId: list.id, itemId: item.id, isCompleted: !item.isCompleted })}
                className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                  item.isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-border hover:border-primary'
                }`}
              >
                {item.isCompleted && <CheckSquare className="w-3.5 h-3.5" />}
              </button>
              <span className={`flex-1 text-sm ${item.isCompleted ? 'line-through text-muted-foreground opacity-70' : 'text-foreground'}`}>
                {item.content}
              </span>
              <button 
                onClick={() => deleteItem({ checklistId: list.id, itemId: item.id })}
                className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all rounded hover:bg-destructive/10"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {!isAddingItem ? (
        <button 
          onClick={() => setIsAddingItem(true)}
          className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
        >
          Add an item
        </button>
      ) : (
        <form onSubmit={handleAddItem} className="flex gap-2">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Add an item..."
            className="flex-1 px-3 py-1.5 text-sm bg-background border border-border rounded-lg outline-none focus:border-primary"
            autoFocus
          />
          <button type="submit" disabled={isAdding || !newItem.trim()} className="px-3 py-1.5 bg-primary text-primary-foreground font-semibold rounded-lg text-sm">
            Add
          </button>
          <button type="button" onClick={() => setIsAddingItem(false)} className="p-1.5 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );
}
