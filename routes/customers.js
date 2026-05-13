import express from "express";
import {
  searchCustomers,
  createCustomer,
  getCustomerLedger,
  getCustomerStats,
  addPayment,
  exportCustomers,
  getCustomerSales,
  addCustomerReturn,
  getCustomerById,
  updateLedgerTransaction
} from "../controllers/customersController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔍 SEARCH + PAGINATION
router.get("/", verifyToken, searchCustomers);

// ➕ CREATE CUSTOMER
router.post("/", verifyToken, createCustomer);

// 💰 ADD PAYMENT
router.post("/payment", verifyToken, addPayment);

// 📊 CUSTOMER LEDGER
router.get("/:id/ledger", verifyToken, getCustomerLedger);

// 📈 STATS
router.get("/stats", verifyToken, getCustomerStats);
//export
router.get("/export", verifyToken, exportCustomers);

/* =========================
   📚 CUSTOMER SALES (FOR RETURN)
========================= */
router.get("/:id/sales", verifyToken, getCustomerSales);
router.get("/:id", verifyToken, getCustomerById);
/* =========================
   🔁 CUSTOMER RETURN
========================= */
router.post("/return", verifyToken, addCustomerReturn);

/* =========================
   ✏️ UPDATE LEDGER TRANSACTION
========================= */
router.put("/:customerId/ledger/:id", verifyToken, updateLedgerTransaction);

export default router;
