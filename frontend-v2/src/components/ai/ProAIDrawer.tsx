'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useAIStore } from '@/store/aiStore';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export function ProAIDrawer() {
  const { isOpen, closeAI, activeProjectId } = useAIStore();
  
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const generateMockResponse = (userPrompt: string): string => {
    const prompt = userPrompt.toLowerCase();
    
    if (prompt.includes('summarize project') || prompt.includes('summary')) {
      return `**Project Summary:**\n\nThis project is focused on delivering a comprehensive project management solution. We are currently tracking multiple tasks across different teams.\n\n*Key Highlights:*\n- Active sprints are progressing well.\n- Main focus is on finalizing the frontend components.\n- Backend API integration is mostly complete.`;
    }
    
    if (prompt.includes('risk') || prompt.includes('bottleneck')) {
      return `**Risk Analysis:**\n\nI have reviewed the current project state. Here are the potential risks identified:\n\n1. **Resource Constraints:** The frontend team is currently overallocated.\n2. **Timeline:** The upcoming milestone next week is at risk due to pending API reviews.\n\n*Recommendation:* Consider reassigning some low-priority tasks to the backend team to balance the workload.`;
    }
    
    if (prompt.includes('sprint') || prompt.includes('plan')) {
      return `**Sprint Plan Draft:**\n\nBased on the backlog, here is the suggested plan for the next sprint:\n\n- **High Priority:**\n  - Implement offline caching (UI)\n  - Finalize authentication flows (API)\n- **Medium Priority:**\n  - Update user profile settings page\n  - Migrate database to v2 schema\n\nTotal estimated effort: 45 story points.`;
    }
    
    if (prompt.includes('hello') || prompt.includes('hi')) {
      return `Hello! I am ProAI, your workspace assistant. I can help you summarize projects, analyze risks, or draft sprint plans. How can I assist you today?`;
    }

    // Default fallback
    return `I am currently operating in offline mode with predetermined responses. I can help you with:\n\n- Project Summaries\n- Risk Analysis\n- Sprint Planning\n\nPlease try asking me about one of these topics!`;
  };

  const onSubmit = (e?: React.FormEvent<HTMLFormElement>, customPrompt?: string) => {
    if (e) e.preventDefault();
    const messageContent = customPrompt || input;
    
    if (!messageContent.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    // Simulate network delay and AI thinking
    setTimeout(() => {
      const responseContent = generateMockResponse(messageContent);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const quickActions = [
    { label: 'Summarize Project', prompt: 'Please provide a summary of this project based on the context.' },
    { label: 'Risk Analysis', prompt: 'Analyze this project for potential risks and bottlenecks.' },
    { label: 'Sprint Planning', prompt: 'Draft a sprint plan based on the current backlog.' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAI}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[450px] md:w-[500px] bg-background border-l border-border z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-card/50 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    ProAI <Sparkles className="w-3 h-3 text-amber-500" />
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {activeProjectId ? 'Project Assistant' : 'Workspace Assistant'}
                  </p>
                </div>
              </div>
              <button onClick={closeAI} className="p-2 rounded-lg text-muted-foreground hover:bg-secondary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-muted-foreground p-8">
                  <Bot className="w-12 h-12 text-primary/50" />
                  <p>How can I help you manage your workspace today?</p>
                  
                  {/* Quick Actions */}
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {quickActions.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => onSubmit(undefined, action.prompt)}
                        className="text-xs px-3 py-1.5 rounded-full border border-border bg-secondary/50 hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m) => (
                <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    m.role === 'user' ? 'bg-primary/10 text-primary' : 'bg-secondary text-foreground border border-border'
                  }`}>
                    {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                    m.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                      : 'bg-secondary/50 border border-border text-foreground rounded-tl-sm'
                  }`}>
                    {m.role === 'user' ? (
                      m.content
                    ) : (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({node, inline, className, children, ...props}: any) {
                              const match = /language-(\w+)/.exec(className || '')
                              return !inline && match ? (
                                <SyntaxHighlighter
                                  style={vscDarkPlus}
                                  language={match[1]}
                                  PreTag="div"
                                  className="rounded-lg text-xs"
                                  {...props}
                                >
                                  {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                              ) : (
                                <code className="bg-background px-1.5 py-0.5 rounded text-xs text-primary" {...props}>
                                  {children}
                                </code>
                              )
                            }
                          }}
                        >
                          {m.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-secondary/50 border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-border bg-background">
              <form onSubmit={onSubmit} className="relative">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask ProAI..."
                  className="w-full bg-secondary/50 border border-border rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  disabled={isLoading}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {isLoading ? (
                    <button type="button" className="p-1.5 text-muted-foreground rounded-lg transition-colors cursor-not-allowed">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </button>
                  ) : (
                    <button 
                      type="submit" 
                      disabled={!input.trim()}
                      className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </form>
              <div className="text-center mt-2">
                <span className="text-[10px] text-muted-foreground">ProAI is currently operating in offline mode with mock responses.</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
