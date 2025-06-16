import cron from "node-cron";
import refreshSalesOrders from "../routes/fetch.js";

export function runAllCrons() {
  cron.schedule("* * * * *", () => refreshSalesOrders());
}
