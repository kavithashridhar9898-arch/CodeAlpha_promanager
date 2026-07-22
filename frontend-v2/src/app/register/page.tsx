'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { HeroCanvas } from '@/components/landing/HeroCanvas';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error } = useAuthStore();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(name, email, password);
      router.push('/dashboard');
    } catch (err) {
      // Error handled in store
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left side: Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-24 xl:px-32 relative z-10">
        
        <div className="absolute top-12 left-12">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md mx-auto mt-12 lg:mt-0"
        >
          <div className="mb-10 text-center lg:text-left">
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Create an account</h1>
            <p className="text-muted-foreground">Start managing your enterprise projects today.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleRegister}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Full Name</label>
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe" 
                className="w-full h-11 px-4 rounded-xl border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Work Email</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com" 
                className="w-full h-11 px-4 rounded-xl border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full h-11 px-4 rounded-xl border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
              />
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-xl flex items-center justify-center gap-2 bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25 hover:shadow-primary/40 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in instead
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right side: Cinematic 3D Workspace */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-end p-12 overflow-hidden bg-black">
        <HeroCanvas />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent to-background/90 z-0 pointer-events-none" />
        
        <div className="relative z-10">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-bold text-white mb-4"
          >
            Scale your vision.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-white/60 text-lg max-w-md"
          >
            Empower your team with a platform that adapts to your workflow, not the other way around.
          </motion.p>
        </div>
      </div>
    </div>
  );
}
