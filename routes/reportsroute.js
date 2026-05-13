import express from "express";
import {
  getDashboardReport,
  getSalesDetails,
  getPaymentsDetails,
  getReceivableDetails,
  getPayableDetails,
  getInventoryDetails,
  getLowStockDetails,
  getProfitDetails,
  getCustomerReturnsDetails,
  getSupplierReturnsDetails
} from "../controllers/reportcontroller.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/dashboard", verifyToken, getDashboardReport);
router.get("/sales-details", verifyToken, getSalesDetails);
router.get("/payments-details", verifyToken, getPaymentsDetails);      
router.get("/receivable-details", verifyToken, getReceivableDetails);  
router.get("/payable-details", verifyToken, getPayableDetails);
router.get("/inventory-details", verifyToken, getInventoryDetails);
router.get("/lowstock-details", verifyToken, getLowStockDetails);

router.get("/profit-details", verifyToken, getProfitDetails);
router.get("/customer-returns-details", verifyToken, getCustomerReturnsDetails);
router.get("/supplier-returns-details", verifyToken, getSupplierReturnsDetails);
export default router;