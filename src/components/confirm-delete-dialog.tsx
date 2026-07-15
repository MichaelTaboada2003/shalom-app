'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface ConfirmDeleteDialogProps {
  open: boolean;
  title: string;
  description: React.ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export function ConfirmDeleteDialog({ open, title, description, onCancel, onConfirm, loading = false }: ConfirmDeleteDialogProps) {
  return <AnimatePresence>{open && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] grid place-items-end bg-black/65 p-0 backdrop-blur-sm sm:place-items-center sm:p-6"><motion.div role="dialog" aria-modal="true" aria-labelledby="confirm-delete-title" initial={{ y: 24, opacity: .8 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }} transition={{ type: 'spring', stiffness: 270, damping: 27 }} className="w-full max-w-md rounded-t-[2rem] border border-border-medium bg-bg-secondary p-6 shadow-2xl sm:rounded-[2rem]"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-danger-soft text-danger"><AlertTriangle size={23} /></span><h2 id="confirm-delete-title" className="mt-5 text-xl font-bold">{title}</h2><div className="mt-2 text-sm leading-6 text-text-secondary">{description}</div><div className="mt-6 grid grid-cols-2 gap-3"><button type="button" onClick={onCancel} disabled={loading} className="secondary-button">Cancelar</button><button type="button" onClick={onConfirm} disabled={loading} className="danger-button">{loading ? 'Borrando…' : <><Trash2 size={16} /> Borrar</>}</button></div></motion.div></motion.div>}</AnimatePresence>;
}
