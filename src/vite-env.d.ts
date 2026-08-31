/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL?: string;
    readonly VITE_SUPABASE_ANON_KEY?: string;
    readonly VITE_SUBMISSION_DEADLINE?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
