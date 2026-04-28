// FIXED server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import discountRoutes from "./routes/discounts.js";
import dashboardRoutes from "./routes/dashboard.js";
import supplierRoutes from "./routes/suppliers.js";

import db from "./config/db.js";
import booksRoutes from "./routes/books.js";
import salesRoutes from "./routes/sales.js";
import customersRoutes from "./routes/customers.js";
import customerDiscountRoutes from "./routes/customerDiscounts.js";

dotenv.config();

const app = express();

// 🔹 MIDDLEWARE
app.use(cors());
app.use(express.json());

// 🔹 ROUTES (ALL BEFORE listen)
app.use("/api/books", booksRoutes); // fetch
app.use("/api/sales", salesRoutes);
app.use("/api/customers", customersRoutes);
app.use("/api/customer-discounts", customerDiscountRoutes);
app.use("/api/discount", discountRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/suppliers", supplierRoutes);
// 🔹 TEST ROUTE
app.get("/", (req, res) => {
  res.send("Backend Running 🚀");
});

// 🔹 SERVER START
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});



