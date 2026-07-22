import React from 'react';
import { Bot } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAIStore } from '@/store/aiStore';

export function ProAIFab() {
  const { toggleAI, isOpen } = useAIStore();

  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={toggleAI}
      className={`fixed bottom-24 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-colors ${
        isOpen ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground border border-border hover:border-primary/50'
      }`}
    >
      <Bot className="w-6 h-6" />
      
      {/* Pulse effect when closed */}
      {!isOpen && (
        <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: '3s' }}></span>
      )}
    </motion.button>
  );
}
