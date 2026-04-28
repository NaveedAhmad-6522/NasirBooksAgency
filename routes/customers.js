import express from "express";
import {
  searchCustomers,
  createCustomer,
  getCustomerLedger,
  getCustomerStats,
  addPayment,
  exportCustomers   // ✅ include here ONCE
} from "../controllers/customersController.js";

const router = express.Router();

// 🔍 SEARCH + PAGINATION
router.get("/", searchCustomers);

// ➕ CREATE CUSTOMER
router.post("/", createCustomer);

// 💰 ADD PAYMENT
router.post("/payment", addPayment);

// 📊 CUSTOMER LEDGER
router.get("/:id/ledger", getCustomerLedger);

// 📈 STATS
router.get("/stats", getCustomerStats);
//export
router.get("/export", exportCustomers);
export default router;



