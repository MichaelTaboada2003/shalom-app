'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, type UserRole } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import {
  Shield, Users, ChevronDown, Trash2, UserPlus,
  Crown, Star, User as UserIcon, Mail, Lock, X,
} from 'lucide-react';

interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  active: boolean;
  created_at: string;
  last_login: string | null;
}

const ROLE_CONFIG: Record<UserRole, { label: string; Icon: typeof Crown; color: string; bg: string }> = {
  admin: { label: 'Admin', Icon: Crown, color: 'text-warning', bg: 'bg-warning/10' },
  leader: { label: 'Líder', Icon: Star, color: 'text-accent', bg: 'bg-accent-soft' },
  member: { label: 'Miembro', Icon: UserIcon, color: 'text-text-secondary', bg: 'bg-bg-elevated' },
};

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Create user form
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('member');
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'admin') router.replace('/checklist');
  }, [user, router]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) setUsers(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const createUser = async () => {
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) return;
    setCreateError('');
    setCreating(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), email: newEmail.trim(), password: newPassword, role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) { setCreateError(data.error); setCreating(false); return; }
      // After creating, update the role if not member (register defaults to member)
      if (newRole !== 'member' && data.user?.id) {
        await fetch(`/api/users/${data.user.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: newRole }),
        });
      }
      setNewName(''); setNewEmail(''); setNewPassword(''); setNewRole('member');
      setShowCreate(false);
      fetchUsers();
    } catch { setCreateError('Error al crear usuario'); }
    finally { setCreating(false); }
  };

  const updateRole = async (id: string, role: UserRole) => {
    await fetch(`/api/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) });
    fetchUsers();
  };

  const toggleActive = async (id: string, active: boolean) => {
    await fetch(`/api/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active }) });
    fetchUsers();
  };

  const deleteUser = async (id: string) => {
    await fetch(`/api/users/${id}`, { method: 'DELETE' });
    fetchUsers();
  };

  if (user?.role !== 'admin') return null;

  return (
    <div className="px-4 pt-4 pb-4 max-w-lg mx-auto">
      <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <Shield size={20} className="text-accent" />
          <h1 className="text-xl font-bold tracking-tight">Administración</h1>
        </div>
        <p className="text-text-secondary text-sm">Gestiona usuarios y roles</p>
      </motion.header>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {(['admin', 'leader', 'member'] as UserRole[]).map(role => {
          const cfg = ROLE_CONFIG[role];
          const count = users.filter(u => u.role === role).length;
          return (
            <div key={role} className={`flex flex-col items-center gap-1 p-3 rounded-xl ${cfg.bg} border border-border-subtle`}>
              <cfg.Icon size={16} className={cfg.color} />
              <span className="text-lg font-bold">{count}</span>
              <span className="text-[10px] text-text-muted uppercase tracking-wider">{cfg.label}s</span>
            </div>
          );
        })}
      </div>

      {/* Create user */}
      <AnimatePresence>
        {showCreate ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="p-4 rounded-2xl border border-border-accent bg-bg-elevated flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Crear usuario</span>
                <button onClick={() => { setShowCreate(false); setCreateError(''); }} className="p-1 rounded-lg text-text-muted hover:text-text-secondary">
                  <X size={16} />
                </button>
              </div>

              {createError && (
                <div className="text-xs text-danger bg-danger-soft p-2 rounded-lg">{createError}</div>
              )}

              <div className="relative">
                <UserIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nombre" className="w-full h-10 pl-9 pr-3 rounded-xl bg-bg-primary border border-border-subtle text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent transition-colors" />
              </div>

              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Email" className="w-full h-10 pl-9 pr-3 rounded-xl bg-bg-primary border border-border-subtle text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent transition-colors" />
              </div>

              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Contraseña" className="w-full h-10 pl-9 pr-3 rounded-xl bg-bg-primary border border-border-subtle text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent transition-colors" />
              </div>

              {/* Role selector */}
              <div>
                <span className="text-xs text-text-muted font-medium mb-1.5 block">Rol</span>
                <div className="flex gap-2">
                  {(['member', 'leader', 'admin'] as UserRole[]).map(role => {
                    const rc = ROLE_CONFIG[role];
                    const isSelected = newRole === role;
                    return (
                      <button
                        key={role}
                        onClick={() => setNewRole(role)}
                        className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-semibold transition-all active:scale-[0.97] ${isSelected ? `${rc.bg} ${rc.color} border border-current/20` : 'bg-bg-card border border-border-subtle text-text-muted'}`}
                      >
                        <rc.Icon size={12} />
                        {rc.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={createUser}
                disabled={creating || !newName.trim() || !newEmail.trim() || !newPassword.trim()}
                className="flex items-center justify-center gap-2 h-10 rounded-xl bg-accent text-white text-xs font-semibold disabled:opacity-40 hover:bg-accent/90 transition-all active:scale-[0.98]"
              >
                {creating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><UserPlus size={14} /> Crear usuario</>}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setShowCreate(true)}
            className="flex items-center justify-center gap-2 w-full h-11 rounded-2xl border-2 border-dashed border-border-subtle text-text-secondary text-sm font-medium hover:border-accent/40 hover:text-accent hover:bg-accent-soft transition-all active:scale-[0.98] mb-4"
          >
            <UserPlus size={16} /> Crear usuario
          </motion.button>
        )}
      </AnimatePresence>

      {/* Users list */}
      <div className="flex items-center gap-2 mb-3">
        <Users size={16} className="text-text-muted" />
        <span className="text-sm font-semibold text-text-secondary">{users.length} usuarios</span>
      </div>

      <div className="flex flex-col gap-2">
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {users.map((u, i) => {
          const cfg = ROLE_CONFIG[u.role];
          const isOpen = expandedId === u.id;
          const isSelf = u.id === user?.id;

          return (
            <motion.div
              key={u.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`rounded-2xl border transition-all ${isOpen ? 'border-border-accent bg-bg-elevated' : 'border-border-subtle bg-bg-card'} ${!u.active ? 'opacity-50' : ''}`}
            >
              <button onClick={() => setExpandedId(isOpen ? null : u.id)} className="flex items-center w-full px-4 py-3 gap-3 text-left">
                <div className={`flex items-center justify-center w-9 h-9 rounded-xl ${cfg.bg}`}>
                  <cfg.Icon size={16} className={cfg.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-sm font-medium truncate">{u.name} {isSelf && <span className="text-text-muted">(tú)</span>}</span>
                  <span className="block text-xs text-text-muted truncate">{u.email}</span>
                </div>
                <ChevronDown size={16} className={`text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="px-4 pb-4 flex flex-col gap-3">
                      {/* Role selector */}
                      <div>
                        <span className="text-xs text-text-muted font-medium mb-2 block">Rol</span>
                        <div className="flex gap-2">
                          {(['admin', 'leader', 'member'] as UserRole[]).map(role => {
                            const rc = ROLE_CONFIG[role];
                            const isSelected = u.role === role;
                            return (
                              <button
                                key={role}
                                onClick={() => !isSelf && updateRole(u.id, role)}
                                disabled={isSelf}
                                className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-semibold transition-all ${isSelected ? `${rc.bg} ${rc.color} border border-current/20` : 'bg-bg-card border border-border-subtle text-text-muted'} ${isSelf ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.97]'}`}
                              >
                                <rc.Icon size={12} />
                                {rc.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Toggle active */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-text-muted font-medium">Cuenta activa</span>
                        <button
                          onClick={() => !isSelf && toggleActive(u.id, !u.active)}
                          disabled={isSelf}
                          className={`w-11 h-6 rounded-full transition-colors relative ${u.active ? 'bg-success' : 'bg-bg-elevated border border-border-subtle'} ${isSelf ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${u.active ? 'left-[22px]' : 'left-0.5'}`} />
                        </button>
                      </div>

                      {/* Info */}
                      <div className="text-[10px] text-text-muted space-y-0.5 pt-1 border-t border-border-subtle">
                        <p>Creado: {new Date(u.created_at).toLocaleDateString('es')}</p>
                        <p>Último login: {u.last_login ? new Date(u.last_login).toLocaleDateString('es') : 'Nunca'}</p>
                      </div>

                      {/* Delete */}
                      {!isSelf && (
                        <button onClick={() => deleteUser(u.id)} className="flex items-center justify-center gap-2 h-9 rounded-xl bg-danger-soft text-danger text-xs font-medium hover:bg-danger/20 transition-colors active:scale-[0.98]">
                          <Trash2 size={14} /> Eliminar usuario
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
