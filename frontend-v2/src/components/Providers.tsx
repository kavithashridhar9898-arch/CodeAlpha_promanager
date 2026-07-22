'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { ThemeProvider, useTheme } from 'next-themes';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';

function ThemeSync() {
  const { setTheme } = useTheme();
  const theme = useAuthStore(s => s.user?.theme);
  
  useEffect(() => {
    if (theme) {
      setTheme(theme);
    }
  }, [theme, setTheme]);
  
  return null;
}

function LanguageSync() {
  const language = useAuthStore(s => s.user?.language);
  
  useEffect(() => {
    if (language && i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language]);
  
  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true}>
          <ThemeSync />
          <LanguageSync />
          {children}
        </ThemeProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}
