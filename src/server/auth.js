import { serverSupabase } from "./utils.js";

export const authenticateUser = async (req, res, next) => {
  const NOT_AUTHORIZED = "Not Authorized";
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: NOT_AUTHORIZED });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: NOT_AUTHORIZED });
  }

  // Get the authenticated user's ID
  const {
    data: { user },
    error: authError,
  } = await serverSupabase.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: NOT_AUTHORIZED });
  }

  req.user = user;
  next();
};
