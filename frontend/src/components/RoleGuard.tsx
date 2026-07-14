import React from 'react';
import { useAuthStore } from '../store/authStore';

interface RoleGuardProps {
  roles: ('ADMIN' | 'MEMBER')[];
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ roles, children }) => {
  const user = useAuthStore((state) => state.user);

  if (!user || !roles.includes(user.role)) {
    return (
      <div className="p-8 text-center text-red-400 bg-slate-900 rounded-xl border border-red-500/20 m-4">
        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
        <p className="text-sm">You do not have permission to view this content.</p>
      </div>
    );
  }

  return <>{children}</>;
};
