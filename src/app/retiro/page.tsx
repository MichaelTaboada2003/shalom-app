'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Wallet, ChevronRight } from 'lucide-react';

const FEATURES = [
  {
    href: '/retiro/presupuesto',
    label: 'Presupuesto',
    description: 'Calcula y organiza los costos del retiro',
    Icon: Wallet,
    gradient: 'from-accent/20 to-accent/5',
    iconColor: 'text-accent',
  },
];

export default function RetiroPage() {
  const router = useRouter();

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold tracking-tight">Retiro</h1>
        <p className="text-text-secondary text-sm mt-1">Herramientas para organizar el retiro</p>
      </motion.header>

      <div className="flex flex-col gap-3">
        {FEATURES.map((feature, i) => (
          <motion.button
            key={feature.href}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => router.push(feature.href)}
            className={`group relative flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r ${feature.gradient} border border-border-subtle hover:border-border-medium transition-all active:scale-[0.98] text-left w-full`}
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-bg-elevated">
              <feature.Icon size={22} className={feature.iconColor} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-sm font-semibold text-text-primary">{feature.label}</span>
              <span className="block text-xs text-text-secondary mt-0.5">{feature.description}</span>
            </div>
            <ChevronRight size={18} className="text-text-muted group-hover:text-text-secondary transition-colors" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
