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
    toggleSupplierStatus,
    returnToSupplier,
    getSupplierBooks
    
} from "../controllers/suppliersController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/stats", verifyToken, getSuppliersStats);
router.get("/export", verifyToken, exportSuppliers);
router.post("/payment", verifyToken, addSupplierPayment);
router.get("/payment/:id", verifyToken, getSupplierPaymentDetails);
router.get("/:id/invoice/:date", verifyToken, getSupplierInvoiceDetails);
router.get("/:id/ledger", verifyToken, getSupplierLedger);
router.get("/:id/books", verifyToken, getSupplierBooks);
router.post("/return", verifyToken, returnToSupplier);
router.put("/:id", verifyToken, updateSupplier);
router.delete("/:id", verifyToken, deleteSupplier);
router.patch("/:id/status", verifyToken, toggleSupplierStatus);
router.get("/", verifyToken, getSuppliers);
router.post("/", verifyToken, addSupplier);
export default router;