import cron from "node-cron";
import refreshSalesOrders from "../routes/fetch.js";
import refreshReturnSaleOrder from "../routes/return.js";
// import fetchAndUpsertAllReturnsItems from "../routes/return.js"

export function runAllCrons() {
  cron.schedule("* * * * *", async () => {
    await refreshSalesOrders();
    await refreshReturnSaleOrder();
  });
  // cron.schedule("* * * * *",  ()=> refreshReturnSaleOrder());
}
