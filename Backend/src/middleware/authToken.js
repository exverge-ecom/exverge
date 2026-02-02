import { authURL } from "../constants/constURL.js";

async function authToken(req, res, next) {
  try {
    const accessToken = await getToken();
    req.accessToken = accessToken;
    // console.log(accessToken);
    
    next();
  } catch (error) {
    res.json({ error: "Authentication Failed" }, error);
  }
}

export async function getToken() {
  const responseAuth = await fetch(authURL, { method: "GET" });

  if (!responseAuth.ok) throw new Error("Token fetch failed");
  const data = await responseAuth.json();
  console.log(data.access_token);
  
  return data.access_token;
}

export default authToken;
