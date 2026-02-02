// import express from "express";
// import dbConnect from "../config/database.js";
// const pool = require("../config/database.js");
import { pool } from "../config/database.js";
import { getToken } from "../middleware/authToken.js";
import {
  getSalesURL,
  searchItemURL,
  searchSalesURL,
} from "../constants/constURL.js";
// const router = express.Router();

async function responseSearchSalesHandler(accessToken) {
  //To filter the data by using date. Here, 15 day time interval is taken.
  const now = new Date();
  const toDate = now.toISOString();
  const fromDateObj = new Date(now);
  fromDateObj.setDate(now.getDate() - 30);
  const fromDate = fromDateObj.toISOString();
  const responseSearchSales = await fetch(searchSalesURL, {
    method: "POST",
    headers: {
      Authorization: `bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fromDate: fromDate,
      toDate: toDate,
      dateType: "CREATED",
      facilityCodes: ["GMT_KH", "exverge"],
    }),
  });

  if (!responseSearchSales.ok) {
    throw new Error(
      "Response Status : " + responseSearchSales.status,
      responseSearchSales.message
    );
  }

  const searchSalesData = await responseSearchSales.json();
  // console.log(searchSalesData);

  return searchSalesData;
}

async function fetchOrdersDataInBatches(
  accessToken,
  getSalesOrSearchItemsURL,
  codesORItemSkuList,
  batchSize,
  bodybuilder
) {
  let results = [];
  for (let i = 0; i < codesORItemSkuList.length; i += batchSize) {
    const batch = codesORItemSkuList.slice(i, i + batchSize);

    const fetchPromises = batch.map((code) =>
      //  Here code is using for mapping the array elements
      fetch( getSalesOrSearchItemsURL, {
        method: "POST",
        headers: {
          Authorization: `bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodybuilder(code)),
        signal: AbortSignal.timeout(10000),
      }).then(async (res) => {
        const data = await res.json().catch(() => null);
        return data;
      })
    );

    const batchResults = await Promise.all(fetchPromises);
    results = results.concat(batchResults);
  }
  // console.log(results);

  const passedOrdersDataOrSearchItemsArray = results.filter(
    (data) => data.successful === true
  );

  return passedOrdersDataOrSearchItemsArray;
}

async function fetchAndUpsertAllSaleOrders() {
  let client;

  try {
    const accessToken = await getToken();
    const searchSalesData = await responseSearchSalesHandler(accessToken);

    const listOfCode = searchSalesData.elements.map((val) => val.code);

    // console.log(listOfCode);

    // Batching for large numbers of API calls

    const passedOrdersDataArray = await fetchOrdersDataInBatches(
      accessToken,
      getSalesURL,
      listOfCode,
      10,
      (code) => ({
        code: code,
        facilityCodes: ["GMT_KH", "exverge"],
      })
    );

    // console.log(passedOrdersDataArray);

    // Connecting Database

    // Query for SalesOrder

    const saleOrder = passedOrdersDataArray.map((data) => data.saleOrderDTO);
    // console.log("sale Order" + saleOrder.length);

    // Build a complete mapping of item codes and SKUs with their category codes
    const allItemsWithOrder = [];
    saleOrder.forEach((order) => {
      if (order.saleOrderItems && order.saleOrderItems.length > 0) {
        order.saleOrderItems.forEach((item) => {
          allItemsWithOrder.push({
            itemCode: item.code,
            itemSku: item.itemSku,
          });
        });
      }
    });

    const itemSkuList = allItemsWithOrder.map((item) => item.itemSku);

    // console.log(itemSkuList);

    const searchItemsArray = await fetchOrdersDataInBatches(
      accessToken,
      searchItemURL,
      itemSkuList,
      10,
      (code) => ({ productCode: code })
    );

    // Create a mapping from item code to category code
    const itemCodeToCategoryMap = {};
    allItemsWithOrder.forEach((item, index) => {
      if (
        searchItemsArray[index] &&
        searchItemsArray[index].elements &&
        searchItemsArray[index].elements.length > 0
      ) {
        itemCodeToCategoryMap[item.itemCode] =
          searchItemsArray[index].elements[0].categoryCode;
      } else {
        // If category not found, use null
        itemCodeToCategoryMap[item.itemCode] = null;
      }
    });

    // console.log(categoryCodeArray);

    // console.log(saleOrder);
    client = await pool.connect();

    await client.query("BEGIN");

    const saleOrderProgressQuery = `INSERT INTO "sales_order_history" (
     code,
     status
    ) values (
     $1, $2
     ) ON CONFLICT(code, status) DO NOTHING`;

    //      const saleOrderProgressQuery =`INSERT INTO "sales_order_history" (code, status)
    //          SELECT $1, $2
    //          WHERE NOT EXISTS (
    //     SELECT 1
    //     FROM "sales_order_history"
    //     WHERE code = $1
    //     ORDER BY logged_at DESC
    //     LIMIT 1
    //     HAVING status = $2
    // );`;

    const saleOrderItemsProgressQuery = `INSERT INTO "sale_order_items_history" (
     code,
     shipping_package_status,
     status_code
     ) values (
     $1, $2, $3
     ) ON CONFLICT(code, shipping_package_status, status_code) DO NOTHING`;

    //     const saleOrderItemsProgressQuery = `
    //   INSERT INTO "sale_order_items_history" (
    //     code,
    //     shipping_package_status,
    //     status_code
    //   )
    //   SELECT $1, $2, $3
    //   WHERE NOT EXISTS (
    //     SELECT 1
    //     FROM "sale_order_items_history"
    //     WHERE code = $1
    //     ORDER BY logged_at DESC
    //     LIMIT 1
    //     HAVING shipping_package_status = $2
    //       AND status_code = $3
    //   );
    // `;

    const shippingPackagespProgressQuery = `INSERT INTO "shipping_packages_history" (
     sale_order_code,
     status
     ) values ($1, $2) ON CONFLICT(sale_order_code, status) DO NOTHING`;

    // Query for sale_order table

    const saleOrderQuery = `INSERT INTO "sales_order" (

    warehouse_identifier,
    code,
    display_order_code,
    display_order_date_time,
    Channel,
    channel_processing_time,
    Status,
    Created,
    Updated,
    fulfillment_tat, 
    currency_code,
    customer_code,
    customer_name,
    customer_gstin,
    cash_on_delivery,
    payment_instrument,
    third_party_shipping,
    packet_number,
    tracking_number
    ) values (
      $1, $2, $3, to_timestamp($4 / 1000.0), $5,
      to_timestamp($6/ 1000.0), $7, to_timestamp($8 / 1000.0), to_timestamp($9 / 1000.0), to_timestamp($10/ 1000.0), 
      $11, $12, $13, $14, $15, 
      $16, $17, $18, $19
    ) 
    ON CONFLICT (code) DO UPDATE SET
    warehouse_identifier = EXCLUDED.warehouse_identifier,
    code = EXCLUDED.code,
    display_order_code = EXCLUDED.display_order_code,
    display_order_date_time = EXCLUDED.display_order_date_time,
    Channel = EXCLUDED.Channel,
    channel_processing_time = EXCLUDED.channel_processing_time,
    Status = EXCLUDED.Status,
    Created = EXCLUDED.Created,
    Updated = EXCLUDED.Updated,
    fulfillment_tat = EXCLUDED.fulfillment_tat,
    currency_code = EXCLUDED.currency_code,
    customer_code = EXCLUDED.customer_code,
    customer_name = EXCLUDED.customer_name,
    customer_gstin = EXCLUDED.customer_gstin,
    cash_on_delivery = EXCLUDED.cash_on_delivery,
    payment_instrument = EXCLUDED.payment_instrument,
    third_party_shipping = EXCLUDED.third_party_shipping,
    packet_number = EXCLUDED.packet_number,
    tracking_number = EXCLUDED.tracking_number
    RETURNING "order_id";`;

    // Query for sale_order_items table
    const saleOrderItemQuery = `INSERT INTO "sale_order_items" (
     order_id,
     code,
     shipping_package_code, 
     shipping_package_status,
     facility_code,
     facility_name,
     item_name,
     item_sku,
     seller_sku_code,
     sku_description,
     Category,
     channel_product_id,
     status_code,
     brand,
     shipping_method_code,
     packet_number,
     gift_wrap,
     currency_code,
     tax_exempted,
     fulfillment_tat,
     total_price,
     selling_price,
     prepaid_amount,
     Discount,
     shipping_charges,
     store_credit,
     gift_wrap_charges,
     cancellable
     ) VALUES ( 
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9, $10, 
      $11, $12, $13, $14,
      $15, $16, $17, $18, 
      $19, to_timestamp($20/ 1000.0), $21, $22, 
      $23, $24, $25, $26, 
      $27, $28
) ON CONFLICT ( code ) DO UPDATE SET
   
     code = EXCLUDED.code,
     shipping_package_code = EXCLUDED.shipping_package_code,
     shipping_package_status = EXCLUDED.shipping_package_status,
     facility_code = EXCLUDED.facility_code,
     facility_name = EXCLUDED.facility_name,
     item_name = EXCLUDED.item_name,
     item_sku = EXCLUDED.item_sku,
     seller_sku_code = EXCLUDED.seller_sku_code,
     sku_description = EXCLUDED.sku_description,
     Category = EXCLUDED.Category,
     channel_product_id = EXCLUDED.channel_product_id,
     status_code = EXCLUDED.status_code,
     brand = EXCLUDED.brand,
     shipping_method_code = EXCLUDED.shipping_method_code,
     packet_number = EXCLUDED.packet_number,
     gift_wrap = EXCLUDED.gift_wrap,
     currency_code = EXCLUDED.currency_code,
     tax_exempted = EXCLUDED.tax_exempted,
     fulfillment_tat = EXCLUDED.fulfillment_tat,
     total_price = EXCLUDED.total_price,
     selling_price = EXCLUDED.selling_price,
     prepaid_amount = EXCLUDED.prepaid_amount,
     Discount = EXCLUDED.Discount,
     shipping_charges = EXCLUDED.shipping_charges,
     store_credit = EXCLUDED.store_credit,
     gift_wrap_charges = EXCLUDED.gift_wrap_charges,
     Cancellable = EXCLUDED.Cancellable
`;

    // Query for Billing_address table
    const billingAddressQuery = `INSERT INTO "billing_address"(
     order_id,
     name,
     address_line_1,
     address_line_2,
     latitude,
     longitude,
     city,
     state,
     country,
     pincode,
     phone,
     email
    ) VALUES (
  $1, $2, $3, $4, 
  $5, $6, $7, $8, 
  $9, $10, $11, $12
    )   
    ON CONFLICT (order_id) DO UPDATE SET

    name = EXCLUDED.name,
    address_line_1 = EXCLUDED.address_line_1,
    address_line_2 = EXCLUDED.address_line_2,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    country = EXCLUDED.country,
    pincode = EXCLUDED.pincode,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email
`;

    //Query For shippingPackages
    const shippingPackagesQuery = `
      INSERT INTO "shipping_packages" (
      code, 
      sale_order_code, 
      channel, 
      status, 
      shipping_package_type,
      shipping_provider, 
      shipping_method, 
      estimated_weight, 
      actual_weight,
      customer, 
      created, 
      updated, 
      dispatched, 
      delivered,
      invoice, 
      invoice_code, 
      invoice_display_code, 
      no_of_items
    ) VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9,
      $10, to_timestamp($11 / 1000.0), to_timestamp($12 / 1000.0), to_timestamp($13/ 1000.0), to_timestamp($14/ 1000.0),
      $15, $16, $17, $18
    ) ON CONFLICT ( sale_order_code ) DO UPDATE SET
      code = EXCLUDED.code, 
      sale_order_code = EXCLUDED.sale_order_code, 
      channel = EXCLUDED.channel, 
      status = EXCLUDED.status, 
      shipping_package_type = EXCLUDED.shipping_package_type,
      shipping_provider= EXCLUDED.shipping_provider, 
      shipping_method= EXCLUDED.shipping_method, 
      estimated_weight= EXCLUDED.estimated_weight, 
      actual_weight= EXCLUDED.actual_weight,
      customer= EXCLUDED.customer, 
      created= EXCLUDED.created, 
      updated= EXCLUDED.updated, 
      dispatched= EXCLUDED.dispatched, 
      delivered= EXCLUDED.delivered,
      invoice= EXCLUDED.invoice, 
      invoice_code= EXCLUDED.invoice_code, 
      invoice_display_code= EXCLUDED.invoice_display_code, 
      no_of_items= EXCLUDED.no_of_items
   `;

    let index = 0;

    for (const saleOrderElement of saleOrder) {
      const saleOrderValues = [
        saleOrderElement?.saleOrderItems[0]?.facilityCode || null,
        saleOrderElement?.code,
        saleOrderElement?.displayOrderCode,
        saleOrderElement?.displayOrderDateTime,
        saleOrderElement?.channel || null,
        saleOrderElement?.channelProcessingTime,
        saleOrderElement?.status || null,
        saleOrderElement.created,
        saleOrderElement?.updated,
        saleOrderElement?.fulfillmentTat,
        saleOrderElement?.currencyCode || null,
        saleOrderElement?.customerCode || null,
        saleOrderElement?.customerName || null,
        saleOrderElement?.customerGSTIN || null,
        saleOrderElement?.cashOnDelivery || null,
        saleOrderElement?.paymentInstrument || null,
        saleOrderElement?.thirdPartyShipping || null,
        saleOrderElement?.packetNumber || null,
        saleOrderElement?.trackingNumber || null,
      ];

      const saleOrderProgressValues = [
        saleOrderElement?.code,
        saleOrderElement?.status || null,
      ];
      try {
        const responseSaleOrder = await client.query(
          saleOrderQuery,
          saleOrderValues
        );

        if (responseSaleOrder.rowCount !== 1) {
          throw new Error("Sale Order Insertion Failed");
        }

        const responseSaleOrderProgress = await client.query(
          saleOrderProgressQuery,
          saleOrderProgressValues
        );

        // After inserting the order, before the item loop:
        if (
          !saleOrderElement.saleOrderItems ||
          saleOrderElement.saleOrderItems.length === 0
        ) {
          console.warn(
            `Order ${saleOrderElement.code} has no items, skipping item insertion`
          );
          index++; // Increment before continuing to keep index aligned
          continue; // Skip to next order
        }

        const order_id = responseSaleOrder.rows[0].order_id;
        // console.log(`✓ Order inserted: ${saleOrderElement.code} (order_id: ${order_id})`);
        // console.log(`  Attempting to insert ${saleOrderElement.saleOrderItems.length} items...`);

        const { fulfillmentTat, currencyCode } = saleOrderElement;
        let itemsInsertedCount = 0;
        for (const saleOrderItemElements of saleOrderElement.saleOrderItems) {
          const {
            shippingPackageCode,
            shippingPackageStatus,
            facilityCode,
            facilityName,
            itemSku,
            itemName,
            sellerSkuCode,
            skudescription,
            channelProductId,
            statusCode,
            brand,
            shippingMethodCode,
            code,
            packetNumber,
            giftWrap,
            taxPercentage,
            totalPrice,
            sellingPrice,
            prepaidAmount,
            discount,
            shippingCharges,
            storeCredit,
            giftWrapCharges,
            cancellable,
          } = saleOrderItemElements;

          // Get category code from the mapping using item code
          const itemCategoryCode = itemCodeToCategoryMap[code];
          
          if (!itemCategoryCode) {
            console.warn(
              `⚠️  WARNING: No category code found for item ${code} (SKU: ${itemSku})`
            );
          }

          const saleOrderItemValues = [
            order_id,
            code,
            shippingPackageCode,
            shippingPackageStatus,
            facilityCode,
            facilityName,
            itemName,
            itemSku,
            sellerSkuCode,
            skudescription,
            itemCategoryCode,
            channelProductId,
            statusCode,
            brand,
            shippingMethodCode,
            packetNumber,
            giftWrap || null,
            currencyCode,
            taxPercentage,
            fulfillmentTat,
            totalPrice,
            sellingPrice,
            prepaidAmount,
            discount,
            shippingCharges,
            storeCredit,
            giftWrapCharges,
            cancellable,
          ];

          const saleOrderItemsProgressValues = [
            code,
            shippingPackageStatus,
            statusCode,
          ];
          try {
            const responseSaleOrderItem = await client.query(
              saleOrderItemQuery,
              saleOrderItemValues
            );
            if (!responseSaleOrderItem) {
              throw new Error("saleOrderItem Insertion Failed");
            }

            const responseSaleOrderItemsProgress = await client.query(
              saleOrderItemsProgressQuery,
              saleOrderItemsProgressValues
            );

            itemsInsertedCount++;
          } catch (err) {
            console.error(
              `❌ ERROR: Failed to insert item code="${code}" (SKU: ${itemSku}) for order "${saleOrderElement.code}"`,
              {
                order_id,
                itemCode: code,
                itemSku,
                categoryCode: itemCategoryCode,
                error: err.message,
                errorCode: err.code,
                errorDetail: err.detail,
              }
            );
            throw err;
          }
        }
        // console.log(`✓ Successfully inserted ${itemsInsertedCount}/${saleOrderElement.saleOrderItems.length} items for order ${saleOrderElement.code}`);

        index = index + 1;

        // Billing Address
        const {
          name,
          address_line_1,
          address_line_2,
          latitude,
          longitude,
          city,
          state,
          country,
          pincode,
          phone,
          email,
        } = saleOrderElement.billingAddress;
        const billingAddressValue = [
          order_id,
          name === "" || name === "********" ? null : name,
          address_line_1 === "" || address_line_1 === "********"
            ? null
            : address_line_1,
          address_line_2 === "" || address_line_2 === "********"
            ? null
            : address_line_2,
          latitude === "" || latitude === "********" ? null : latitude,
          longitude === "" || longitude === "********" ? null : longitude,
          city,
          state,
          country,
          pincode,
          phone === "" || phone === "********" ? null : phone,
          email === "" || email === "********" ? null : email,
        ];
        try {
          const responseBillingAddress = await client.query(
            billingAddressQuery,
            billingAddressValue
          );
          if (!responseBillingAddress) {
            throw new Error("Billing Address Insertion Failed");
          }
        } catch (err) {
          console.error(`Error in inserting billingAddress`, {
            values: billingAddressValue,
            error: err.message,
          });
          throw err;
        }

        // Shipping Packages
        const shippingPackages = saleOrderElement.shippingPackages;
        if (!Array.isArray(shippingPackages) || shippingPackages.length === 0) {
          continue;
        }
        const shippingPackagesObject = shippingPackages[0];
        const shippingPackagesValues = [
          shippingPackagesObject?.code || null,
          shippingPackagesObject?.saleOrderCode || null,
          shippingPackagesObject?.channel || null,
          shippingPackagesObject?.status || null,
          shippingPackagesObject?.shippingPackageType || null,
          shippingPackagesObject?.shippingProvider || null,
          shippingPackagesObject?.shippingMethod,
          shippingPackagesObject?.estimatedWeight,
          shippingPackagesObject?.actualWeight,
          shippingPackagesObject?.customer,
          shippingPackagesObject?.created,
          shippingPackagesObject?.updated,
          shippingPackagesObject?.dispatched,
          shippingPackagesObject?.delivered,
          shippingPackagesObject?.invoice,
          shippingPackagesObject?.invoiceCode || null,
          shippingPackagesObject?.invoiceDisplayCode || null,
          shippingPackagesObject?.noOfItems,
        ];

        const shippingPackagesProgressValues = [
          shippingPackagesObject?.saleOrderCode,
          shippingPackagesObject?.status,
        ];
        try {
          const responseShippingPackage = await client.query(
            shippingPackagesQuery,
            shippingPackagesValues
          );
          if (!responseShippingPackage) {
            throw new Error("Shipping Package Insertion Failed");
          }

          const responseShippingPackageProgress = await client.query(
            shippingPackagespProgressQuery,
            shippingPackagesProgressValues
          );

          // if (responseShippingPackageProgress.rowCount === 1) {
          //   console.log("New status inserted in shipping Packages progress");
          // } else {
          //   console.log("Duplicate status ignored in shipping Packages progress");
          // }
        } catch (err) {
          console.error(`Error in inserting ShippingPackages`, {
            values: shippingPackagesValues,
            error: err.message,
          });
          throw err;
        }
      } catch (err) {
        // Log which saleOrderElement failed
        console.error(
          `ERROR: Failed to process order "${saleOrderElement.code}"`,
          {
            orderCode: saleOrderElement.code,
            error: err.message,
            errorCode: err.code,
            errorDetail: err.detail,
          }
        );
        throw err;
      }
    }
    await client.query("COMMIT");
    console.log(" Sales Table Data inserted Succesfully");
  } catch (error) {
    if (client) client.query("ROLLBACK");
    console.log("Error is :- " + error.message, error.status, error);
    throw error;
  } finally {
    if (client) client.release();
  }
}
let a = 1;
async function findOrdersWithoutItems() {
  let client;
  try {
    client = await pool.connect();
    
    // Find orders in sales_order table but not in sale_order_items table
    const query = `
      SELECT 
        so.order_id,
        so.code,
        so.Status,
        so.created,
        COUNT(soi.order_id) as items_count
      FROM sales_order so
      LEFT JOIN sale_order_items soi ON so.order_id = soi.order_id
      GROUP BY so.order_id, so.code, so.Status, so.created
      HAVING COUNT(soi.order_id) = 0
      ORDER BY so.created DESC
      LIMIT 20;
    `;
    
    const result = await client.query(query);
    
    console.log("\n========== ORDERS WITHOUT ITEMS ==========");
    console.log(`Found ${result.rows.length} orders in sales_order table with NO items in sale_order_items table\n`);
    
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. Order Code: ${row.code}, Order ID: ${row.order_id}, Status: ${row.status}, Created: ${row.created}`);
    });
    
    console.log("\n==========================================\n");
    
    return result.rows;
  } catch (error) {
    console.error("Error checking for orphaned orders:", error.message);
    throw error;
  } finally {
    if (client) client.release();
  }
}

async function refreshSalesOrders() {
  console.log("Refreshing Sales orders");

  try {
    await fetchAndUpsertAllSaleOrders();
    console.log("Orders Refreshed Successfully");
    
    // After refresh, check for orphaned orders
    console.log("\nChecking for orders without items...");
    await findOrdersWithoutItems();
  } catch (e) {
    console.error("Orders Refreshing Failed");
    console.error(e);
    throw e; // rethrow so the route handler can catch it
  }
}

export { refreshSalesOrders as default, findOrdersWithoutItems };
