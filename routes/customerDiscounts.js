import express from "express";
import db from "../config/db.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔥 GET DISCOUNT
router.get("/", verifyToken, (req, res) => {
  const { customer_id, book_id } = req.query;

  db.query(
    "SELECT discount FROM customer_discounts WHERE customer_id = ? AND book_id = ?",
    [customer_id, book_id],
    (err, result) => {
      if (err) {
        console.error("Discount fetch error:", err);
        return res.status(500).json(err);
      }

      res.json(result); // ✅ returns array
    }
  );
});

export default router;