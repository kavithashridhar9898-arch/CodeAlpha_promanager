import React, { useState, useEffect } from 'react';
import { Shield, Key, Laptop, Smartphone, AlertTriangle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

export function SecurityTab() {
  const { logout } = useAuthStore();
  const router = useRouter();
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const { data } = await api.get('/security/sessions');
      setSessions(data.data || []);
    } catch (err) {
      console.error('Failed to fetch sessions', err);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const handleUpdatePassword = async () => {
    setPasswordMessage({ type: '', text: '' });
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    
    if (passwordForm.newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 8 characters long.' });
      return;
    }

    try {
      setIsUpdatingPassword(true);
      await api.put('/security/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordMessage({ type: 'success', text: 'Password updated successfully.' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordMessage({ type: '', text: '' }), 3000);
    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update password.' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await api.delete(`/security/sessions/${sessionId}`);
      fetchSessions();
    } catch (err) {
      console.error('Failed to revoke session', err);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      await api.delete('/security/account', { data: { password: deletePassword } });
      await logout();
      router.push('/login');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete account.');
      setIsDeleting(false);
    }
  };

  const calculatePasswordStrength = (pass: string) => {
    if (pass.length === 0) return 0;
    let strength = 0;
    if (pass.length >= 8) strength += 25;
    if (pass.match(/[A-Z]/)) strength += 25;
    if (pass.match(/[0-9]/)) strength += 25;
    if (pass.match(/[^A-Za-z0-9]/)) strength += 25;
    return strength;
  };

  const passwordStrength = calculatePasswordStrength(passwordForm.newPassword);
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      {/* Password Card */}
      <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-border">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Password</h2>
            <p className="text-sm text-muted-foreground">Manage your password and authentication.</p>
          </div>
        </div>

        <div className="space-y-6 max-w-xl">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Current Password</label>
            <input 
              type="password" 
              name="currentPassword"
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
              className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
              placeholder="••••••••"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">New Password</label>
            <input 
              type="password" 
              name="newPassword"
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
              className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
              placeholder="••••••••"
            />
            {passwordForm.newPassword.length > 0 && (
              <div className="mt-2 flex gap-1 h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                <div className={`h-full ${passwordStrength >= 25 ? 'bg-red-500' : ''} w-1/4 transition-all`} />
                <div className={`h-full ${passwordStrength >= 50 ? 'bg-amber-500' : ''} w-1/4 transition-all`} />
                <div className={`h-full ${passwordStrength >= 75 ? 'bg-emerald-500' : ''} w-1/4 transition-all`} />
                <div className={`h-full ${passwordStrength === 100 ? 'bg-emerald-500' : ''} w-1/4 transition-all`} />
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Confirm New Password</label>
            <input 
              type="password" 
              name="confirmPassword"
              value={passwordForm.confirmPassword}
              onChange={handlePasswordChange}
              className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
              placeholder="••••••••"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <div>
              {passwordMessage.text && (
                <span className={`text-sm font-medium ${passwordMessage.type === 'success' ? 'text-emerald-500' : 'text-destructive'}`}>
                  {passwordMessage.text}
                </span>
              )}
            </div>
            <button 
              onClick={handleUpdatePassword}
              disabled={isUpdatingPassword || !passwordForm.currentPassword || !passwordForm.newPassword}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
            >
              {isUpdatingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Update Password
            </button>
          </div>
        </div>
      </div>

      {/* Account Security */}
      <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-border">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Account Security</h2>
            <p className="text-sm text-muted-foreground">Additional security measures for your account.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-secondary/30 transition-colors border border-transparent hover:border-border/50">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-foreground">Two-factor Authentication</h4>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md bg-secondary text-muted-foreground">Coming Soon</span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">Add an extra layer of security to your account.</p>
            </div>
            <label className="relative inline-flex items-center cursor-not-allowed opacity-50">
              <input type="checkbox" disabled className="sr-only peer" />
              <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary border border-border"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-secondary/30 transition-colors border border-transparent hover:border-border/50">
            <div>
              <h4 className="font-semibold text-foreground">Login Alerts</h4>
              <p className="text-sm text-muted-foreground mt-0.5">Get notified when a new device logs in.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary border border-border"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Active Sessions</h2>
              <p className="text-sm text-muted-foreground">Devices currently logged into your account.</p>
            </div>
          </div>
          <button className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
            Logout All Devices
          </button>
        </div>

        {isLoadingSessions ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session, idx) => (
              <div key={session.id} className="flex items-center justify-between p-4 rounded-2xl border border-border bg-secondary/20">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
                    {idx === 0 ? <Laptop className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-foreground">
                        {idx === 0 ? 'Current Device' : 'Unknown Device'}
                      </h4>
                      {idx === 0 && (
                        <span className="text-[10px] uppercase font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          Active Now
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Logged in {new Date(session.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {idx !== 0 && (
                  <button 
                    onClick={() => handleRevokeSession(session.id)}
                    className="text-sm font-semibold text-destructive hover:text-destructive/80 transition-colors"
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-8">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-red-500/10">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-red-500">Danger Zone</h2>
            <p className="text-sm text-red-500/80">Permanent and irreversible actions.</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-foreground">Deactivate Account</h4>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              Once you delete your account, there is no going back. Please be certain.
            </p>
          </div>
          <button 
            onClick={() => setShowDeleteConfirm(true)}
            className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-red-500/20"
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border shadow-2xl rounded-3xl p-8 max-w-md w-full relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
            <h3 className="text-2xl font-bold text-foreground mb-2">Delete Account</h3>
            <p className="text-muted-foreground mb-6">
              This action cannot be undone. This will permanently delete your account and remove your data from our servers. Please enter your password to confirm.
            </p>
            
            <div className="space-y-4 mb-8">
              <input 
                type="password" 
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-foreground"
              />
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletePassword('');
                }}
                disabled={isDeleting}
                className="flex-1 py-3 bg-secondary hover:bg-secondary/80 text-foreground font-semibold rounded-xl transition-colors border border-border disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteAccount}
                disabled={isDeleting || !deletePassword}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Confirm Deletion
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
