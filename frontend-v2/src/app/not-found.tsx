'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Hammer, ArrowLeft, Construction, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 overflow-hidden relative">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[150px] mix-blend-screen pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring', bounce: 0.4 }}
        className="max-w-md w-full relative z-10 flex flex-col items-center text-center"
      >
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="relative mb-8"
        >
          <div className="w-24 h-24 bg-gradient-to-tr from-primary to-purple-500 rounded-3xl rotate-12 flex items-center justify-center shadow-xl shadow-primary/20">
            <Construction className="w-12 h-12 text-white -rotate-12" />
          </div>
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-4 -right-4 bg-background p-2 rounded-xl shadow-sm border border-border"
          >
            <Sparkles className="w-6 h-6 text-yellow-500" />
          </motion.div>
        </motion.div>

        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-extrabold tracking-tight mb-4 text-foreground"
        >
          Under Construction
        </motion.h1>

        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground mb-10 text-lg leading-relaxed"
        >
          Whoops! It looks like you've discovered a feature that is still in development. Our engineers are working hard to bring this to life.
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 w-full justify-center"
        >
          <Link 
            href="/dashboard" 
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/25"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
