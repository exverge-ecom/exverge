import dotenv from "dotenv";
dotenv.config({ path: "../../.env" });
import pg from "pg";
const { Pool } = pg;
import process from "process";

// console.log("env keys:", Object.keys(process.env));
// console.log("DB_USER:", process.env.DB_USER);

//database connection
const dbConnect = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  port: process.env.DB_PORT,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

export async function dbConnectionHandler() {
  const client = await dbConnect.connect();

  dbConnect.on("error", (err) => {
    console.error("Unexpected error in DB connection", err);
  });

  return client;
}
