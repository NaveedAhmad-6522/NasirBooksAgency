import express from "express";
import { createSale, getSales, getSaleById } from "../controllers/salesController.js";

const router = express.Router();

router.post("/", createSale);
router.get("/", getSales);

// 🔥 THIS IS NEW
router.get("/:id", getSaleById);

export default router;