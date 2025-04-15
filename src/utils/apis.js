import api from "./axios";

const getHeaders = (session) => ({
  Authorization: `Bearer ${session.access_token}`,
});

export const getSupabaseProjects = async (session) => {
  const { data } = await api.get("/supabase/projects", {
    headers: getHeaders(session),
  });
  return data;
};

export const getSupabaseUsers = async (session) => {
  const { data } = await api.get("/supabase/users", {
    headers: getHeaders(session),
  });
  return data;
};

export const getSupabaseTables = async (session) => {
  const { data } = await api.get("/supabase/tables", {
    headers: getHeaders(session),
  });
  return data;
};

export const checkSupabaseIntegration = async (session) => {
  const { data } = await api.get("/supabase/is_integrated", {
    headers: getHeaders(session),
  });
  return data;
};

export const getEvidenceForCheck = async (session, check, timestamp) => {
  const { data } = await api.get(`/supabase/evidence/${check}/${timestamp}`, {
    headers: getHeaders(session),
  });
  return data;
};

export const collectEvidence = async (session) => {
  await api.post(
    "/supabase/evidence/collect",
    {},
    {
      headers: getHeaders(session),
    }
  );
};

export const refreshSupabaseData = async (session) => {
  const { data } = await api.post(
    "/supabase/refresh",
    {},
    { headers: getHeaders(session) }
  );
  return data;
};

export const integrateSupabase = async (session, supabaseAccessToken) => {
  const { data } = await api.post(
    "/supabase/integrate",
    { supabaseAccessToken },
    {
      headers: getHeaders(session),
    }
  );
  return data;
};

export const removeSupabaseIntegration = async (session) => {
  const { data } = await api.post(
    "/supabase/remove",
    {},
    {
      headers: getHeaders(session),
    }
  );
  return data;
};
