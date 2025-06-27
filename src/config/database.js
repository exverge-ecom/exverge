import dotenv from "dotenv";
dotenv.config();
import pg from "pg";
import process from "process";
const { Pool } = pg;

// console.log("env keys:", Object.keys(process.env));
// console.log("DB_USER:", process.env.DB_USER);

//database connection
const dbConnect = new Pool({
  host: process.env.DB_HOST || "",
  user: process.env.DB_USER || "",
  port: process.env.DB_PORT || "",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || ""
});

dbConnect.on("error", (err) => {
  console.log("Unexpected error", err);
});

export default dbConnect;
