import { createClient } from '@/lib/supabase/server';
import { getProfile } from '@/lib/auth';

/** Writes one row to the activity log: who did what. */
export async function logActivity(action: string, entity: string, entityId?: string, detail?: string) {
  const p = await getProfile();
  await createClient().from('activity_log').insert({
    staff_id: p.id, staff_name: p.full_name || p.email, action, entity, entity_id: entityId, detail,
  });
}
