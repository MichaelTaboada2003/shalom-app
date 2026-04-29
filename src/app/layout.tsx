'use client';

import "./globals.css";
import { usePathname, useRouter } from "next/navigation";
import { CheckCircle2, Tent, Shield, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { AuthProvider, useAuth } from "@/lib/auth-context";

function AppContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  const isLoginPage = pathname === '/login';

  // Show nothing while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Redirect to login if not authenticated (except on login page)
  if (!user && !isLoginPage) {
    router.replace('/login');
    return null;
  }

  // Redirect away from login if already authenticated
  if (user && isLoginPage) {
    router.replace('/checklist');
    return null;
  }

  // Login page — no nav
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Redirect members away from retiro routes
  if (user?.role === 'member' && pathname.startsWith('/retiro')) {
    router.replace('/checklist');
    return null;
  }

  const navItems = [
    { href: '/checklist', label: 'Checklist', Icon: CheckCircle2 },
    ...(user?.role !== 'member' ? [{ href: '/retiro', label: 'Retiro', Icon: Tent }] : []),
    ...(user?.role === 'admin' ? [{ href: '/admin', label: 'Admin', Icon: Shield }] : []),
  ];

  return (
    <div className="flex flex-col min-h-dvh">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 pt-3 pb-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-text-muted">{user?.name}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-accent-soft text-accent font-semibold uppercase tracking-wider">{user?.role}</span>
        </div>
        <button onClick={async () => { await logout(); router.push('/login'); }} className="p-2 rounded-lg text-text-muted hover:text-danger hover:bg-danger-soft transition-colors">
          <LogOut size={16} />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-50 flex justify-around items-end h-16 bg-bg-secondary/90 backdrop-blur-2xl border-t border-border-subtle" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {navItems.map(({ href, label, Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <button
              key={href}
              onClick={() => router.push(href)}
              className="relative flex flex-col items-center gap-0.5 pt-2 pb-1 px-5 transition-colors"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute -top-px left-3 right-3 h-0.5 rounded-full bg-accent"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} className={isActive ? 'text-accent' : 'text-text-muted'} />
              <span className={`text-[10px] font-medium tracking-wide ${isActive ? 'text-accent' : 'text-text-muted'}`}>{label}</span>
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
        <meta name="theme-color" content="#0f0f1a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <title>Shalom App</title>
        <meta name="description" content="App de herramientas para la comunidad Shalom" />
      </head>
      <body>
        <AuthProvider>
          <AppContent>{children}</AppContent>
        </AuthProvider>
      </body>
    </html>
  );
}
