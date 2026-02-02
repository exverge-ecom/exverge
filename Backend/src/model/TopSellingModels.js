import  { pool } from '../config/database.js'

export const getTopSellingProducts = async ({from, to}) =>{
    try {
    console.log("DEBUG: from =", from, "to =", to);

   const sql = ` SELECT
  soi.item_sku, soi.item_name,
  COUNT(*) AS number_of_items
  FROM sales_order so
  JOIN sale_order_items soi
  ON so.order_id = soi.order_id
  WHERE so.created >= $1
  AND so.created <=  $2
  GROUP BY soi.item_sku, soi.item_name
  ORDER BY number_of_items DESC
  LIMIT 10;`

  const values = [from, to];

  console.log("DEBUG: Total Top Selling Products Final SQL =", sql);
    console.log("DEBUG: Query values =", values);

    const { rows } = await pool.query(sql, values);
    console.log("DEBUG: Query result rows =", rows);
    return rows;

    } catch (error) {
          console.error("error at getting Top selling Products", error);
          throw error;
    }
}