import express from "express";
import { getDashboardData ,getLowStock} from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/", getDashboardData);
router.get("/low-stock", getLowStock);
export default router;