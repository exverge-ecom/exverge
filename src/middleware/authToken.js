import { authURL } from "../constants/constURL.js";

async function authToken(req, res, next) {
  try {
    const accessToken = await getToken();
    req.accessToken = accessToken;
    next();
  } catch (error) {
    res.json({ error: "Authentication Failed" }, error);
  }
}

export async function getToken() {
  const responseAuth = await fetch(authURL, { method: "GET" });

  if (!responseAuth.ok) throw new Error("Token fetch failed");
  const data = await responseAuth.json();

  return data.access_token;
}

export default authToken;
