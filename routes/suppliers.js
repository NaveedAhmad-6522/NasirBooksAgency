import express from "express";
import { getSuppliers ,
    getSupplierInvoiceDetails,
    addSupplier,getSuppliersStats,
    exportSuppliers,
    addSupplierPayment,
    getSupplierLedger,
    getSupplierPaymentDetails,
    updateSupplier,
    deleteSupplier,
    toggleSupplierStatus
    
} from "../controllers/suppliersController.js";

const router = express.Router();

router.get("/stats", getSuppliersStats);
router.get("/export", exportSuppliers);
router.post("/payment", addSupplierPayment);
router.get("/payment/:id", getSupplierPaymentDetails);
router.get("/:id/invoice/:date", getSupplierInvoiceDetails);
router.get("/:id/ledger", getSupplierLedger);
router.put("/:id", updateSupplier);
router.delete("/:id", deleteSupplier);
router.patch("/:id/status", toggleSupplierStatus);
router.get("/", getSuppliers);
router.post("/", addSupplier);
export default router;