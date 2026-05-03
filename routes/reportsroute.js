// routes/reportRoutes.js

import express from "express";
import { getDashboardReport ,getSalesDetails} from "../controllers/reportcontroller.js";
const router = express.Router();

router.get("/sales-details", getSalesDetails);
router.get("/dashboard", getDashboardReport);

export default router;