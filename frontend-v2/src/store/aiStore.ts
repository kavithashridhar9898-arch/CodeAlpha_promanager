import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AIStore {
  isOpen: boolean;
  activeConversationId: string | null;
  activeProjectId: string | null;
  toggleAI: () => void;
  openAI: (projectId?: string) => void;
  closeAI: () => void;
  setActiveConversation: (id: string | null) => void;
  setActiveProject: (id: string | null) => void;
}

export const useAIStore = create<AIStore>()(
  persist(
    (set) => ({
      isOpen: false,
      activeConversationId: null,
      activeProjectId: null,
      toggleAI: () => set((state) => ({ isOpen: !state.isOpen })),
      openAI: (projectId?: string) => set((state) => ({ isOpen: true, activeProjectId: projectId || state.activeProjectId })),
      closeAI: () => set({ isOpen: false }),
      setActiveConversation: (id) => set({ activeConversationId: id }),
      setActiveProject: (id) => set({ activeProjectId: id }),
    }),
    {
      name: 'pro-ai-store',
      partialize: (state) => ({ 
        activeConversationId: state.activeConversationId,
        activeProjectId: state.activeProjectId 
      }), // only persist these fields
    }
  )
);
