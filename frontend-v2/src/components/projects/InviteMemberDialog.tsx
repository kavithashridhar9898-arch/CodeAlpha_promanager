'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInviteMember } from '@/hooks/useProjects';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['ADMIN', 'MEMBER']),
});

type FormValues = {
  email: string;
  role: 'ADMIN' | 'MEMBER';
};

interface Props {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function InviteMemberDialog({ projectId, isOpen, onClose }: Props) {
  const { mutateAsync: inviteMember } = useInviteMember();
  const [serverError, setServerError] = useState<string | null>(null);
  
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'MEMBER' },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setServerError(null);
      await inviteMember({ projectId, email: data.email, role: data.role });
      reset();
      onClose();
    } catch (error: any) {
      setServerError(error.response?.data?.message || 'Failed to invite member.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-card border border-border shadow-2xl rounded-3xl overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-secondary/30">
              <h2 className="text-xl font-bold text-foreground">Invite Team Member</h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 text-muted-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
              {serverError && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium rounded-xl">
                  {serverError}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Email Address</label>
                <input
                  {...register('email')}
                  type="email"
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary text-foreground outline-none transition-all placeholder:text-muted-foreground/50"
                  placeholder="colleague@example.com"
                  autoFocus
                />
                {errors.email && <p className="text-destructive text-xs font-medium">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Role</label>
                <select
                  {...register('role')}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary text-foreground outline-none transition-all appearance-none"
                >
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div className="pt-2 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl text-muted-foreground hover:bg-secondary font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 flex items-center justify-center min-w-[140px] rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-primary/25"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Invite
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
