import type { AuthUser } from '@/lib/auth';
import { AuthError } from '@/lib/auth';
import { getDb } from '@/lib/db';

export type ChecklistVisibility = 'community' | 'personal';

export async function requireChecklistAccess(sql: ReturnType<typeof getDb>, checklistId: string, user: AuthUser) {
  const rows = await sql`SELECT id, visibility, owner_id FROM checklists WHERE id = ${checklistId}`;
  const checklist = rows[0] as { id: string; visibility: ChecklistVisibility; owner_id: string | null } | undefined;
  if (!checklist) throw new AuthError('Lista no encontrada', 404);
  if (checklist.visibility === 'personal' && checklist.owner_id !== user.id) throw new AuthError('No tienes acceso a esta lista', 403);
  return checklist;
}
