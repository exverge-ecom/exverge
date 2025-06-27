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
  fromDateObj.setDate(now.getDate() - 15);
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
      facilityCodes: ["GMT_KH"],
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
        signal: AbortSignal.timeout(15000),
      })
    );

    const batchResults = await Promise.all(fetchPromises);
    results = results.concat(batchResults);
  }

  // console.log(results);

  //checking for failed responses
  const failed = results.filter((val) => !val.ok);
  if (failed.length > 0) {
    const errors = await Promise.all(failed.map((res) => res.text()));
    throw new Error("Some requests failed: " + errors.join("; "));
  }
  const ordersDataOrSearchItemsArrays = await Promise.all(
    results.map((r) => r.json())
  );

  const passedOrdersDataOrSearchItemsArray =
    ordersDataOrSearchItemsArrays.filter((data) => data.successful === true);

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
        facilityCodes: ["GMT_KH"],
      })
    );

    // Connecting Database

    client = await dbConnect.connect();
    await client.query("BEGIN");

    //Query for SalesOrder

    const saleOrder = passedOrdersDataArray.map((data) => data.saleOrderDTO);
    //  console.log("sale Order" + saleOrder.length);

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

    // console.log(saleOrder);

    const saleOrderQuery = `INSERT INTO "salesOrder" (

    "Warehouse Identifier",
    code,
    displayOrderCode,
    displayorderdatetime,
    Channel,
    ChannelProcessingTime,
    Status,
    Created,
    Updated,
    FulfillmentTat,
    currencyCode,
    CustomerCode,
    CustomerName,
    CustomerGSTIN,
    CashOnDelivery,
    PaymentInstrument,
    ThirdPartyShipping,
    PacketNumber,
    TrackingNumber
    ) values (
      $1, $2, $3, to_timestamp($4 / 1000.0), $5,
      $6, $7, to_timestamp($8 / 1000.0), to_timestamp($9 / 1000.0), $10, 
      $11, $12, $13, $14, $15, 
      $16, $17, $18, $19
    ) 
    ON CONFLICT (code) DO UPDATE SET
    "Warehouse Identifier" = EXCLUDED."Warehouse Identifier",
    code = EXCLUDED.code,
    displayOrderCode = EXCLUDED.displayOrderCode,
    displayorderdatetime = EXCLUDED.displayorderdatetime,
    Channel = EXCLUDED.Channel,
    ChannelProcessingTime = EXCLUDED.ChannelProcessingTime,
    Status = EXCLUDED.Status,
    Created = EXCLUDED.Created,
    Updated = EXCLUDED.Updated,
    FulfillmentTat = EXCLUDED.FulfillmentTat,
    currencyCode = EXCLUDED.currencyCode,
    CustomerCode = EXCLUDED.CustomerCode,
    CustomerName = EXCLUDED.CustomerName,
    CustomerGSTIN = EXCLUDED.CustomerGSTIN,
    CashOnDelivery = EXCLUDED.CashOnDelivery,
    PaymentInstrument = EXCLUDED.PaymentInstrument,
    ThirdPartyShipping = EXCLUDED.ThirdPartyShipping,
    PacketNumber = EXCLUDED.PacketNumber,
    TrackingNumber = EXCLUDED.TrackingNumber
    RETURNING "orderid";`;

    let index = 0;

    for (const saleOrderElement of saleOrder) {
      const values = [
        saleOrderElement?.saleOrderItems[0]?.facilityCode || null,
        saleOrderElement?.code,
        saleOrderElement?.displayOrderCode,
        saleOrderElement?.displayOrderDateTime,
        saleOrderElement?.channel || null,
        saleOrderElement?.channelProcessingTime || null,
        saleOrderElement?.status || null,
        saleOrderElement.created,
        saleOrderElement?.updated,
        saleOrderElement?.fulfillmentTat || null,
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

      const orderid = responseSaleOrder.rows[0].orderid;

      //Query for saleOrderItems table.

      // console.log(saleOrderItem);

      const saleOrderItemQuery = `INSERT INTO "saleOrderItems" (
    
     orderid,
     ShippingPackageCode, 
     ShippingPackageStatus,
     facilitycode,
     FacilityName,
     ItemName,
     ItemSku,
     SellerSkuCode,
     skudescription,
     Category,
     ChannelProductId,
     StatusCode,
     brand,
     ShippingMethodCode,
     Code,
     PacketNumber,
     GiftWrap,
     CurrencyCode,
     TaxExempted,
     FulfillmentTat,
     TotalPrice,
     SellingPrice,
     PrepaidAmount,
     Discount,
     ShippingCharges,
     StoreCredit,
     GiftWrapCharges,
     Cancellable
     ) VALUES ( 
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9, $10, 
      $11, $12, $13, $14,
      $15, $16, $17, $18, 
      $19, to_timestamp($20 / 1000.0), $21, $22, 
      $23, $24, $25, $26, 
      $27, $28
) ON CONFLICT ( code ) DO UPDATE SET
     orderid = EXCLUDED.orderid,
     ShippingPackageCode = EXCLUDED.ShippingPackageCode,
     ShippingPackageStatus = EXCLUDED.ShippingPackageStatus,
     facilitycode = EXCLUDED.facilitycode,
     FacilityName = EXCLUDED.FacilityName,
     ItemName = EXCLUDED.ItemName,
     ItemSku = EXCLUDED.ItemSku,
     SellerSkuCode = EXCLUDED.SellerSkuCode,
     skudescription = EXCLUDED.skudescription,
     Category = EXCLUDED.Category,
     ChannelProductId = EXCLUDED.ChannelProductId,
     StatusCode = EXCLUDED.StatusCode,
     brand = EXCLUDED.brand,
     ShippingMethodCode = EXCLUDED.ShippingMethodCode,
     Code = EXCLUDED.Code,
     PacketNumber = EXCLUDED.PacketNumber,
     GiftWrap = EXCLUDED.GiftWrap,
     CurrencyCode = EXCLUDED.CurrencyCode,
     TaxExempted = EXCLUDED.TaxExempted,
     FulfillmentTat = EXCLUDED.FulfillmentTat,
     TotalPrice = EXCLUDED.TotalPrice,
     SellingPrice = EXCLUDED.SellingPrice,
     PrepaidAmount = EXCLUDED.PrepaidAmount,
     Discount = EXCLUDED.Discount,
     ShippingCharges = EXCLUDED.ShippingCharges,
     StoreCredit = EXCLUDED.StoreCredit,
     GiftWrapCharges = EXCLUDED.GiftWrapCharges,
     Cancellable = EXCLUDED.Cancellable
`;

      const { fulfillmentTat, currencyCode } = saleOrderElement;
      const saleOrderItemObject = saleOrderElement.saleOrderItems[0];

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
      } = saleOrderItemObject;

      const saleOrderItemValues = [
        orderid,
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
        code,
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

      const responseSaleOrderItem = await client.query(
        saleOrderItemQuery,
        saleOrderItemValues
      );

      if (!responseSaleOrderItem) {
        throw new Error("saleOrderItem Insertion Failed");
      }

      index = index + 1;

      //Inserting table data of billingAddress in Database

      // Insertion Query for billing address
      const billingAddressQuery = `INSERT INTO "billingAddress"(
customercode,
orderid,
name,
addressline1,
addressline2,
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
  $9, $10, $11, $12, 
  $13
)   
    ON CONFLICT (customercode) DO UPDATE SET
    customercode = EXCLUDED.customercode,
    orderid = EXCLUDED.orderid,
    name = EXCLUDED.name,
    addressline1 = EXCLUDED.addressline1,
    addressline2 = EXCLUDED.addressline2,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    country = EXCLUDED.country,
    pincode = EXCLUDED.pincode,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email
`;

      //Destructuring the Object for keys.
      const {
        id,
        name,
        addressLine1,
        addressLine2,
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
        id,
        orderid,
        name === "" || name === "********" ? null : name,
        addressLine1 === "" || addressLine1 === "********"
          ? null
          : addressLine1,
        addressLine2 === "" || addressLine2 === "********"
          ? null
          : addressLine2,
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
    }

    //Query For shippingPackages
    const shippingPackagesQuery = `
      INSERT INTO "shippingPackages" (
      code, 
      saleOrderCode, 
      channel, 
      status, 
      shippingPackageType,
      shippingProvider, 
      shippingMethod, 
      estimatedWeight, 
      actualWeight,
      customer, 
      created, 
      updated, 
      dispatched, 
      delivered,
      invoice, 
      invoiceCode, 
      invoiceDisplayCode, 
      noofitems
    ) VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9,
      $10, to_timestamp($11 / 1000.0), to_timestamp($12 / 1000.0), $13, $14,
      $15, $16, $17, $18
    ) ON CONFLICT ( saleOrderCode ) DO UPDATE SET
      code = EXCLUDED.code, 
      saleOrderCode = EXCLUDED.saleOrderCode, 
      channel = EXCLUDED.channel, 
      status = EXCLUDED.status, 
      shippingPackageType = EXCLUDED.shippingPackageType,
      shippingProvider= EXCLUDED.shippingProvider, 
      shippingMethod= EXCLUDED.shippingMethod, 
      estimatedWeight= EXCLUDED.estimatedWeight, 
      actualWeight= EXCLUDED.actualWeight,
      customer= EXCLUDED.customer, 
      created= EXCLUDED.created, 
      updated= EXCLUDED.updated, 
      dispatched= EXCLUDED.dispatched, 
      delivered= EXCLUDED.delivered,
      invoice= EXCLUDED.invoice, 
      invoiceCode= EXCLUDED.invoiceCode, 
      invoiceDisplayCode= EXCLUDED.invoiceDisplayCode, 
      noofitems= EXCLUDED.noofitems
   `;

    //  Query for returnSaleOrderItems

    const returnSaleOrderQuery = `INSERT INTO "returnSaleOrderItems"(
    saleordercode,
    saleorderitems,
    code
    ) VALUES (
    $1,
    $2,
    $3
    ) ON CONFLICT ( saleOrderCode ) DO UPDATE SET
      saleordercode = EXCLUDED.saleordercode,
      saleorderitems = EXCLUDED.saleorderitems,
      code = EXCLUDED.code
  `;

    for (let saleOrderElement of saleOrder) {
      //Inserting returnSaleOrderItems table in DB.
      const saleordercode = saleOrderElement.code;
      const saleorderitems = saleOrderElement.saleOrderItems[0].itemSku;

      const returnSaleOrderItemsValues = [
        saleordercode,
        saleordercode,
        saleorderitems,
      ];

      const responseReturnSaleOrderItems = await client.query(
        returnSaleOrderQuery,
        returnSaleOrderItemsValues
      );

      if (!responseReturnSaleOrderItems) {
        throw new Error("ReturnSaleOrderItem Table Insertion Failed");
      }

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
        shippingPackagesObject?.dispatched || null,
        shippingPackagesObject?.delivered || null,
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
    console.log("Table Data inserted Succesfully");
  } catch (error) {
    if (client) client.query("ROLLBACK");
    console.log("Error is :- " + error.message, error.status, error);
  } finally {
    if (client) client.release();
  }
}

function refreshSalesOrders() {
  console.log("Refreshing Sales orders");

  fetchAndUpsertAllSaleOrders()
    .then(() => console.log("Orders Refreshed Successfully"))
    .catch((e) => {
      console.error("Orders Refreshing Failed");
      console.error(e);
    });
}

export default refreshSalesOrders;
