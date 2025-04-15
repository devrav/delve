import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { serverSupabase, encryptToken } from "./utils.js";
import { authenticateUser } from "./auth.js";
import { refreshSupabaseData, collectEvidence } from "./services.js";

const app = express();

app.use(helmet());
app.use(morgan("combined"));
app.use(cors());
app.use(express.json());

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

app.get("/api/supabase/is_integrated", authenticateUser, async (req, res) => {
  const { data, error } = await serverSupabase
    .from("supabase_integrations")
    .select("*")
    .eq("customer_id", req.user.id);
  res.json(data.length > 0);
});

app.post("/api/supabase/integrate", authenticateUser, async (req, res) => {
  const { supabaseAccessToken } = req.body;
  const customerId = req.user.id;
  const encryptedToken = encryptToken(supabaseAccessToken);
  await serverSupabase.from("supabase_integrations").upsert({
    token: encryptedToken,
    customer_id: customerId,
    updated_at: new Date(),
  });
  await refreshSupabaseData(customerId);
  res.json({ message: "Supabase integrated successfully" });
});

app.post("/api/supabase/refresh", authenticateUser, async (req, res) => {
  const customerId = req.user.id;
  await refreshSupabaseData(customerId);
  res.json({ message: "Supabase refreshed successfully" });
});

app.get("/api/supabase/projects", authenticateUser, async (req, res) => {
  const { data } = await serverSupabase
    .from("supabase_projects")
    .select("*")
    .eq("customer_id", req.user.id);
  res.json(data);
});

app.get("/api/supabase/users", authenticateUser, async (req, res) => {
  const { data } = await serverSupabase
    .from("supabase_users")
    .select("*")
    .eq("customer_id", req.user.id);
  res.json(data);
});

app.get("/api/supabase/tables", authenticateUser, async (req, res) => {
  const { data } = await serverSupabase
    .from("supabase_tables")
    .select("*")
    .eq("customer_id", req.user.id);
  res.json(data);
});

app.post(
  "/api/supabase/evidence/collect",
  authenticateUser,
  async (req, res) => {
    const customerId = req.user.id;
    await refreshSupabaseData(customerId);
    await collectEvidence(customerId);
    res.json({ message: "Evidence collected successfully" });
  }
);

app.get(
  "/api/supabase/evidence/:check/:timestamp",
  authenticateUser,
  async (req, res) => {
    const { check, timestamp } = req.params;
    const { data } = await serverSupabase
      .from("evidences")
      .select("created_at")
      .eq("customer_id", req.user.id)
      .eq("check_type", check);
    if (!data.length) {
      return res.json({ snapshot: null, timestamps: null });
    }
    const evidenceTimestamps = data.map((evidence) => evidence.created_at);
    let filterTimestamp = timestamp;
    if (!timestamp || !evidenceTimestamps.includes(timestamp)) {
      filterTimestamp = evidenceTimestamps[evidenceTimestamps.length - 1];
    }
    const { data: evidenceData } = await serverSupabase
      .from("evidences")
      .select("snapshot")
      .eq("customer_id", req.user.id)
      .eq("check_type", check)
      .eq("created_at", filterTimestamp);
    res.json({
      snapshot: evidenceData[0].snapshot,
      timestamps: evidenceTimestamps,
      timestamp: filterTimestamp,
    });
  }
);

app.post("/api/supabase/remove", authenticateUser, async (req, res) => {
  const customerId = req.user.id;
  for (const tableName of [
    "supabase_integrations",
    "supabase_projects",
    "supabase_users",
    "supabase_tables",
  ]) {
    await serverSupabase.from(tableName).delete().eq("customer_id", customerId);
  }

  res.json({ message: "Supabase integration removed successfully" });
});

const PORT = process.env.SERVER_PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
