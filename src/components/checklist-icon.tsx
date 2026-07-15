import {
  BookOpen, CalendarDays, Church, ClipboardCheck, HeartHandshake, Mic, Music,
  Tent, Utensils, UsersRound, type LucideProps,
} from 'lucide-react';

const CHECKLIST_ICONS = {
  clipboard: ClipboardCheck,
  church: Church,
  music: Music,
  heart: HeartHandshake,
  book: BookOpen,
  calendar: CalendarDays,
  utensils: Utensils,
  tent: Tent,
  microphone: Mic,
  community: UsersRound,
} as const;

export type ChecklistIconName = keyof typeof CHECKLIST_ICONS;
export const CHECKLIST_ICON_OPTIONS = Object.keys(CHECKLIST_ICONS) as ChecklistIconName[];

export function ChecklistIcon({ name, ...props }: LucideProps & { name?: string | null }) {
  const Icon = CHECKLIST_ICONS[name as ChecklistIconName] ?? ClipboardCheck;
  return <Icon aria-hidden="true" {...props} />;
}
