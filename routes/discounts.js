import express from "express";
import { saveCustomerDiscount, getCustomerDiscount } from "../controllers/discountController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔥 GET DISCOUNT
router.get("/", verifyToken, getCustomerDiscount);
router.post("/", verifyToken, saveCustomerDiscount);

export default router;