// import dbConnect from "../config/database.js";
import { pool } from "../config/database.js"
import { getToken } from "../middleware/authToken.js";
import {
  searchReturnItemURL,
  getReturnItemURL,
} from "../constants/constURL.js";
// import { application } from "express";

async function responseSearchReturnsHandler(accessToken) {
  const now = new Date();
  const toDate = now.toISOString();
  const fromDateObj = new Date(now);
  fromDateObj.setDate(now.getDate() - 30);
  const fromDate = fromDateObj.toISOString();

  const responseSearchReturns = await fetch(searchReturnItemURL, {
    method: "POST",
    headers: {
      Authorization: `bearer ${accessToken}`,
      "Content-type": "application/json",
      Facility: "GMT_KH",
    },
    body: JSON.stringify({
      returnType: "CIR",
      statusCode: "CREATED",
      forwardItemFacility: "GMT_KH",
      createdTo: toDate,
      createdFrom: fromDate,
    }),
  });

  if (!responseSearchReturns.ok) {
    throw new Error(
      "Response-status" + responseSearchReturns.status,
      responseSearchReturns.message
    );
  }

  const searchReturnsData = await responseSearchReturns.json();

  //  console.log(searchReturnsData);
  return searchReturnsData;
}

function passedReturnsDataArray(searchReturnsData) {
  let searchReturnCodeArray;
  if (searchReturnsData.successful == true) {
    searchReturnCodeArray = searchReturnsData.returnOrders.map(
      (item) => item.code
    );

    // console.log(searchReturnCodeArray);
  }

  return searchReturnCodeArray;
}

async function fetchReturnDataArrays(
  accessToken,
  getReturnItemURL,
  listOfPassedSearchReturnsCodeArrays,
  batchSize
) {
  let results = [];
  //   console.log(listOfPassedSearchReturnsCodeArrays);

  for (
    let i = 0;
    i < listOfPassedSearchReturnsCodeArrays.length;
    i += batchSize
  ) {
    const batch = listOfPassedSearchReturnsCodeArrays.slice(i, i + batchSize);
    // console.log(batch);

    const fetchPromises = batch.map((code) =>
      fetch(getReturnItemURL, {
        method: "POST",
        headers: {
          Authorization: ` bearer ${accessToken}`,
          "Content-Type": "application/json",
          Facility: "GMT_KH",
        },
        body: JSON.stringify({
          reversePickupCode: code,
        }),
      }).then(async (res) => {
        const data = await res.json().catch(() => null);
        return data;
      })
    );

    const batchResults = await Promise.all(fetchPromises);
    results = results.concat(batchResults);
  }
  //   console.log(results);
  const passedGetReturnData = results.filter((data) => data.successful == true);

  return passedGetReturnData;
}

async function fetchAndUpsertAllReturnsItems() {
  let client;
  try {
    const accessToken = await getToken();
    const searchReturnsData = await responseSearchReturnsHandler(accessToken);
    const listOfPassedSearchReturnsCodeArrays = await passedReturnsDataArray(
      searchReturnsData
    );

    // console.log(listOfPassedSearchReturnsCodeArrays);

    const passedGetReturnData = await fetchReturnDataArrays(
      accessToken,
      getReturnItemURL,
      listOfPassedSearchReturnsCodeArrays,
      10
    );
    //   console.log(passedGetReturnData);

    client = await pool.connect();
    await client.query("BEGIN");

    //Return sale order items progress query

    const returnSaleOrderItemsProgressQuery = `INSERT INTO "return_sale_order_items_history" (
    sale_order_item_code,
    sale_order_items_status,
    courier_status,
    tracking_status
    ) values (
    $1, $2, $3, $4
    ) ON CONFLICT(sale_order_item_code, sale_order_items_status, courier_status, tracking_status) DO NOTHING`;


    // Return sale Order value progress query

    const returnSaleOrderValueProgressQuery = `INSERT INTO "return_sale_order_value_history" (
    sale_order_code,
    return_status
    )values (
    $1, $2
    ) ON CONFLICT ( sale_order_code, return_status)  DO NOTHING`;





    //returnSaleOrderItems Query

    const returnSaleOrderItemsQuery = `INSERT INTO "return_sale_order_items"(
sku_code,
sale_order_item_code,
sale_order_items_status,
channel_product_id,
shipment_code,
sale_order_code,
forward_item_facility,
reverse_pickup_code,
inventory_type,
market_place_return_reason,
item_name,
courier_status,
tracking_status,
return_remarks
) VALUES(
$1, $2, $3,
$4, $5, $6, 
$7, $8, $9, 
$10, $11, $12, 
$13, $14
) ON CONFLICT(sale_order_item_code) DO UPDATE SET
sku_code = EXCLUDED.sku_code,
sale_order_item_code= EXCLUDED.sale_order_item_code,
sale_order_items_status = EXCLUDED.sale_order_items_status,
channel_product_id= EXCLUDED.channel_product_id,
shipment_code= EXCLUDED.shipment_code,
sale_order_code= EXCLUDED.sale_order_code,
forward_item_facility= EXCLUDED.forward_item_facility,
reverse_pickup_code= EXCLUDED.reverse_pickup_code,
inventory_type= EXCLUDED.inventory_type,
market_place_return_reason= EXCLUDED.market_place_return_reason,
item_name= EXCLUDED.item_name,
courier_status= EXCLUDED.courier_status,
tracking_status= EXCLUDED.tracking_status,
return_remarks= EXCLUDED.return_remarks`;

    const returnSaleOrderValueQuery = ` INSERT INTO "return_sale_order_value"(
 sale_order_code,
 return_status,
 shipment_code,
 reverse_pickup_code,
 tracking_number,
 shipping_provider_code,
 courier_name,
 return_created_date,
 channel_return_created_date,
 return_delivery_date,
 rto_tracking_number,
 rto_shipping_provider_code,
 rto_courier_name,
 rto_reason,
 inventory_recieved_date,
 return_completed_date,
 return_invoice_code,
 putaway_code

)VALUES(

$1, $2, $3,
$4, $5, $6,
$7, $8, $9,
$10, $11, $12,
$13, $14, to_timestamp($15/ 1000.0),
to_timestamp($16 / 1000.0), $17, $18

) ON CONFLICT(sale_order_code) DO UPDATE SET
 sale_order_code= EXCLUDED.sale_order_code,
 return_status= EXCLUDED.return_status,
  shipment_code= EXCLUDED.shipment_code,
  reverse_pickup_code= EXCLUDED.reverse_pickup_code,
  tracking_number= EXCLUDED.tracking_number,
  shipping_provider_code= EXCLUDED.shipping_provider_code,
  courier_name= EXCLUDED.courier_name,
  return_created_date= EXCLUDED.return_created_date,
  channel_return_created_date= EXCLUDED.channel_return_created_date,
  return_delivery_date= EXCLUDED.return_delivery_date,
  rto_tracking_number= EXCLUDED.rto_tracking_number,
  rto_shipping_provider_code= EXCLUDED.rto_shipping_provider_code,
  rto_courier_name= EXCLUDED.rto_courier_name,
  rto_reason = EXCLUDED.rto_reason,
  inventory_recieved_date = EXCLUDED.inventory_recieved_date,
  return_completed_date = EXCLUDED.return_completed_date,
  return_invoice_code = EXCLUDED.return_invoice_code,
  putaway_code = EXCLUDED.putaway_code
  RETURNING sale_order_code;
`;

    const returnAddressDetailsListQuery = `INSERT INTO "return_address_details_list"(
    sale_order_code,
    name,
    address_line_1,
    address_line_2, 
    city,
    state,
    country,
    pincode,
    phone,
    email,
    latitude,
    longitude,
    type
    )VALUES(
    $1,$2,
    $3,$4,
    $5,$6,
    $7,$8,
    $9,$10,
    $11,$12,
    $13
    ) ON CONFLICT ( order_id ) DO UPDATE SET
     sale_order_code = EXCLUDED.sale_order_code,
     name = EXCLUDED.name,
     address_line_1 = EXCLUDED.address_line_1,
     address_line_2 = EXCLUDED.address_line_2,
     city = EXCLUDED.city,
     state = EXCLUDED.state,
     country=EXCLUDED.country,
    pincode=EXCLUDED.pincode,
    phone=EXCLUDED.phone,
    email=EXCLUDED.email,
    latitude=EXCLUDED.latitude,
    longitude=EXCLUDED.longitude,
    type=EXCLUDED.type
    ;`;

    for (const getReturnDataElement of passedGetReturnData) {
      // For table returnSaleOrderValue table
      const {
        saleOrderCode,
        returnStatus,
        shipmentCode,
        reversePickupCode,
        trackingNumber,
        shippingProviderCode,
        courierName,
        returnCreatedDate,
        channelReturnCreatedDate,
        returnDeliveryDate,
        rtoTrackingNumber,
        rtoShippingProviderCode,
        rtoCourierName,
        rtoReason,
        inventoryReceivedDate,
        returnCompletedDate,
        returnInvoiceCode,
        putawayCode,
      } = getReturnDataElement.returnSaleOrderValue;

      // Convert date strings to integer timestamps (milliseconds since epoch)

      const returnSaleOrderValueValues = [
        saleOrderCode,
        returnStatus,
        shipmentCode,
        reversePickupCode || null,
        trackingNumber,
        shippingProviderCode,
        courierName || null,
        returnCreatedDate,
        channelReturnCreatedDate,
        returnDeliveryDate || null,
        rtoTrackingNumber,
        rtoShippingProviderCode,
        rtoCourierName || null,
        rtoReason || null,
        inventoryReceivedDate || null,
        returnCompletedDate || null,
        returnInvoiceCode || null,
        putawayCode || null,
      ];

      const returnSaleOrderValueProgressValues = [
        saleOrderCode,
        returnStatus
      ];

      try {
        const responseReturnSaleOrderValue = await client.query(
          returnSaleOrderValueQuery,
          returnSaleOrderValueValues
        );
        //   console.log(responseReturnSaleOrderValue);

       

        const returningSaleOrderCode =
          responseReturnSaleOrderValue.rows[0].sale_order_code;

        if (responseReturnSaleOrderValue.rowCount !== 1) {
          throw new Error("returnSaleOrderValue Insertion Failed");
        }



        //Inserting return sale order value in history table
         const responseReturnSaleOrderValueProgress = await client.query(
          returnSaleOrderValueProgressQuery,
          returnSaleOrderValueProgressValues
        );

        // if (responseReturnSaleOrderValueProgress.rowCount === 1) {
        //   console.log("New Entry inserted in Return sale order Value progress");
        // } else {
        //   console.log("Duplicate entries ignored in Return sale order Value progress");
        // }

        for (const returnSaleOrderItemsElement of getReturnDataElement.returnSaleOrderItems) {
          const returnSaleOrderItemsElementValues = [
            returnSaleOrderItemsElement?.skuCode,
            returnSaleOrderItemsElement?.saleOrderItemCode,
            returnSaleOrderItemsElement?.saleOrderItemStatus,
            returnSaleOrderItemsElement?.channelProductId,
            returnSaleOrderItemsElement?.shipmentCode,
            returningSaleOrderCode,
            //   returnSaleOrderItemsElement?.saleOrderCode,
            returnSaleOrderItemsElement?.forwardItemFacility,
            returnSaleOrderItemsElement?.reversePickupCode || null,
            returnSaleOrderItemsElement?.inventoryType || null,
            returnSaleOrderItemsElement?.marketplaceReturnReason,
            returnSaleOrderItemsElement?.itemName,
            returnSaleOrderItemsElement?.courierStatus,
            returnSaleOrderItemsElement?.trackingStatus,
            returnSaleOrderItemsElement?.returnRemarks || null,
          ];
          //  console.log(returnSaleOrderItemsElement);

            const returnSaleOrderItemsValues = [
            returnSaleOrderItemsElement?.saleOrderItemCode,
            returnSaleOrderItemsElement?.saleOrderItemStatus,
            returnSaleOrderItemsElement?.courierStatus,
            returnSaleOrderItemsElement?.trackingStatus
            ]

       

          try {
            const responseReturnSaleOrderItems = await client.query(
              returnSaleOrderItemsQuery,
              returnSaleOrderItemsElementValues
            );
            // console.log(responseReturnSaleOrderItems);

            if (responseReturnSaleOrderItems.rowCount !== 1) {
              throw new Error("returnSaleOrderItems Insertion Failed");
            }

               const responseReturnSaleOrderItemsProgress = await client.query(
            returnSaleOrderItemsProgressQuery,
            returnSaleOrderItemsValues
          );
              
        //   if (responseReturnSaleOrderItemsProgress.rowCount === 1) {
        //   console.log("New Entry inserted in Return sale order Items progress");
        // } else {
        //   console.log("Duplicate entries ignored in Return sale order Items progress");
        // }

          } catch (err) {
            console.error("Error inserting into return_sale_order_items", {
              saleOrderItemCode: returnSaleOrderItemsElement?.saleOrderItemCode,
              values: returnSaleOrderItemsElementValues,
              error: err.message,
              stack: err.stack,
            });
            throw err;
          }
        }

        // Query for return_address_details_list

        for (const returnAddressDetailsListElement of getReturnDataElement.returnAddressDetailsList) {
          const returnAddressDetailsListElementValue = [
            returningSaleOrderCode,
            returnAddressDetailsListElement?.name || "********",
            returnAddressDetailsListElement?.addressLine1 || "********",
            returnAddressDetailsListElement?.addressLine2 || "********",
            returnAddressDetailsListElement?.city,
            returnAddressDetailsListElement?.state,
            returnAddressDetailsListElement?.country,
            returnAddressDetailsListElement?.pincode,
            returnAddressDetailsListElement?.phone || "********",
            returnAddressDetailsListElement?.email || null,
            returnAddressDetailsListElement?.latitude || null,
            returnAddressDetailsListElement?.longitude || null,
            returnAddressDetailsListElement?.type,
          ];

          try {
            const responseReturnAddressDetailsList = await client.query(
              returnAddressDetailsListQuery,
              returnAddressDetailsListElementValue
            );

            if (responseReturnAddressDetailsList.rowCount !== 1) {
              throw new Error("returnAddressDetailsList Insertion Failed");
            }
          } catch (err) {
            console.error("Error inserting into return_address_details_list", {
              saleOrderCode: returningSaleOrderCode,
              values: returnAddressDetailsListElementValue,
              error: err.message,
              stack: err.stack,
            });
            throw err;
          }
        }
      } catch (err) {
        console.error("Error inserting into return_sale_order_value", {
          saleOrderCode,
          values: returnSaleOrderValueValues,
          error: err.message,
          stack: err.stack,
        });
        throw err;
      }
      //   const returnAddressDetailsListValues = [];
    }
    await client.query("COMMIT");
    console.log(" Return Table Data inserted Succesfully");
  } catch (error) {
    if (client) client.query("ROLLBACK");
    console.log("Error is :- " + error.message, error.status, error);
  } finally {
    if (client) client.release();
  }
}

async function refreshReturnSaleOrder() {
  console.log("Refreshing Return Sale Order");
  try {
    await fetchAndUpsertAllReturnsItems();
    console.log("Return Order Refreshed Succesfully");
  } catch (e) {
    console.error("Return Order Refresh Failed");
    console.error(e);
    throw e;
  }
}

export default refreshReturnSaleOrder;
