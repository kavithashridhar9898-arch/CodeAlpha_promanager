'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '@/lib/axios';

export default function GitHubCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMsg, setErrorMsg] = useState('');
  const processedRef = useRef(false);

  useEffect(() => {
    if (!code || !state) {
      setStatus('error');
      setErrorMsg('Invalid callback parameters');
      return;
    }

    if (processedRef.current) return;
    processedRef.current = true;

    const processOAuth = async () => {
      try {
        const res = await api.post('/integrations/github/callback', { code, state });
        if (res.data.success) {
          setStatus('success');
          // Redirect back to integrations page after a brief delay
          setTimeout(() => {
            router.push('/dashboard/integrations');
          }, 2000);
        }
      } catch (error: any) {
        console.error('OAuth callback failed:', error);
        setStatus('error');
        setErrorMsg(error.response?.data?.message || 'Failed to authenticate with GitHub');
      }
    };

    processOAuth();
  }, [code, state, router]);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-background/50">
      <div className="bg-card border border-border p-8 rounded-2xl shadow-sm text-center max-w-md w-full">
        {status === 'processing' && (
          <>
            <RefreshCw className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Connecting to GitHub...</h2>
            <p className="text-muted-foreground text-sm">Please wait while we securely exchange your credentials.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Connected Successfully!</h2>
            <p className="text-muted-foreground text-sm">Redirecting you back to integrations...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Connection Failed</h2>
            <p className="text-destructive text-sm mb-6">{errorMsg}</p>
            <button 
              onClick={() => router.push('/dashboard/integrations')}
              className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-sm font-medium transition-colors"
            >
              Go Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}
