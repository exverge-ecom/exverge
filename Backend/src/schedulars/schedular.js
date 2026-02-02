import cron from "node-cron";
import refreshSalesOrders from "../model/fetch.js";
import refreshReturnSaleOrder from "../model/return.js";
// import fetchAndUpsertAllReturnsItems from "../routes/return.js"

export function runAllCrons() {
  //cron job for every 5 minutes
  cron.schedule("* * * * *", async () => {
    await refreshSalesOrders();
    await refreshReturnSaleOrder();
  });
  // cron.schedule("* * * * *",  ()=> refreshReturnSaleOrder());
}
