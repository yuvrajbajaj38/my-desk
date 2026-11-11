// Load the same Supabase v2 browser SDK used by the My Study Desk workspace.
// The root HTML loads the UMD build before the React module.
const supabaseSdk = typeof window !== "undefined" ? window.supabase : null;
if (!supabaseSdk?.createClient) {
  throw new Error("Supabase browser SDK did not load. Check the network connection and reload.");
}
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://icgbufofhubjnrekedoa.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_CVWGeQ2kx_zx0u58G9TeMw_64VEx55k";
export const supabase = supabaseSdk.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
