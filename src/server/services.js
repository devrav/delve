import { CHECK_TYPES } from "../common/checks.js";
import { serverSupabase, decryptToken } from "./utils.js";

const supabaseApi = async (accessToken, path, method = "GET", body = {}) => {
  const response = await fetch(`https://api.supabase.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: method === "GET" ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}`);
  }

  return await response.json();
};

const isPitrEnabled = async (accessToken, project) => {
  const { pitr_enabled } = await supabaseApi(
    accessToken,
    `projects/${project.remote_id}/database/backups`
  );
  return pitr_enabled;
};

const runSupabaseQuery = async (accessToken, project, query) => {
  const response = await supabaseApi(
    accessToken,
    `projects/${project.remote_id}/database/query`,
    "POST",
    { query }
  );
  return response;
};

export const getSupabaseAccessToken = async (customerId) => {
  const data = await serverSupabase
    .from("supabase_integrations")
    .select("token")
    .eq("customer_id", customerId);
  return decryptToken(data.data[0].token);
};

export const fetchSupabaseProjects = async (accessToken) => {
  const projects = await supabaseApi(accessToken, "projects");
  return await Promise.all(
    projects
      .map((project) => ({ remote_id: project.id, name: project.name }))
      .map(async (project) => ({
        ...project,
        pitr_enabled: await isPitrEnabled(accessToken, project),
      }))
  );
};

const fetchSupabaseUsers = async (accessToken, project) => {
  const users = await runSupabaseQuery(
    accessToken,
    project,
    "select id, email, phone, (select count(id) from auth.mfa_factors where user_id = auth.users.id) as mfa_factors_count from auth.users"
  );
  return users.map((user) => ({
    remote_id: user.id,
    email: user.email,
    phone: user.phone,
    mfa_enabled: user.mfa_factors_count > 0,
    project_name: project.name,
  }));
};

export const fetchAllSupabaseUsers = async (accessToken, projects) => {
  const users = await Promise.all(
    projects.map((project) => fetchSupabaseUsers(accessToken, project))
  );
  return users.flat();
};

const fetchSupabaseTables = async (accessToken, project) => {
  const tables = await runSupabaseQuery(
    accessToken,
    project,
    "select tablename as name, rowsecurity as rls_enabled from pg_catalog.pg_tables where schemaname = 'public';"
  );
  return tables.map((table) => ({
    ...table,
    project_name: project.name,
  }));
};

export const fetchAllSupabaseTables = async (accessToken, projects) => {
  const tables = await Promise.all(
    projects.map((project) => fetchSupabaseTables(accessToken, project))
  );
  return tables.flat();
};

const listDbSupabaseProjects = async (customerId) => {
  const projects = await serverSupabase
    .from("supabase_projects")
    .select("*")
    .eq("customer_id", customerId);
  return projects.data;
};

const listDbSupabaseUsers = async (customerId) => {
  const users = await serverSupabase
    .from("supabase_users")
    .select("*")
    .eq("customer_id", customerId);
  return users.data;
};

const listDbSupabaseTables = async (customerId) => {
  const tables = await serverSupabase
    .from("supabase_tables")
    .select("*")
    .eq("customer_id", customerId);
  return tables.data;
};

const refreshSupabaseEntity = async (
  customerId,
  dbEntities,
  fetchedEntities,
  isEntitySame,
  tableName
) => {
  const entitiesToUpsert = fetchedEntities.map((entity) => {
    const id = dbEntities.find((dbEntity) =>
      isEntitySame(dbEntity, entity)
    )?.id;
    const res = {
      ...entity,
      customer_id: customerId,
    };
    if (id) res.id = id;
    return res;
  });

  const entitiesToDelete = dbEntities
    .filter(
      (dbEntity) =>
        !fetchedEntities.some((entity) => isEntitySame(dbEntity, entity))
    )
    .map((entity) => entity.id);

  await Promise.all([
    serverSupabase.from(tableName).upsert(entitiesToUpsert).select(),
    serverSupabase.from(tableName).delete().in("id", entitiesToDelete),
  ]);
};

export const refreshSupabaseProjects = async (customerId, fetchedProjects) => {
  return await refreshSupabaseEntity(
    customerId,
    await listDbSupabaseProjects(customerId),
    fetchedProjects,
    (dbProject, fetchedProject) =>
      dbProject.remote_id === fetchedProject.remote_id,
    "supabase_projects"
  );
};

export const refreshSupabaseUsers = async (
  accessToken,
  customerId,
  fetchedProjects
) => {
  return await refreshSupabaseEntity(
    customerId,
    await listDbSupabaseUsers(customerId),
    await fetchAllSupabaseUsers(accessToken, fetchedProjects),
    (dbUser, fetchedUser) =>
      dbUser.remote_id === fetchedUser.remote_id &&
      dbUser.project_name === fetchedUser.project_name,
    "supabase_users"
  );
};

export const refreshSupabaseTables = async (
  accessToken,
  customerId,
  fetchedProjects
) => {
  return await refreshSupabaseEntity(
    customerId,
    await listDbSupabaseTables(customerId),
    await fetchAllSupabaseTables(accessToken, fetchedProjects),
    (dbTable, fetchedTable) =>
      dbTable.name === fetchedTable.name &&
      dbTable.project_name === fetchedTable.project_name,
    "supabase_tables"
  );
};

export const refreshSupabaseData = async (customerId) => {
  const accessToken = await getSupabaseAccessToken(customerId);
  const fetchedProjects = await fetchSupabaseProjects(accessToken);
  await refreshSupabaseProjects(customerId, fetchedProjects);
  await refreshSupabaseUsers(accessToken, customerId, fetchedProjects);
  await refreshSupabaseTables(accessToken, customerId, fetchedProjects);
};

export const collectEvidence = async (customerId) => {
  const dbSupabaseProjects = await listDbSupabaseProjects(customerId);
  const dbSupabaseUsers = await listDbSupabaseUsers(customerId);
  const dbSupabaseTables = await listDbSupabaseTables(customerId);

  const evidences = [
    {
      check_type: CHECK_TYPES.PROJECT_PITR_ENABLED,
      snapshot: {
        info: `Total Projects: ${
          dbSupabaseProjects.length
        } | Projects with PITR enabled: ${
          dbSupabaseProjects.filter((project) => project.pitr_enabled).length
        }`,
        header: [
          ["name", "Name"],
          ["pitr_enabled", "PITR Enabled"],
        ],
        body: dbSupabaseProjects,
      },
      customer_id: customerId,
    },
    {
      check_type: CHECK_TYPES.USER_MFA_ENABLED,
      snapshot: {
        info: `Total Users: ${
          dbSupabaseUsers.length
        } | Users with MFA enabled: ${
          dbSupabaseUsers.filter((user) => user.mfa_enabled).length
        }`,
        header: [
          ["email", "Email"],
          ["phone", "Phone"],
          ["mfa_enabled", "MFA Enabled"],
        ],
        body: dbSupabaseUsers,
      },
      customer_id: customerId,
    },
    {
      check_type: CHECK_TYPES.TABLE_RLS_ENABLED,
      snapshot: {
        info: `Total Tables: ${
          dbSupabaseTables.length
        } | Tables with RLS enabled: ${
          dbSupabaseTables.filter((table) => table.rls_enabled).length
        }`,
        header: [
          ["name", "Name"],
          ["project_name", "Project Name"],
          ["rls_enabled", "RLS Enabled"],
        ],
        body: dbSupabaseTables,
      },
      customer_id: customerId,
    },
  ];

  await serverSupabase.from("evidences").insert(evidences);
};
