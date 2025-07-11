import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
import express from "express";
import cors from "cors";
// import fetchRouter from "./routes/fetch.js";
import { runAllCrons } from "./schedulars/schedular.js";

import process from "process";
import refreshSalesOrders from "./routes/fetch.js";

const app = express();

// Middlewares
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// To health check route
app.get("/", (req, res) => {
  res.send("API is running");
});

// For manually triggering
app.post("/refresh-orders", async (req, res) => {
  try {
    await refreshSalesOrders();
    res.json({ message: "Orders Refreshed Succesfully" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to refresh the order" });
  }
});

// app.use("/api", fetchRouter);

const port = process.env.PORT || 3001;
if (
  typeof process !== "undefined" &&
  process.versions &&
  process.versions.node
) {
  console.log("Running in Node.js:", process.versions.node);
} else {
  console.log("Not running in Node.js");
}
console.log(port);

app.listen(port, () => {
  console.log(`Listening at ${port}`);
});

// Cron will run in the background
runAllCrons();
