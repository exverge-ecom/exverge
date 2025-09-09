import dotenv from "dotenv";
dotenv.config();
import pg from "pg";
// import process from "process";
// import fs from 'fs'
const { Pool } = pg;

// console.log("env keys:", Object.keys(process.env));
// console.log("DB_USER:", process.env.DB_USER);

//database connection
const dbConnect = new Pool({
  host: "oms-dashboard.postgres.database.azure.com",
  user: "exverge",
  password: "Development@22",
  database: "UniwareDB",
  port: 5432,
  ssl: { rejectUnauthorized: false },  




  // host: "localhost",
  // user: "postgres",
  // port: 5432,
  // password: "Shriyam@20",
  // database: "UniwareDB"

 

  // host: process.env.DB_HOST,
  // user: process.env.DB_USER,
  // password: process.env.DB_PASSWORD,
  // database: process.env.DB_NAME,
  // port: parseInt(process.env.DB_PORT),
  // ssl: { rejectUnauthorized: false }
});

dbConnect.on("error", (err) => {
  console.log("Unexpected error", err);
});

export default dbConnect;
