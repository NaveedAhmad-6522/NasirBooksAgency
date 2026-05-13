import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import {
  getBooks,
  searchBooks,
  updatePrice,
  toggleBookStatus,
  addBook,
  getBookById,
  restockBook,
  updateBook   // ✅ ADD THIS
} from "../controllers/booksController.js";
const router = express.Router();

router.get("/", verifyToken, getBooks);
router.get("/:id", verifyToken, getBookById);
router.post("/add", verifyToken, addBook);
router.get("/search", verifyToken, searchBooks);
router.put("/price/:id", verifyToken, updatePrice);
router.put("/:id", verifyToken, updateBook);
router.put("/toggle/:id", verifyToken, toggleBookStatus);
router.post("/:id/restock", verifyToken, restockBook);
export default router;