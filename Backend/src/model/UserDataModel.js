import { pool } from "../config/database.js";

export const createUser = async ({ fullName, emailId, password }) => {
  try {
    let sql = `INSERT INTO "user_data" (
    full_name,
    email_id,
    password
    ) values (
     $1, $2, $3)`;

    const values = [fullName, emailId, password];
    const response = await pool.query(sql, values);
    if (response.rowCount === 1) {
      console.log("User Created Successfully");
    }
    return response.rows;
  } catch (error) {
    console.log("Error in Inerting User data", error);
    throw error;
  }
};

export const getUserByEmailId = async (emailId) => {
  try {
    let sql = `SELECT * FROM "user_data" 
              WHERE email_id = $1`;

    const values = [emailId];

    const response = await pool.query(sql, values);

    return response.rows;
  } catch (error) {
    console.log("error in Get User", error);
    throw error;
  }
};
