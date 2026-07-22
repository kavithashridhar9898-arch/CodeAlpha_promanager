'use client';

import React from 'react';
import { useMyInvitations, useRespondToInvitation } from '@/hooks/useInvitations';
import { Mail, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function PendingInvitations() {
  const { data: invitations, isLoading } = useMyInvitations();
  const { mutateAsync: respond, isPending } = useRespondToInvitation();
  const [processingToken, setProcessingToken] = React.useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="h-24 bg-card/50 rounded-3xl animate-pulse" />
    );
  }

  if (!invitations || invitations.length === 0) {
    return null; // Hide if no invitations
  }

  const handleResponse = async (token: string, accept: boolean) => {
    setProcessingToken(token);
    try {
      await respond({ token, accept });
    } finally {
      setProcessingToken(null);
    }
  };

  return (
    <div className="space-y-4 mb-8">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Mail className="w-5 h-5 text-primary" /> Pending Invitations ({invitations.length})
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {invitations.map((inv) => (
          <motion.div
            key={inv.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 bg-card border border-primary/20 shadow-md rounded-2xl flex flex-col gap-4 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            <div>
              <h3 className="font-bold text-lg leading-tight mb-1">{inv.project.name}</h3>
              <p className="text-sm text-muted-foreground">
                Invited by <span className="font-semibold text-foreground">{inv.inviter.name}</span> as <span className="font-semibold">{inv.role}</span>
              </p>
            </div>
            <div className="flex items-center gap-3 mt-auto">
              <button
                onClick={() => handleResponse(inv.token, true)}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {processingToken === inv.token ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Accept
              </button>
              <button
                onClick={() => handleResponse(inv.token, false)}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-destructive/10 text-destructive font-semibold rounded-xl hover:bg-destructive/20 transition-colors disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                Decline
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
