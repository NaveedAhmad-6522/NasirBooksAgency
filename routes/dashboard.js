import express from "express";
import {
  getDashboardData,
  getLowStock,
} from "../controllers/dashboardController.js";

import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", verifyToken, getDashboardData);

router.get("/low-stock", verifyToken, getLowStock);

export default router;