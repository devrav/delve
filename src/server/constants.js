import dotenv from "dotenv";

dotenv.config();

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;