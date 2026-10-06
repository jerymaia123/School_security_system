// Only the publishable (anon) key belongs in the browser. NEVER put a secret / service_role key here.
const SUPABASE_URL = "https://vrrcpjsfkoivcdpttxku.supabase.co";
const SUPABASE_KEY = "sb_publishable_pFwbXJ3eEL7fZ0sAxIkJZw_9xq6Urg9";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
