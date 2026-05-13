import express from "express";
import {
  createSale,
  getSales,
  getSaleById,
} from "../controllers/salesController.js";

import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", verifyToken, createSale);

router.get("/", verifyToken, getSales);

// 🔥 SALE DETAILS
router.get("/:id", verifyToken, getSaleById);

export default router;