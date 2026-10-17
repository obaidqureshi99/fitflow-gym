import { createClient } from '@supabase/supabase-js';
// Service role: server-only. Used for creating staff users and the reminder cron.
export const createAdminClient = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
