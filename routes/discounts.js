import express from "express";
import { saveCustomerDiscount, getCustomerDiscount } from "../controllers/discountController.js";

const router = express.Router();

// 🔥 GET DISCOUNT
router.get("/", getCustomerDiscount);
router.post("/", saveCustomerDiscount);

export default router;