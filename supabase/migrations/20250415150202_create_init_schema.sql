CREATE TABLE IF NOT EXISTS public.supabase_integrations (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid (),
    token TEXT NOT NULL,
    customer_id UUID NOT NULL REFERENCES auth.users (id) UNIQUE,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW (),
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW ()
);

ALTER TABLE IF EXISTS public.supabase_integrations ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.supabase_projects (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid (),
    remote_id TEXT NOT NULL,
    name TEXT NOT NULL,
    pitr_enabled BOOLEAN NOT NULL,
    customer_id UUID NOT NULL REFERENCES auth.users (id),
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW (),
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW ()
);

ALTER TABLE IF EXISTS public.supabase_projects ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS idx_supabase_projects_customer_id_remote_id ON public.supabase_projects (customer_id, remote_id);

CREATE TABLE IF NOT EXISTS public.supabase_users (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid (),
    remote_id TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    project_name TEXT NOT NULL,
    mfa_enabled BOOLEAN NOT NULL,
    customer_id UUID NOT NULL REFERENCES auth.users (id),
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW (),
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW ()
);

ALTER TABLE IF EXISTS public.supabase_users ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS idx_supabase_users_customer_id_project_name_remote_id ON public.supabase_users (customer_id, project_name, remote_id);

CREATE TABLE IF NOT EXISTS public.supabase_tables (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid (),
    name TEXT NOT NULL,
    rls_enabled BOOLEAN NOT NULL,
    project_name TEXT NOT NULL,
    customer_id UUID NOT NULL REFERENCES auth.users (id),
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW (),
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW ()
);

ALTER TABLE IF EXISTS public.supabase_tables ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS idx_supabase_tables_customer_id_project_name_name ON public.supabase_tables (customer_id, project_name, name);

CREATE TABLE IF NOT EXISTS public.evidences (
    id SERIAL PRIMARY KEY,
    check_type VARCHAR(255) NOT NULL,
    snapshot JSONB NOT NULL,
    customer_id UUID NOT NULL REFERENCES auth.users (id),
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW ()
);

ALTER TABLE IF EXISTS public.evidences ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_evidences_customer_id ON public.evidences (customer_id);