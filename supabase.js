/* ==========================================
   SUPABASE CONFIGURATION
========================================== */

const SUPABASE_URL =
    "https://vrrcpjsfkoivcdpttxku.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_pFwbXJ3eEL7fZ0sAxIkJZw_9xq6Urg9";

/* Create ONE global client */
window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    }
);

/* Connection Test */
(async () => {

    try {

        const { error } =
            await window.supabaseClient.auth.getSession();

        if (error) {

            console.error(error);

        } else {

            console.log("✅ Supabase Connected");

        }

    } catch (err) {

        console.error(err);

    }

})();