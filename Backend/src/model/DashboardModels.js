import { pool } from "../config/database.js";

export const getOrderTrend = async ({
  from,
  to,
  warehouseIdentifier,
  channels,
  brand,
}) => {
  try {
    console.log("DEBUG: from =", from, "to =", to);

let sql = `
  SELECT
    to_char(so.created, 'YYYY-MM-DD') AS date,
    COUNT(DISTINCT so.order_id) AS total_orders
  FROM sales_order so
  JOIN sale_order_items soi
    ON so.order_id = soi.order_id
  WHERE so.created >= $1
    AND so.created <= $2
    AND so.status = $3
`;


const values = [from, to, "COMPLETE"];
let index = 4;

if (warehouseIdentifier) {
  sql += ` AND so.warehouse_identifier = $${index}`;
  values.push(warehouseIdentifier);
  index++;
}

if (channels && channels.length > 0) {
  const placeholders = channels.map(() => `$${index++}`).join(", ");
  sql += ` AND so.channel IN (${placeholders})`;
  values.push(...channels);
}

if (brand) {
  sql += ` AND soi.brand = $${index}`;
  values.push(brand);
  index++;
}

sql += `
  GROUP BY to_char(so.created, 'YYYY-MM-DD')
  ORDER BY date;
`;


    console.log("DEBUG: Total Orders Final SQL =", sql);
    console.log("DEBUG: Query values =", values);

    const { rows } = await pool.query(sql, values);
    console.log("DEBUG: Query result rows =", rows);
    return rows;
  } catch (error) {
    console.error("error at get order trend", error);
    throw error;
  }
};

export const getRevenueTrend = async ({
  from,
  to,
  warehouseIdentifier,
  channels,
  brand
}) => {
  try {
    const startDate = `${from}`;
    const endDate = `${to}`;

    let netRevenueQuery = `
  SELECT
    COALESCE(SUM(soi.selling_price), 0)
    -
    COALESCE(SUM(rsoi_price.selling_price), 0)
    AS net_revenue
  FROM sales_order so
  JOIN sale_order_items soi
    ON so.order_id = soi.order_id

  -- join returned items to get their prices
  LEFT JOIN return_sale_order_items rsoi
    ON rsoi.sale_order_item_code = soi.code

  LEFT JOIN sale_order_items rsoi_price
    ON rsoi_price.code = rsoi.sale_order_item_code

  WHERE so.created >= $1
    AND so.created < $2
`;

    const values = [startDate, endDate];
    let paramIndex = 3;

    if (warehouseIdentifier) {
      netRevenueQuery += ` AND so.warehouse_identifier = $${paramIndex}`;
      values.push(warehouseIdentifier);
      paramIndex++;
    }

    if (channels && channels.length > 0) {
      const placeholders = channels.map(() => `$${paramIndex++}`).join(", ");
      netRevenueQuery += ` AND channel IN (${placeholders})`;
      values.push(...channels);
      // paramIndex++;
    }

    if (brand) {
      netRevenueQuery += `AND brand = $${paramIndex}`;
      values.push(brand);
    }

    console.log("DEBUG: Revenue Final SQL =", netRevenueQuery);
    console.log("DEBUG: Query values =", values);

    const { rows } = await pool.query(netRevenueQuery, values);
    console.log("DEBUG: Query result rows =", rows);
    return rows;
  } catch (error) {
    console.error("Error at get Revenue Trend", error);
    throw error;
  }
};               


