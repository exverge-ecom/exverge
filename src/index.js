import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
import express from "express";
import cors from "cors";
// import fetchRouter from "./routes/fetch.js";
import { runAllCrons } from "./schedulars/schedular.js";

import process from "process";

const app = express();

//Middlewares
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// app.use("/api", fetchRouter);

const port = process.env.PORT || 3001;
if (typeof process !== "undefined" && process.versions && process.versions.node) {
  console.log("Running in Node.js:", process.versions.node);
} else {
  console.log("Not running in Node.js");
}
console.log(port);

app.listen(port, () => {
  console.log(`Listening at ${port}`);
});

runAllCrons();
