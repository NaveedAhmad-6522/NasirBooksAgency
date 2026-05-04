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

const router = express.Router();

router.get("/dashboard", getDashboardReport);
router.get("/sales-details", getSalesDetails);
router.get("/payments-details", getPaymentsDetails);      
router.get("/receivable-details", getReceivableDetails);  
router.get("/payable-details", getPayableDetails);
router.get("/inventory-details", getInventoryDetails);
router.get("/lowstock-details", getLowStockDetails);

router.get("/profit-details", getProfitDetails);
router.get("/customer-returns-details", getCustomerReturnsDetails);
router.get("/supplier-returns-details", getSupplierReturnsDetails);
export default router;