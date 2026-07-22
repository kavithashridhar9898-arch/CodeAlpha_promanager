'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Activity, Layers, Lock, Zap } from 'lucide-react';

const features = [
  {
    icon: <Zap className="w-6 h-6 text-yellow-500" />,
    title: 'Lightning Fast',
    description: 'Built on Next.js 14 and Turbopack for sub-second page loads and instantaneous interactions.',
  },
  {
    icon: <Layers className="w-6 h-6 text-blue-500" />,
    title: 'Cinematic Workflows',
    description: 'Physics-based drag & drop Kanban boards that feel deeply tactile and satisfying to use.',
  },
  {
    icon: <Activity className="w-6 h-6 text-purple-500" />,
    title: 'Real-Time Sync',
    description: 'Socket.IO powered collaborative editing, presence, and live updates across your entire team.',
  },
  {
    icon: <Lock className="w-6 h-6 text-emerald-500" />,
    title: 'Enterprise Grade',
    description: 'Bank-level security, robust role-based access control, and complete audit logs for every action.',
  },
];

export function FeaturesSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  return (
    <section ref={containerRef} className="relative py-32 overflow-hidden bg-background">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-secondary/20 pointer-events-none" />
      
      <motion.div style={{ opacity }} className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-5xl font-bold tracking-tight mb-6"
          >
            Engineered for <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">Excellence</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-xl text-muted-foreground"
          >
            We didn't just build a project manager. We completely rethought how digital teams interact with their work.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="glass p-8 rounded-[2rem] flex flex-col gap-4 relative group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-semibold text-foreground mt-4">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
