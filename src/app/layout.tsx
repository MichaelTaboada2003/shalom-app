'use client';

import './globals.css';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { CakeSlice, Church, ClipboardCheck, Eye, EyeOff, HeartHandshake, KeyRound, LogOut, Mail, Save, Shield, Tent, UserRound, UsersRound, X } from 'lucide-react';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { getInitials } from '@/lib/community';

const roleLabels = { admin: 'Administrador', leader: 'Líder', member: 'Miembro' } as const;

function AppContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout, refresh } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const isLoginPage = pathname === '/login';
  const mustRedirect = !loading && (
    (!user && !isLoginPage) ||
    (user && isLoginPage) ||
    (user?.role === 'member' && pathname.startsWith('/retiro')) ||
    (user?.role !== 'admin' && pathname.startsWith('/admin'))
  );

  useEffect(() => {
    if (!mustRedirect) return;
    if (!user) router.replace('/login');
    else router.replace('/checklist');
  }, [mustRedirect, router, user]);

  if (loading) return <div className="grid min-h-dvh place-items-center"><div className="loader" /></div>;
  if (mustRedirect) return null;
  if (isLoginPage) return <>{children}</>;

  const openProfile = () => {
    setProfileName(user?.name ?? '');
    setProfileEmail(user?.email ?? '');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setProfileError('');
    setShowPasswords(false);
    setProfileOpen(true);
  };

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) { setProfileError('Las nuevas contraseñas no coinciden'); return; }
    setSavingProfile(true);
    setProfileError('');
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profileName, email: profileEmail, currentPassword, newPassword, confirmPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo actualizar el perfil');
      await refresh();
      setProfileOpen(false);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'No se pudo actualizar el perfil');
    } finally {
      setSavingProfile(false);
    }
  };

  const navItems = [
    { href: '/checklist', label: 'Listas', Icon: ClipboardCheck },
    { href: '/integrantes', label: 'Personas', Icon: UsersRound },
    { href: '/cumpleanios', label: 'Cumples', Icon: CakeSlice },
    { href: '/mundo', label: 'Mundo', Icon: Church },
    ...(user?.role !== 'member' ? [{ href: '/retiro', label: 'Retiro', Icon: Tent }] : []),
    ...(user?.role === 'admin' ? [{ href: '/admin', label: 'Admin', Icon: Shield }] : []),
  ];

  return (
    <div className="app-shell flex min-h-dvh flex-col">
      <a href="#main-content" className="skip-link">Saltar al contenido</a>
      <header className="app-topbar">
        <button onClick={() => router.push('/checklist')} className="brand-mark" aria-label="Ir a las listas">
          <span className="brand-icon"><HeartHandshake size={18} /></span>
          <span><b>Shalom</b><small>Comunidad viva</small></span>
        </button>
        <div className="user-area">
          <button type="button" onClick={openProfile} className="user-pill" aria-label="Abrir mi perfil">
            <span className="user-avatar">{getInitials(user?.name ?? 'S')}</span>
            <span className="user-copy"><b>{user?.name}</b><small>{user ? roleLabels[user.role] : ''}</small></span>
          </button>
          <button onClick={async () => { await logout(); router.push('/login'); }} className="icon-button" aria-label="Cerrar sesión"><LogOut size={17} /></button>
        </div>
      </header>
      <main id="main-content" className="app-main relative flex-1 overflow-y-auto">{children}</main>
      <nav aria-label="Navegación principal" className="app-nav">
        {navItems.map(({ href, label, Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <button key={href} onClick={() => router.push(href)} aria-current={isActive ? 'page' : undefined} className={`nav-item ${isActive ? 'nav-item-active' : ''}`}>
              {isActive && <motion.span layoutId="active-nav" className="nav-active-orb" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
              <Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} /><span>{label}</span>
            </button>
          );
        })}
      </nav>
      <AnimatePresence>{profileOpen && <motion.div className="profile-overlay fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-[#07050fad] p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-label="Mi perfil" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.form className="profile-dialog w-full max-w-[510px] overflow-hidden rounded-[28px] border border-[#b7a0ff45] bg-gradient-to-br from-[#282046] to-[#17132a] shadow-2xl" onSubmit={saveProfile} initial={{ opacity: 0, y: 18, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 18, scale: .98 }} transition={{ type: 'spring', stiffness: 280, damping: 26 }}>
          <header className="profile-dialog-header relative flex min-h-32 items-center gap-3.5 overflow-hidden bg-gradient-to-br from-[#59448e] to-[#2e756d] px-6 py-5 pr-16"><span className="profile-dialog-icon grid size-[46px] shrink-0 place-items-center rounded-[15px] border border-white/20 bg-[#1a143155] text-[#f3edff]"><UserRound size={20} /></span><div><small>Mi cuenta</small><h2>Perfil y seguridad</h2><p>Actualiza tus datos de acceso a Shalom.</p></div><button type="button" className="profile-close absolute! right-4 top-4 grid size-10 place-items-center rounded-[13px] border border-white/20 bg-[#15102761] text-white" onClick={() => setProfileOpen(false)} aria-label="Cerrar perfil"><X size={18} /></button></header>
          <div className="profile-dialog-body flex flex-col gap-4 p-6">
            {profileError && <p role="alert" className="profile-error">{profileError}</p>}
            <label className="form-label">Nombre de usuario<input value={profileName} onChange={event => setProfileName(event.target.value)} className="profile-input h-12 w-full rounded-[15px] border border-border-subtle bg-[#0b09187a] px-3.5 text-sm text-text-primary" placeholder="Tu nombre" required /></label>
            <label className="form-label">Correo de acceso<span className="profile-input-wrap relative block"><Mail size={16} /><input type="email" value={profileEmail} onChange={event => setProfileEmail(event.target.value)} className="profile-input h-12 w-full rounded-[15px] border border-border-subtle bg-[#0b09187a] px-3.5 pl-[42px] text-sm text-text-primary" placeholder="tu@correo.com" required /></span></label>
            <section className="profile-password-section mt-1 flex items-start justify-between gap-2.5 border-t border-border-subtle pt-5"><div><span className="profile-section-title"><KeyRound size={15} /> Cambiar contraseña</span><p>Déjalo vacío si deseas conservar la actual.</p></div><button type="button" onClick={() => setShowPasswords(current => !current)} className="profile-visibility">{showPasswords ? <EyeOff size={15} /> : <Eye size={15} />}{showPasswords ? 'Ocultar' : 'Mostrar'}</button></section>
            <label className="form-label">Contraseña actual<input type={showPasswords ? 'text' : 'password'} value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} className="profile-input h-12 w-full rounded-[15px] border border-border-subtle bg-[#0b09187a] px-3.5 text-sm text-text-primary" autoComplete="current-password" /></label>
            <div className="profile-password-grid grid gap-3 sm:grid-cols-2"><label className="form-label">Nueva contraseña<input type={showPasswords ? 'text' : 'password'} value={newPassword} onChange={event => setNewPassword(event.target.value)} className="profile-input h-12 w-full rounded-[15px] border border-border-subtle bg-[#0b09187a] px-3.5 text-sm text-text-primary" autoComplete="new-password" minLength={6} /></label><label className="form-label">Confirmar contraseña<input type={showPasswords ? 'text' : 'password'} value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} className="profile-input h-12 w-full rounded-[15px] border border-border-subtle bg-[#0b09187a] px-3.5 text-sm text-text-primary" autoComplete="new-password" minLength={6} /></label></div>
          </div>
          <footer className="profile-dialog-footer flex justify-end gap-2.5 border-t border-border-subtle bg-[#0e0b1d75] px-6 py-4"><button type="button" onClick={() => setProfileOpen(false)} className="secondary-button">Cancelar</button><button disabled={savingProfile || !profileName.trim() || !profileEmail.trim()} className="primary-button">{savingProfile ? 'Guardando…' : <><Save size={16} /> Guardar cambios</>}</button></footer>
        </motion.form>
      </motion.div>}</AnimatePresence>
    </div>
  );
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#120f21" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <title>Shalom App</title>
        <meta name="description" content="La comunidad Shalom, organizada con cariño." />
      </head>
      <body><AuthProvider><AppContent>{children}</AppContent></AuthProvider></body>
    </html>
  );
}
