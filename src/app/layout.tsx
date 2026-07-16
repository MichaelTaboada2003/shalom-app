'use client';

import './globals.css';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CakeSlice, Church, ClipboardCheck, HeartHandshake, LogOut, Shield, Tent, UsersRound } from 'lucide-react';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { getInitials } from '@/lib/community';

const roleLabels = { admin: 'Administrador', leader: 'Líder', member: 'Miembro' } as const;

function AppContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
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
          <div className="user-pill">
            <span className="user-avatar">{getInitials(user?.name ?? 'S')}</span>
            <span className="user-copy"><b>{user?.name}</b><small>{user ? roleLabels[user.role] : ''}</small></span>
          </div>
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
