import dotenv from "dotenv";
dotenv.config();
import pg from "pg";
// import process from "process";
// import fs from 'fs'
const { Pool } = pg;

// console.log("env keys:", Object.keys(process.env));
// console.log("DB_USER:", process.env.DB_USER);

//database connection
const config = {
  host: "localhost",
  user: "postgres",
  port: 5432,
  password: "Shriyam@20",
  database: "UniwareDB"

  // host: "oms-dashboard.postgres.database.azure.com",
  // user: "exverge",
  // password: "Development@22",
  // database: "UniwareDB",
  // port: 5432,
  // ssl: { rejectUnauthorized: false },  

   
 







 

  // host: process.env.DB_HOST,
  // user: process.env.DB_USER,
  // password: process.env.DB_PASSWORD,
  // database: process.env.DB_NAME,
  // port: parseInt(process.env.DB_PORT),
  // ssl: { rejectUnauthorized: false }

};



const pool = new Pool(config);

pool.on("error", (err) => {
  console.log("Unexpected error", err);
});


const dbConnect = async () => {
  try {
    const client = await pool.connect();
    console.log("🐘 Connected to PostgreSQL -", process.env.PG_DB_NAME);

    // Test query
    const result = await client.query("SELECT NOW()");
    console.log("Database time:", result.rows[0]);

    client.release(); // release connection back to pool
  } catch (err) {
    console.error("❌ PostgreSQL connection error:", {
      message: err.message,
      code: err.code,
    });
    process.exit(1);
  }
};


export { pool, dbConnect };

// export default dbConnect;
