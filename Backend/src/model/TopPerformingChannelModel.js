import { pool } from "../config/database.js";

export const getTopPerformingChannels = async ({ from, to }) => {
  try {
    console.log("DEBUG: from =", from, "to =", to);

    const sql = ` SELECT
  channel,
  COUNT(DISTINCT order_id) AS total_orders
  FROM sales_order
  WHERE  created > $1
  AND created < $2
  GROUP BY channel
  ORDER BY total_orders DESC;`;

  const values = [from, to];

  console.log("DEBUG: Total Top Performing Channel Final SQL =", sql);
  console.log("DEBUG: Query values =", values);

   const { rows } = await pool.query(sql, values);
    console.log("DEBUG: Query result rows =", rows);
    return rows;
  } catch (error) {
     console.error("error at getting Top selling Products", error);
     throw error;
  }
};
