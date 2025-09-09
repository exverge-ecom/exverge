// import express from "express";
import dbConnect from "../config/database.js";
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
      fetch(getSalesOrSearchItemsURL, {
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

    const itemSkuList = passedOrdersDataArray.map(
      (data) => data.saleOrderDTO.saleOrderItems[0].itemSku
    );

    // console.log(itemSkuList);

    const searchItemsArray = await fetchOrdersDataInBatches(
      accessToken,
      searchItemURL,
      itemSkuList,
      10,
      (code) => ({ productCode: code })
    );

    const categoryCodeArray = searchItemsArray.map(
      (category) => category.elements[0].categoryCode
    );

    // console.log(categoryCodeArray);

    // console.log(saleOrder);
    client = await dbConnect.connect();
    await client.query("BEGIN");

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
      $6, $7, to_timestamp($8 / 1000.0), to_timestamp($9 / 1000.0), $10, 
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
     Code,
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
      $19, $20, $21, $22, 
      $23, $24, $25, $26, 
      $27, $28
) ON CONFLICT ( code ) DO UPDATE SET
     order_id = EXCLUDED.order_id,
     Code = EXCLUDED.Code,
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
    order_id = EXCLUDED.order_id,
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
      $10, to_timestamp($11 / 1000.0), to_timestamp($12 / 1000.0), $13, $14,
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
      const values = [
        saleOrderElement?.saleOrderItems[0]?.facilityCode || null,
        saleOrderElement?.code,
        saleOrderElement?.displayOrderCode,
        saleOrderElement?.displayOrderDateTime,
        saleOrderElement?.channel || null,
        new Date(saleOrderElement?.channelProcessingTime).toISOString() || null,
        saleOrderElement?.status || null,
        saleOrderElement.created,
        saleOrderElement?.updated,
        new Date(saleOrderElement?.fulfillmentTat).toISOString() || null,
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

      const responseSaleOrder = await client.query(saleOrderQuery, values);

      if (responseSaleOrder.rowCount !== 1) {
        throw new Error("SaleOrder Insertion Failed");
      }
      // console.log(responseSaleOrder);

      const order_id = responseSaleOrder.rows[0].order_id;

      //Query for saleOrderItems table.

      // console.log(saleOrderItem);

      const { fulfillmentTat, currencyCode } = saleOrderElement;
      // const saleOrderItemObject = saleOrderElement.saleOrderItems[0];

      for (const saleOrderItemElements of saleOrderElement.saleOrderItems) {
        // console.log(saleOrderItemObject);

        // const Id = saleOrderItemObject.id;

        const {
          shippingPackageCode,
          shippingPackageStatus,
          facilityCode,
          facilityName,
          itemSku,
          itemName,
          sellerSkuCode,
          skudescription,
          // category,
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
          categoryCodeArray[index],
          channelProductId,
          statusCode,
          brand,
          shippingMethodCode,
          packetNumber,
          giftWrap || null,
          currencyCode,
          taxPercentage,
          new Date(fulfillmentTat).toISOString() || null,
          totalPrice,
          sellingPrice,
          prepaidAmount,
          discount,
          shippingCharges,
          storeCredit,
          giftWrapCharges,
          cancellable,
        ];

        const responseSaleOrderItem = await client.query(
          saleOrderItemQuery,
          saleOrderItemValues
        );

        if (!responseSaleOrderItem) {
          throw new Error("saleOrderItem Insertion Failed");
        }
      }

      index = index + 1;

      //Inserting table data of billingAddress in Database

      // Insertion Query for billing address

      //Destructuring the Object for keys.
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
      // console.log(id);

      const value = [
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
      const responseBillingAddress = await client.query(
        billingAddressQuery,
        value
      );
      if (!responseBillingAddress) {
        throw new Error("Billing Address Insertion Failed");
      }
      // }

      // const sale_order_code = responseSaleOrder.rows[0].code;

      //Inserting shippingPackage Data into Database

      const shippingPackages = saleOrderElement.shippingPackages;

      if (!Array.isArray(shippingPackages) || shippingPackages.length === 0) {
        continue;
      }

      const shippingPackagesObject = shippingPackages[0];
      // console.log(shippingPackagesObject);

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
        shippingPackagesObject?.created || null,
        shippingPackagesObject?.updated || null,
        new Date(shippingPackagesObject?.dispatched).toISOString() || null,
        new Date(shippingPackagesObject?.delivered).toISOString() || null,
        shippingPackagesObject?.invoice,
        shippingPackagesObject?.invoiceCode || null,
        shippingPackagesObject?.invoiceDisplayCode || null,
        shippingPackagesObject?.noOfItems,
      ];

      const responseShippingPackage = await client.query(
        shippingPackagesQuery,
        shippingPackagesValues
      );
      if (!responseShippingPackage) {
        throw new Error("Shipping Package Insertion Failed");
      }
    }
    await client.query("COMMIT");
    console.log(" Sales Table Data inserted Succesfully");
  } catch (error) {
    if (client) client.query("ROLLBACK");
    console.log("Error is :- " + error.message, error.status, error);
  } finally {
    if (client) client.release();
  }
}

async function refreshSalesOrders() {
  console.log("Refreshing Sales orders");

  try {
    await fetchAndUpsertAllSaleOrders();
    console.log("Orders Refreshed Successfully");
  } catch (e) {
    console.error("Orders Refreshing Failed");
    console.error(e);
    throw e; // rethrow so the route handler can catch it
  }

  // fetchAndUpsertAllSaleOrders()
  //   .then(() => console.log("Orders Refreshed Successfully"))
  //   .catch((e) => {
  //     console.error("Orders Refreshing Failed");
  //     console.error(e);
  //   });
}

export default refreshSalesOrders;
