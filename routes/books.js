import express from "express";
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

router.get("/", getBooks);
router.get("/:id", getBookById);
router.post("/add", addBook);
router.get("/search", searchBooks);
router.put("/price/:id", updatePrice);
router.put("/:id", updateBook);
router.put("/toggle/:id", toggleBookStatus);
router.post("/:id/restock", restockBook);
export default router;