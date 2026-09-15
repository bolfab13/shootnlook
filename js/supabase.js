export function createSupabaseClient() {
  const url = window.SUPABASE_URL;
  const anonKey = window.SUPABASE_ANON_KEY;

  if (!window.supabase || !url || !anonKey) {
    throw new Error('Configuration Supabase absente');
  }

  return window.supabase.createClient(url, anonKey);
}

export async function getCurrentUser(db) {
  const { data: { user }, error } = await db.auth.getUser();
  return { user, error };
}
