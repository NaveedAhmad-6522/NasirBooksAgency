import express from "express";
import { getSuppliers ,
    getSupplierInvoiceDetails,
    addSupplier,getSuppliersStats,
    exportSuppliers,
    addSupplierPayment,
    getSupplierLedger
} from "../controllers/suppliersController.js";

const router = express.Router();

router.get("/stats", getSuppliersStats);
router.get("/export", exportSuppliers);
router.post("/payment", addSupplierPayment);
router.get("/:id/invoice/:date", getSupplierInvoiceDetails);
router.get("/:id/ledger", getSupplierLedger);

router.get("/", getSuppliers);
router.post("/", addSupplier);
export default router;